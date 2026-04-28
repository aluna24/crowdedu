import { useRef, useState, useEffect, useMemo } from "react";
import { format, startOfToday, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Clock, MapPin, User, ShoppingCart, Ticket, Loader2, CalendarIcon, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePassContext, PASS_OPTIONS } from "@/context/PassContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FitnessClass {
  id: string;
  name: string;
  instructor: string;
  day: string;
  time: string;
  location: string;
  current_enrolled: number;
  max_spots: number;
  category: string;
}

const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SEMESTER_START = new Date(2026, 0, 19); // Jan 19, 2026
const SEMESTER_END = new Date(2026, 4, 8);    // May 8, 2026
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const clampToSemester = (d: Date) => {
  if (d < SEMESTER_START) return SEMESTER_START;
  if (d > SEMESTER_END) return SEMESTER_START;
  return d;
};

// Parse "7:00 PM" -> minutes since midnight
const parseClassTime = (t: string): number | null => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + mm;
};

const GroupFitness = () => {
  const [filter, setFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => clampToSemester(new Date()));
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  // Map classId -> reservationId for the current user
  const [reservations, setReservations] = useState<Map<string, string>>(new Map());
  const [reserving, setReserving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { purchasePass, getActivePass, refreshPasses } = usePassContext();
  const { toast } = useToast();
  const passesRef = useRef<HTMLDivElement>(null);

  const activePass = getActivePass();

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      const { data } = await supabase.from("fitness_classes").select("*").neq("status", "cancelled");
      setClasses(data ?? []);
      setLoadingClasses(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!user) { setReservations(new Map()); return; }
    const fetchReservations = async () => {
      const { data } = await supabase
        .from("class_reservations")
        .select("id, class_id")
        .eq("user_id", user.id);
      const m = new Map<string, string>();
      (data ?? []).forEach((r) => m.set(r.class_id, r.id));
      setReservations(m);
    };
    fetchReservations();
  }, [user]);

  // Effective day filter — date selection takes precedence when filter is "All"
  const effectiveDay = useMemo(() => {
    if (filter !== "All") return filter;
    if (selectedDate) return WEEKDAY_NAMES[selectedDate.getDay()];
    return "All";
  }, [filter, selectedDate]);

  const filtered = useMemo(() => {
    const list = effectiveDay === "All" ? classes : classes.filter((c) => c.day === effectiveDay);
    return [...list].sort((a, b) => {
      const ta = parseClassTime(a.time) ?? Number.MAX_SAFE_INTEGER;
      const tb = parseClassTime(b.time) ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }, [classes, effectiveDay]);

  const headerLabel = useMemo(() => {
    if (filter === "All" && selectedDate) return `Classes for ${format(selectedDate, "EEEE, MMM d")}`;
    if (filter !== "All") return `All ${filter} classes`;
    return "All classes";
  }, [filter, selectedDate]);

  const handlePurchase = async (type: typeof PASS_OPTIONS[number]["type"]) => {
    const option = PASS_OPTIONS.find((o) => o.type === type)!;
    await purchasePass(type);
    toast({ title: "Pass Purchased!", description: `You bought a ${option.label} for $${option.price}.` });
  };

  const handleReserve = async (classId: string) => {
    if (!activePass) {
      passesRef.current?.scrollIntoView({ behavior: "smooth" });
      toast({ title: "Pass Required", description: "You need a group fitness pass to reserve a class.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setReserving(classId);
    const { data, error } = await supabase.rpc("reserve_class", {
      p_user_id: user.id,
      p_class_id: classId,
      p_pass_id: activePass.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setReserving(null);
      return;
    }

    const result = data as { success: boolean; error?: string; reservation_id?: string };

    if (!result.success) {
      toast({ title: "Reservation Failed", description: result.error ?? "Unknown error", variant: "destructive" });
      setReserving(null);
      return;
    }

    setReservations((prev) => {
      const next = new Map(prev);
      if (result.reservation_id) next.set(classId, result.reservation_id);
      return next;
    });
    setClasses((prev) =>
      prev.map((c) => c.id === classId ? { ...c, current_enrolled: c.current_enrolled + 1 } : c)
    );
    await refreshPasses();
    setReserving(null);

    const updatedPass = getActivePass();
    toast({
      title: "Spot Reserved!",
      description: updatedPass?.classesRemaining !== null
        ? `${updatedPass?.classesRemaining ?? 0} classes remaining on your pass.`
        : "Semester pass — unlimited classes.",
    });
  };

  const handleCancel = async (classId: string) => {
    if (!user) return;
    const reservationId = reservations.get(classId);
    if (!reservationId) return;

    setCancelling(classId);
    const { data, error } = await supabase.rpc("cancel_reservation", {
      p_user_id: user.id,
      p_reservation_id: reservationId,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setCancelling(null);
      return;
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      toast({ title: "Cancellation Failed", description: result.error ?? "Unknown error", variant: "destructive" });
      setCancelling(null);
      return;
    }

    setReservations((prev) => {
      const next = new Map(prev);
      next.delete(classId);
      return next;
    });
    setClasses((prev) =>
      prev.map((c) => c.id === classId ? { ...c, current_enrolled: Math.max(c.current_enrolled - 1, 0) } : c)
    );
    await refreshPasses();
    setCancelling(null);
    toast({ title: "Reservation Cancelled", description: "Your class credit has been refunded." });
  };

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Group Fitness</h1>
      <p className="mt-1 text-sm text-muted-foreground">Browse the weekly schedule and reserve your spot.</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Spring 2026 schedule: January 19 – May 8</p>

      {/* Pass purchase section */}
      <div ref={passesRef} className="mt-6">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" /> Group Fitness Passes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Purchase a pass to reserve spots in classes.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PASS_OPTIONS.map((opt) => (
            <Card key={opt.type} className="relative overflow-hidden">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <span className="text-2xl font-bold text-foreground">${opt.price}</span>
                <span className="mt-1 text-sm font-medium text-foreground">{opt.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {opt.classes === null ? "Unlimited classes" : `${opt.classes} class${opt.classes > 1 ? "es" : ""}`}
                </span>
                {isAuthenticated ? (
                  <Button size="sm" className="mt-3 w-full gap-1.5" onClick={() => handlePurchase(opt.type)}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Buy
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="mt-3 w-full" disabled>
                    Log in to purchase
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isAuthenticated && (
        <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
          {activePass ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">Active Pass:</span>{" "}
              {PASS_OPTIONS.find((o) => o.type === activePass.type)?.label} —{" "}
              {activePass.classesRemaining === null
                ? "Unlimited classes remaining"
                : `${activePass.classesRemaining} class${activePass.classesRemaining !== 1 ? "es" : ""} remaining`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active pass. Purchase one above to reserve classes.</p>
          )}
        </div>
      )}

      {/* Calendar + day filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Button
              key={d}
              variant={filter === d ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(d)}
            >
              {d}
            </Button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("justify-start gap-2", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                if (d) setFilter("All");
              }}
              defaultMonth={selectedDate ?? SEMESTER_START}
              disabled={(date) => date < SEMESTER_START || date > SEMESTER_END || date < startOfToday()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">{headerLabel}</h3>
      </div>

      <div className="mt-3 space-y-3">
        {loadingClasses && <p className="text-sm text-muted-foreground">Loading classes...</p>}
        {!loadingClasses && filtered.length === 0 && <p className="text-sm text-muted-foreground">No classes scheduled.</p>}
        {filtered.map((cls) => {
          const full = cls.current_enrolled >= cls.max_spots;
          const isReserved = reservations.has(cls.id);
          const isReserving = reserving === cls.id;
          const isCancelling = cancelling === cls.id;
          // If a specific date is selected and it's today, block classes whose time has passed
          const classMinutes = parseClassTime(cls.time);
          const now = new Date();
          const isPast =
            !!selectedDate &&
            isSameDay(selectedDate, now) &&
            classMinutes !== null &&
            classMinutes <= now.getHours() * 60 + now.getMinutes();
          return (
            <Card key={cls.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground">{cls.name}</h3>
                    <Badge variant="secondary" className="text-xs">{cls.category}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{cls.instructor}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{cls.day} · {cls.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cls.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${full ? "text-destructive" : "text-muted-foreground"}`}>
                    {cls.current_enrolled}/{cls.max_spots} enrolled
                  </span>
                  {isReserved ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm font-medium text-capacity-low">
                        <CheckCircle className="h-4 w-4" /> Reserved
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1.5" disabled={isCancelling}>
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel reservation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You'll lose your spot in {cls.name} ({cls.day} · {cls.time}).
                              {activePass?.classesRemaining !== null && " Your class credit will be refunded to your pass."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(cls.id)}>
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : isPast ? (
                    <Button size="sm" variant="outline" disabled>Past</Button>
                  ) : !isAuthenticated ? (
                    <Button size="sm" variant="outline" disabled>Log in</Button>
                  ) : !activePass ? (
                    <Button size="sm" variant="secondary" onClick={() => passesRef.current?.scrollIntoView({ behavior: "smooth" })}>
                      Buy a Pass
                    </Button>
                  ) : (
                    <Button size="sm" disabled={full || isReserving} onClick={() => handleReserve(cls.id)}>
                      {isReserving ? <Loader2 className="h-4 w-4 animate-spin" /> : full ? "Full" : "Reserve"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GroupFitness;
