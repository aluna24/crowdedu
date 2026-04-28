import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Wrench, ClipboardList, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FLOOR_DB_MAP, AREA_CAPACITY, TOTAL_CAPACITY_ALL } from "@/context/GymContext";
import { useReservationRequests } from "@/context/ReservationRequestsContext";

interface Kpi {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}

const AdminKpiCards = () => {
  const { requests } = useReservationRequests();
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [weekAvgPct, setWeekAvgPct] = useState<number | null>(null);
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [activeTeams, setActiveTeams] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("facility_count")
        .select("*")
        .order("Entry_num", { ascending: false })
        .limit(2000);
      if (data && data.length) {
        // today's most recent rolling sum
        const last = data[0] as Record<string, unknown>;
        let total = 0;
        for (const col of Object.values(FLOOR_DB_MAP)) total += Number(last[col] ?? 0);
        setTodayCount(total);

        // weekly avg % full
        let sumPct = 0;
        let n = 0;
        for (const r of data.slice(0, 168)) {
          let c = 0;
          let cap = 0;
          for (const col of Object.values(FLOOR_DB_MAP)) {
            c += Number((r as Record<string, unknown>)[col] ?? 0);
            cap += AREA_CAPACITY[col] ?? 0;
          }
          if (cap > 0) {
            sumPct += (c / cap) * 100;
            n++;
          }
        }
        setWeekAvgPct(n > 0 ? Math.round(sumPct / n) : 0);
      } else {
        setTodayCount(0);
        setWeekAvgPct(0);
      }

      const { count: ticketCount } = await supabase
        .from("equipment_tickets")
        .select("*", { count: "exact", head: true })
        .neq("review_status", "resolved");
      setOpenTickets(ticketCount ?? 0);

      const { count: teamCount } = await supabase
        .from("intramural_teams")
        .select("*", { count: "exact", head: true });
      setActiveTeams(teamCount ?? 0);
    })();
  }, []);

  const pendingResv = requests.filter((r) => r.status === "pending").length;

  const kpis: Kpi[] = [
    {
      label: "Current count",
      value: todayCount === null ? "—" : `${todayCount}`,
      sub: `of ${TOTAL_CAPACITY_ALL} capacity`,
      icon: Users,
      accent: "text-primary",
    },
    {
      label: "Week avg % full",
      value: weekAvgPct === null ? "—" : `${weekAvgPct}%`,
      sub: "Last ~7 days",
      icon: Activity,
      accent: "text-accent",
    },
    {
      label: "Open tickets",
      value: openTickets === null ? "—" : `${openTickets}`,
      sub: "Equipment maintenance",
      icon: Wrench,
      accent: "text-capacity-moderate",
    },
    {
      label: "Pending requests",
      value: `${pendingResv}`,
      sub: "Space reservations",
      icon: ClipboardList,
      accent: "text-capacity-high",
    },
    {
      label: "Active teams",
      value: activeTeams === null ? "—" : `${activeTeams}`,
      sub: "Intramurals",
      icon: Trophy,
      accent: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </span>
                <Icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">{k.value}</div>
              {k.sub && <div className="mt-0.5 text-xs text-muted-foreground">{k.sub}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminKpiCards;
