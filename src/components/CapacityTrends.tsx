import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FLOOR_DB_MAP,
  AREA_CAPACITY,
  TOTAL_CAPACITY_ALL,
  getStatus,
} from "@/context/GymContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Flame, Moon, Zap, TrendingUp } from "lucide-react";

interface CapacityTrendsProps {
  filterArea?: string | null; // app id (e.g., "fc")
}

interface RawRow {
  Date: string;
  Time: string;
  [k: string]: string | number;
}

interface ParsedRow {
  hour: number; // 0-23
  weekday: number; // 0-6 (Sun..Sat)
  count: number;
  capacity: number;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // ISO-like: 2026-04-21
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) return iso;

  // Short: "13-Feb"
  const m = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    if (mon !== undefined) {
      const year = new Date().getFullYear();
      return new Date(year, mon, day);
    }
  }
  return null;
}

function parseTime(timeStr: string): number | null {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

function formatRange(start: number, end: number): string {
  return `${formatHour(start)} – ${formatHour(end)}`;
}

const CapacityTrends = ({ filterArea }: CapacityTrendsProps) => {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"today" | "all">("today");

  // The DB column we're scoping to (or null = all areas summed)
  const dbColumn = filterArea ? FLOOR_DB_MAP[filterArea] ?? null : null;
  const scopeCapacity = dbColumn
    ? AREA_CAPACITY[dbColumn] ?? 1
    : TOTAL_CAPACITY_ALL;

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("facility_count")
        .select("*")
        .order("Entry_num", { ascending: false })
        .limit(5000);

      if (error || !data || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      const parsed: ParsedRow[] = [];
      for (const r of data as unknown as RawRow[]) {
        const d = parseDate(r.Date);
        const h = parseTime(r.Time);
        if (!d || h === null) continue;

        let count = 0;
        let capacity = 0;
        if (dbColumn) {
          count = Number(r[dbColumn] ?? 0);
          capacity = AREA_CAPACITY[dbColumn] ?? 0;
        } else {
          for (const col of Object.values(FLOOR_DB_MAP)) {
            count += Number(r[col] ?? 0);
            capacity += AREA_CAPACITY[col] ?? 0;
          }
        }
        if (capacity <= 0) continue;
        parsed.push({
          hour: h,
          weekday: d.getDay(),
          count,
          capacity,
        });
      }
      if (!cancelled) {
        setRows(parsed);
        setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [dbColumn]);

  const todayWeekday = new Date().getDay();
  const currentHour = new Date().getHours();

  const filteredRows = useMemo(
    () => (view === "today" ? rows.filter((r) => r.weekday === todayWeekday) : rows),
    [rows, view, todayWeekday]
  );

  // Bucket by hour
  const buckets = useMemo(() => {
    const map = new Map<number, { sumCount: number; sumPct: number; n: number }>();
    for (const r of filteredRows) {
      const pct = (r.count / r.capacity) * 100;
      const b = map.get(r.hour) ?? { sumCount: 0, sumPct: 0, n: 0 };
      b.sumCount += r.count;
      b.sumPct += pct;
      b.n += 1;
      map.set(r.hour, b);
    }
    return map;
  }, [filteredRows]);

  // Chart data: 6 AM → 11 PM
  const chartData = useMemo(() => {
    const out: { hour: number; label: string; pct: number; count: number; hasData: boolean }[] = [];
    for (let h = 6; h <= 23; h++) {
      const b = buckets.get(h);
      out.push({
        hour: h,
        label: formatHour(h),
        pct: b ? Math.round(b.sumPct / b.n) : 0,
        count: b ? Math.round(b.sumCount / b.n) : 0,
        hasData: !!b,
      });
    }
    return out;
  }, [buckets]);

  // Insights from 2-hour rolling avg over hours that have data
  const insights = useMemo(() => {
    const valid = chartData.filter((d) => d.hasData);
    if (valid.length === 0) {
      return { predicted: null, peak: null, quiet: null };
    }

    const rolling: { start: number; end: number; pct: number }[] = [];
    for (let i = 0; i < chartData.length - 1; i++) {
      const a = chartData[i];
      const b = chartData[i + 1];
      if (a.hasData && b.hasData) {
        rolling.push({
          start: a.hour,
          end: b.hour + 1,
          pct: (a.pct + b.pct) / 2,
        });
      }
    }

    let peak: { start: number; end: number; pct: number } | null = null;
    let quiet: { start: number; end: number; pct: number } | null = null;
    for (const r of rolling) {
      if (!peak || r.pct > peak.pct) peak = r;
      if (!quiet || r.pct < quiet.pct) quiet = r;
    }

    // Predicted now: current hour bucket, fallback ±1
    let predictedPct: number | null = null;
    const cur = chartData.find((d) => d.hour === currentHour && d.hasData);
    if (cur) predictedPct = cur.pct;
    else {
      const near = chartData.find(
        (d) => d.hasData && Math.abs(d.hour - currentHour) <= 1
      );
      if (near) predictedPct = near.pct;
    }

    return { predicted: predictedPct, peak, quiet };
  }, [chartData, currentHour]);

  const chartConfig = {
    pct: { label: "Avg % full", color: "hsl(var(--accent))" },
  };

  const statusOf = (pct: number) => getStatus(pct);
  const statusColorClass = (s: string) =>
    s === "Low"
      ? "text-capacity-low bg-capacity-low-bg"
      : s === "Moderate"
      ? "text-capacity-moderate bg-capacity-moderate-bg"
      : "text-capacity-high bg-capacity-high-bg";

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Capacity Trends
          </h2>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "today" | "all")}>
          <TabsList className="h-8">
            <TabsTrigger value="today" className="text-xs">
              {WEEKDAY_NAMES[todayWeekday]}s
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Insight chips */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            Predicted now
          </div>
          {insights.predicted !== null ? (
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-foreground">
                {insights.predicted}%
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColorClass(
                  statusOf(insights.predicted)
                )}`}
              >
                {statusOf(insights.predicted)}
              </span>
            </div>
          ) : (
            <div className="mt-1.5 text-sm text-muted-foreground">No data yet</div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            Based on past {WEEKDAY_NAMES[todayWeekday]}s at {formatHour(currentHour)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-capacity-high" />
            Peak window
          </div>
          {insights.peak ? (
            <>
              <div className="mt-1.5 font-display text-lg font-bold text-foreground">
                {formatRange(insights.peak.start, insights.peak.end)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Avg {Math.round(insights.peak.pct)}% full
              </div>
            </>
          ) : (
            <div className="mt-1.5 text-sm text-muted-foreground">—</div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Moon className="h-3.5 w-3.5 text-capacity-low" />
            Quietest window
          </div>
          {insights.quiet ? (
            <>
              <div className="mt-1.5 font-display text-lg font-bold text-foreground">
                {formatRange(insights.quiet.start, insights.quiet.end)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Avg {Math.round(insights.quiet.pct)}% full
              </div>
            </>
          ) : (
            <div className="mt-1.5 text-sm text-muted-foreground">—</div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-2">
        {loading ? (
          <div className="h-56 animate-pulse rounded-md bg-muted" />
        ) : chartData.some((d) => d.hasData) ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={2}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const pct = Number(value);
                      const cnt = (item?.payload as { count?: number })?.count ?? 0;
                      return (
                        <div className="flex flex-col">
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {pct}% full
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ~{cnt} people
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Not enough historical data yet
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Average % full by hour ·{" "}
          {view === "today"
            ? `Past ${WEEKDAY_NAMES[todayWeekday]}s only`
            : "All days averaged"}
        </p>
      </div>
    </div>
  );
};

export default CapacityTrends;
