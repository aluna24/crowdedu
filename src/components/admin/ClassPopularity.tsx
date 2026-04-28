import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Flame, Snowflake, Clock, CalendarDays } from "lucide-react";

interface Row {
  id: string;
  name: string;
  day: string;
  time: string;
  count: number;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseHour = (t: string): number => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 12;
  let h = parseInt(m[1], 10);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h;
};

const timeBucket = (h: number): "Morning" | "Midday" | "Evening" =>
  h < 12 ? "Morning" : h < 17 ? "Midday" : "Evening";

const ClassPopularity = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: classes }, { data: reservations }] = await Promise.all([
        supabase.from("fitness_classes").select("id, name, day, time, status"),
        supabase.from("class_reservations").select("class_id"),
      ]);
      const counts = new Map<string, number>();
      (reservations ?? []).forEach((r) => {
        counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
      });
      const merged: Row[] = (classes ?? [])
        .filter((c: { status?: string }) => c.status !== "cancelled")
        .map((c: { id: string; name: string; day: string; time: string }) => ({
          id: c.id,
          name: c.name,
          day: c.day,
          time: c.time,
          count: counts.get(c.id) ?? 0,
        }));
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  const top = useMemo(() => [...rows].sort((a, b) => b.count - a.count).slice(0, 5), [rows]);
  const bottom = useMemo(() => [...rows].sort((a, b) => a.count - b.count).slice(0, 5), [rows]);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    DAY_ORDER.forEach((d) => m.set(d, 0));
    rows.forEach((r) => m.set(r.day, (m.get(r.day) ?? 0) + r.count));
    return DAY_ORDER.map((day) => ({ day: day.slice(0, 3), count: m.get(day) ?? 0 }));
  }, [rows]);

  const byBucket = useMemo(() => {
    const m = new Map<string, number>([["Morning", 0], ["Midday", 0], ["Evening", 0]]);
    rows.forEach((r) => {
      const b = timeBucket(parseHour(r.time));
      m.set(b, (m.get(b) ?? 0) + r.count);
    });
    return ["Morning", "Midday", "Evening"].map((bucket) => ({ bucket, count: m.get(bucket) ?? 0 }));
  }, [rows]);

  const cfg = { count: { label: "Reservations", color: "hsl(var(--primary))" } };

  if (loading) return <div className="h-64 animate-pulse rounded-md bg-muted" />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-capacity-high" /> Most popular classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top.every((r) => r.count === 0) ? (
            <p className="text-sm text-muted-foreground">No reservations yet.</p>
          ) : (
            <ul className="space-y-2">
              {top.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    {r.name} <span className="text-muted-foreground">· {r.day.slice(0, 3)} {r.time}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="h-4 w-4 text-capacity-low" /> Least popular classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bottom.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {r.name} <span className="text-muted-foreground">· {r.day.slice(0, 3)} {r.time}</span>
                </span>
                <span className="font-semibold tabular-nums">{r.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Reservations by day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cfg} className="h-44 w-full">
            <BarChart data={byDay} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-accent" /> Popular time of day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cfg} className="h-44 w-full">
            <BarChart data={byBucket} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassPopularity;
