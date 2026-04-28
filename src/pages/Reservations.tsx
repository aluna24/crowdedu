import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ReservationsGrid from "@/components/ReservationsGrid";
import ReserveSpaceDialog from "@/components/ReserveSpaceDialog";
import MyReservationRequests from "@/components/MyReservationRequests";
import { useAuth } from "@/context/AuthContext";
import { COLOR_CLASSES } from "@/data/reservationsSeed";

const VIEWS = ["Day", "Week", "Month", "Space"] as const;
type View = typeof VIEWS[number];

const LEGEND: { label: string; color: keyof typeof COLOR_CLASSES }[] = [
  { label: "Varsity / NROTC", color: "red" },
  { label: "Club Practice", color: "green" },
  { label: "Training", color: "blue" },
  { label: "Group Fitness", color: "pink" },
  { label: "Academic", color: "orange" },
  { label: "Community", color: "teal" },
  { label: "Squash Club", color: "yellow" },
  { label: "Wrestling", color: "black" },
];

const Reservations = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("Day");
  const { user } = useAuth();
  const isStudent = !user || user.role === "student";

  const weekday = useMemo(() => date.getDay(), [date]);

  return (
    <main className="container py-6 md:py-8">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Facility Scheduling
          </h1>
          <p className="text-sm text-muted-foreground">
            View bookings across every space in the facility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isStudent && <ReserveSpaceDialog />}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "EEE, MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center rounded-md border border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(addDays(date, -7))}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(addDays(date, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 font-semibold uppercase tracking-wide" onClick={() => setDate(new Date())}>
              {format(date, "EEE, MMM d")}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(addDays(date, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(addDays(date, 7))}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center rounded-md border border-border">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isStudent && <MyReservationRequests />}

      {view === "Day" ? (
        <ReservationsGrid weekday={weekday} />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{view} view</span> is coming soon. Switch to Day view to see today's schedule.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-muted-foreground uppercase tracking-wide">Legend:</span>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-3 w-4 rounded-sm border", COLOR_CLASSES[l.color])} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Reservations;
