import { useEffect, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGym } from "@/context/GymContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const STALE_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const CapacityReminderButton = () => {
  const { lastUpdated, activeReminder, createReminder } = useGym();
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  // Tick once a second so countdowns / staleness update live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isStale = now - lastUpdated.getTime() > STALE_MS;

  // Don't show on staff/admin views
  if (user?.role === "employee" || user?.role === "admin") return null;

  if (activeReminder) {
    const elapsed = now - new Date(activeReminder.created_at).getTime();
    const remaining = Math.max(COOLDOWN_MS - elapsed, 0);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-capacity-low" />
        <span>
          Staff have been notified · ready again in{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </span>
      </div>
    );
  }

  if (!isStale) return null;

  const handleClick = async () => {
    setSubmitting(true);
    const res = await createReminder(user?.id);
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Staff notified", description: "Thanks for the heads-up!" });
    } else {
      toast({
        title: "Couldn't send reminder",
        description: res.error ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={submitting}
      variant="outline"
      className="mt-3 gap-2 rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
    >
      <BellRing className="h-4 w-4" />
      Remind staff to update capacity
    </Button>
  );
};

export default CapacityReminderButton;
