import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { mockSports, parseTeamName } from "@/pages/Intramurals";

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

// Parse "7:00 PM" -> { h, m } in 24h
const parseTime = (t: string): { h: number; m: number } | null => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { h, m: mm };
};

// Compute next occurrence of a given weekday/time at-or-after a base date.
const nextOccurrence = (baseISO: string, dayName: string, time: string, now: Date): Date | null => {
  const parsed = parseTime(time);
  if (!parsed) return null;
  const targetDow = DAY_INDEX[dayName];
  if (targetDow === undefined) return null;

  const base = new Date(baseISO + "T12:00:00");
  // Advance base to first matching weekday on or after seasonStart
  const baseDow = base.getDay();
  const initialOffset = (targetDow - baseDow + 7) % 7;
  const firstGame = new Date(base);
  firstGame.setDate(base.getDate() + initialOffset);
  firstGame.setHours(parsed.h, parsed.m, 0, 0);

  // The "show until" cutoff: 30 minutes after start
  const startCutoff = new Date(now.getTime() - 30 * 60 * 1000);

  // Find the next weekly occurrence whose start time is >= startCutoff
  let candidate = new Date(firstGame);
  while (candidate < startCutoff) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
};

interface UpcomingGame {
  teamId: string;
  teamName: string;
  sportName: string;
  date: Date;
  division: string | null;
  day: string;
  time: string;
}

const formatCountdown = (target: Date, now: Date): string => {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Starting now";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days >= 2) return `In ${days} days`;
  if (days === 1) return "Tomorrow";
  if (hours >= 1) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
};

const formatDateTime = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const UpcomingGames = () => {
  const { user, isAuthenticated } = useAuth();
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [now, setNow] = useState(new Date());

  // tick every 60s so countdown stays fresh and games drop off after +30m
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGames([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // Captained teams
      const captainedQ = supabase
        .from("intramural_teams")
        .select("id, sport_id, team_name");
      const { data: captained } = await captainedQ.eq("captain_user_id", user.id);

      // Member teams (accepted invites where member_email matches user.email)
      const { data: memberRows } = await supabase
        .from("intramural_team_members")
        .select("team_id, status, intramural_teams(id, sport_id, team_name)")
        .eq("member_email", user.email)
        .eq("status", "accepted");

      const memberTeams = (memberRows ?? [])
        .map((r: any) => r.intramural_teams)
        .filter(Boolean) as { id: string; sport_id: string; team_name: string }[];

      const seen = new Set<string>();
      const all = [...(captained ?? []), ...memberTeams].filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      const computed: UpcomingGame[] = [];
      for (const t of all) {
        const sport = mockSports.find((s) => s.id === t.sport_id);
        if (!sport) continue;
        const { division, day, time, name } = parseTeamName(t.team_name);
        if (!day || !time) continue;
        const next = nextOccurrence(sport.seasonStart, day, time, new Date());
        if (!next) continue;
        // Only show within the regular season + playoff window: stop after seasonStart + 9 weeks
        const seasonEnd = new Date(sport.seasonStart + "T12:00:00");
        seasonEnd.setDate(seasonEnd.getDate() + 9 * 7);
        if (next > seasonEnd) continue;
        computed.push({
          teamId: t.id,
          teamName: name,
          sportName: sport.name,
          date: next,
          division,
          day,
          time,
        });
      }
      computed.sort((a, b) => a.date.getTime() - b.date.getTime());
      if (!cancelled) setGames(computed);
    })();
    return () => { cancelled = true; };
  }, [user, isAuthenticated, now.getMinutes() % 5 === 0 ? Math.floor(now.getTime() / (5 * 60_000)) : 0]);

  // Filter out anything past the +30 minute cutoff in real time
  const visible = useMemo(
    () => games.filter((g) => g.date.getTime() > now.getTime() - 30 * 60_000),
    [games, now]
  );

  if (!isAuthenticated || visible.length === 0) return null;

  return (
    <Card className="mx-auto mt-8 max-w-3xl border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-display text-base font-semibold text-foreground">Your upcoming intramural games</h2>
        </div>
        <div className="mt-3 space-y-2">
          {visible.map((g, i) => {
            const within24h = g.date.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
            return (
              <Link
                key={`${g.teamId}-${i}`}
                to="/intramurals"
                className={`flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent ${within24h ? "border-primary/40" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{g.teamName} <span className="text-muted-foreground font-normal">· {g.sportName}</span></p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {g.division && <span>{g.division}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateTime(g.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {g.time}</span>
                  </div>
                </div>
                <Badge variant={within24h ? "default" : "secondary"} className="shrink-0">{formatCountdown(g.date, now)}</Badge>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingGames;
