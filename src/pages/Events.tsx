import { useGym } from "@/context/GymContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Megaphone, PartyPopper } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "event" | "closure" | "news";
}

const mockEvents: Event[] = [
  { id: "1", title: "Spring Fitness Challenge", date: "Apr 7 – Apr 21", description: "Compete in weekly fitness challenges for prizes. Sign up at the front desk or online.", type: "event" },
  { id: "2", title: "Pool Maintenance Closure", date: "Mar 29 – Mar 31", description: "The pool area will be closed for scheduled maintenance. All other areas remain open.", type: "closure" },
  { id: "3", title: "New Climbing Wall Hours", date: "Starting Apr 1", description: "The climbing wall will now be open until 9 PM on weekdays due to popular demand.", type: "news" },
  { id: "4", title: "Intramural Basketball Finals", date: "Apr 18", description: "Come watch the championship game at the 4th Floor Courts at 7 PM. Free admission.", type: "event" },
  { id: "5", title: "Summer Membership Registration", date: "Opens May 1", description: "Summer memberships for non-students will be available starting May 1.", type: "news" },
];

const typeConfig = {
  event: { icon: PartyPopper, badge: "Event", variant: "secondary" as const },
  closure: { icon: AlertTriangle, badge: "Closure", variant: "destructive" as const },
  news: { icon: Megaphone, badge: "News", variant: "outline" as const },
};

const Events = () => {
  const { announcement } = useGym();

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Events & Announcements</h1>
      <p className="mt-1 text-sm text-muted-foreground">Stay up to date with closures, events, and rec center news.</p>

      {/* Admin announcement banner */}
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
        {mockEvents.map((evt) => {
          const cfg = typeConfig[evt.type];
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
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {evt.date}
                  </p>
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
