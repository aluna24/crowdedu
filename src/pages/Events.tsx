import { useEffect, useState } from "react";
import { useGym } from "@/context/GymContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Megaphone, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  date_label: string;
  description: string;
  type: "event" | "closure" | "news";
  priority: number;
}

const typeConfig = {
  event: { icon: PartyPopper, badge: "Event", variant: "secondary" as const },
  closure: { icon: AlertTriangle, badge: "Closure", variant: "destructive" as const },
  news: { icon: Megaphone, badge: "News", variant: "outline" as const },
};

const Events = () => {
  const { announcement } = useGym();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("priority")
        .order("created_at");
      setEvents((data as Event[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Events & Announcements</h1>
      <p className="mt-1 text-sm text-muted-foreground">Stay up to date with closures, events, and rec center news.</p>

      {announcement && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-capacity-moderate/30 bg-capacity-moderate-bg p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-capacity-moderate" />
          <div>
            <p className="text-sm font-semibold text-foreground">Staff Announcement</p>
            <p className="mt-1 text-sm text-muted-foreground">{announcement}</p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">No events posted.</p>
        )}
        {events.map((evt) => {
          const cfg = typeConfig[evt.type] ?? typeConfig.event;
          const Icon = cfg.icon;
          return (
            <Card key={evt.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground">{evt.title}</h3>
                    <Badge variant={cfg.variant} className="text-xs">{cfg.badge}</Badge>
                  </div>
                  {evt.date_label && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {evt.date_label}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm text-muted-foreground">{evt.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Events;
