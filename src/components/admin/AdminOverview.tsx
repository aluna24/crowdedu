import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wrench, Trophy, ClipboardList } from "lucide-react";
import { useReservationRequests } from "@/context/ReservationRequestsContext";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  kind: "ticket" | "team" | "reservation";
  title: string;
  sub: string;
  at: Date;
}

const AdminOverview = () => {
  const { requests } = useReservationRequests();
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      const [tickets, teams] = await Promise.all([
        supabase
          .from("equipment_tickets")
          .select("id, equipment_name, employee_name, created_at, review_status")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("intramural_teams")
          .select("id, team_name, captain_name, sport_id, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const items: FeedItem[] = [];
      (tickets.data ?? []).forEach((t) => {
        items.push({
          id: `t-${t.id}`,
          kind: "ticket",
          title: `Ticket: ${t.equipment_name}`,
          sub: `By ${t.employee_name} · ${t.review_status}`,
          at: new Date(t.created_at as string),
        });
      });
      (teams.data ?? []).forEach((t) => {
        items.push({
          id: `tm-${t.id}`,
          kind: "team",
          title: `Team registered: ${t.team_name}`,
          sub: `Captain ${t.captain_name}`,
          at: new Date(t.created_at as string),
        });
      });
      requests.slice(0, 8).forEach((r) => {
        items.push({
          id: `r-${r.id}`,
          kind: "reservation",
          title: `Reservation request: ${r.space}`,
          sub: `${r.name} · ${r.status}`,
          at: new Date(r.createdAt),
        });
      });
      items.sort((a, b) => b.at.getTime() - a.at.getTime());
      setFeed(items.slice(0, 12));
    })();
  }, [requests]);

  const iconFor = (k: FeedItem["kind"]) => {
    if (k === "ticket") return Wrench;
    if (k === "team") return Trophy;
    return ClipboardList;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" /> Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {feed.map((f) => {
              const Icon = iconFor(f.kind);
              return (
                <li key={f.id} className="flex items-start gap-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{f.kind}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {f.sub} · {formatDistanceToNow(f.at, { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverview;
