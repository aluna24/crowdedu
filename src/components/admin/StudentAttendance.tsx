import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy } from "lucide-react";

interface Reservation {
  user_id: string;
  reserved_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface LeaderRow {
  userId: string;
  name: string;
  email: string;
  total: number;
  thisWeek: number;
}

const MILESTONES = [500, 250, 100, 50, 25, 10];

const milestoneFor = (n: number): number | null => {
  for (const m of MILESTONES) if (n >= m) return m;
  return null;
};

const StudentAttendance = () => {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [recentMilestones, setRecentMilestones] = useState<{ name: string; milestone: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: reservations } = await supabase
        .from("class_reservations")
        .select("user_id, reserved_at");

      const list = (reservations ?? []) as Reservation[];
      const userIds = Array.from(new Set(list.map((r) => r.user_id)));

      // Profiles use uuid for id; user_id in reservations is text. Try matching anyway.
      let profiles: Profile[] = [];
      if (userIds.length) {
        const { data: pdata } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        profiles = (pdata as Profile[]) ?? [];
      }
      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const tally = new Map<string, { total: number; thisWeek: number }>();
      for (const r of list) {
        const t = tally.get(r.user_id) ?? { total: 0, thisWeek: 0 };
        t.total++;
        if (new Date(r.reserved_at).getTime() >= weekAgo) t.thisWeek++;
        tally.set(r.user_id, t);
      }

      const leader: LeaderRow[] = Array.from(tally.entries())
        .map(([userId, t]) => {
          const p = profileMap.get(userId);
          return {
            userId,
            name: p?.full_name || p?.email?.split("@")[0] || `Student ${userId.slice(0, 6)}`,
            email: p?.email ?? "",
            total: t.total,
            thisWeek: t.thisWeek,
          };
        })
        .sort((a, b) => b.total - a.total);

      setRows(leader);

      // Newly hit milestones: total reached threshold AND total - thisWeek was below threshold
      const newly: { name: string; milestone: number }[] = [];
      for (const r of leader) {
        const before = r.total - r.thisWeek;
        for (const m of MILESTONES) {
          if (r.total >= m && before < m) {
            newly.push({ name: r.name, milestone: m });
            break;
          }
        }
      }
      setRecentMilestones(newly);
      setLoading(false);
    })();
  }, []);

  const top = useMemo(() => rows.slice(0, 25), [rows]);

  if (loading) return <div className="h-48 animate-pulse rounded-md bg-muted" />;

  return (
    <div className="space-y-4">
      {recentMilestones.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" /> Milestones hit this week
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recentMilestones.map((m, i) => (
              <Badge key={i} variant="secondary" className="text-sm">
                {m.name} · {m.milestone} classes
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" /> Class reservation leaderboard
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Tracks classes reserved (used as attendance proxy). Add a check-in flow later for true attendance.
          </p>
        </CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservations yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-right">Classes reserved</th>
                    <th className="px-3 py-2 text-right">This week</th>
                    <th className="px-3 py-2 text-left">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((r, i) => {
                    const ms = milestoneFor(r.total);
                    return (
                      <tr key={r.userId} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{r.name}</div>
                          {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.total}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.thisWeek}</td>
                        <td className="px-3 py-2">
                          {ms ? <Badge variant="secondary">{ms}+ club</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
