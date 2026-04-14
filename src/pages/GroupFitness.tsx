import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, User, ShoppingCart, Ticket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePass_context, PASS_OPTIONS } from "@/context/PassContext";
import { useToast } from "@/hooks/use-toast";

interface FitnessClass {
  id: string;
  name: string;
  instructor: string;
  day: string;
  time: string;
  location: string;
  spots: number;
  maxSpots: number;
  category: string;
}

const mockClasses: FitnessClass[] = [
  { id: "1", name: "Power Yoga", instructor: "Sarah M.", day: "Monday", time: "6:00 AM", location: "3rd Floor Studio", spots: 18, maxSpots: 25, category: "Yoga" },
  { id: "2", name: "Spin Cycle", instructor: "Chris D.", day: "Monday", time: "12:00 PM", location: "P3 Cycling Room", spots: 5, maxSpots: 20, category: "Cardio" },
  { id: "3", name: "HIIT Express", instructor: "Jordan K.", day: "Tuesday", time: "5:30 PM", location: "Fitness Center", spots: 12, maxSpots: 30, category: "HIIT" },
  { id: "4", name: "Pilates Core", instructor: "Mia L.", day: "Wednesday", time: "7:00 AM", location: "3rd Floor Studio", spots: 20, maxSpots: 20, category: "Pilates" },
  { id: "5", name: "Aqua Fit", instructor: "Pat R.", day: "Wednesday", time: "10:00 AM", location: "Pool", spots: 10, maxSpots: 15, category: "Aqua" },
  { id: "6", name: "Zumba", instructor: "Alex T.", day: "Thursday", time: "6:00 PM", location: "3M", spots: 22, maxSpots: 35, category: "Dance" },
  { id: "7", name: "Barbell Strength", instructor: "Sam W.", day: "Friday", time: "4:00 PM", location: "Fitness Center", spots: 8, maxSpots: 15, category: "Strength" },
];

const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const GroupFitness = () => {
  const [filter, setFilter] = useState("All");
  const [reserved, setReserved] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();
  const { purchasePass, usePass: consumePass, getActivePass } = usePass_context();
  const { toast } = useToast();
  const passesRef = useRef<HTMLDivElement>(null);

  const filtered = filter === "All" ? mockClasses : mockClasses.filter((c) => c.day === filter);
  const activePass = getActivePass();

  const handlePurchase = (type: typeof PASS_OPTIONS[number]["type"]) => {
    const option = PASS_OPTIONS.find((o) => o.type === type)!;
    purchasePass(type);
    toast({ title: "Pass Purchased!", description: `You bought a ${option.label} for $${option.price}.` });
  };

  const handleReserve = (id: string) => {
    if (!activePass) {
      passesRef.current?.scrollIntoView({ behavior: "smooth" });
      toast({ title: "Pass Required", description: "You need a group fitness pass to reserve a class.", variant: "destructive" });
      return;
    }
    const ok = consumePass();
    if (ok) {
      setReserved((prev) => new Set(prev).add(id));
      toast({ title: "Spot Reserved!", description: activePass.classesRemaining !== null ? `${(activePass.classesRemaining ?? 1) - 1} classes remaining on your pass.` : "Semester pass — unlimited classes." });
    }
  };

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Group Fitness</h1>
      <p className="mt-1 text-sm text-muted-foreground">Browse the weekly schedule and reserve your spot.</p>

      {/* Pass purchase section */}
      <div ref={passesRef} className="mt-6">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" /> Group Fitness Passes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Purchase a pass to reserve spots in classes.</p>

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

      {/* Active pass status */}
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

      {/* Day filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {days.map((d) => (
          <Button key={d} variant={filter === d ? "default" : "outline"} size="sm" onClick={() => setFilter(d)}>
            {d}
          </Button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No classes scheduled for this day.</p>}
        {filtered.map((cls) => {
          const full = cls.spots >= cls.maxSpots;
          const isReserved = reserved.has(cls.id);
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
                    {cls.spots}/{cls.maxSpots} spots
                  </span>
                  {isReserved ? (
                    <Button size="sm" variant="outline" disabled className="gap-1.5">
                      <CheckCircle className="h-4 w-4 text-capacity-low" /> Reserved
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button size="sm" variant="outline" disabled>Log in</Button>
                  ) : !activePass ? (
                    <Button size="sm" variant="secondary" onClick={() => passesRef.current?.scrollIntoView({ behavior: "smooth" })}>
                      Buy a Pass
                    </Button>
                  ) : (
                    <Button size="sm" disabled={full} onClick={() => handleReserve(cls.id)}>
                      {full ? "Full" : "Reserve"}
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
