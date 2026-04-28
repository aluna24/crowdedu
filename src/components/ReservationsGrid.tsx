import { useMemo } from "react";
import {
  SPACES,
  RESERVATIONS,
  CLOSED_SPACES,
  COLOR_CLASSES,
  HOURS,
  GRID_START_MIN,
  GRID_END_MIN,
  formatHourLabel,
} from "@/data/reservationsSeed";

interface ReservationsGridProps {
  weekday: number; // 0=Sun..6=Sat
}

const TOTAL_MIN = GRID_END_MIN - GRID_START_MIN;
const ROW_HEIGHT = 36; // px
const SPACE_COL_WIDTH = 200; // px
const HOUR_WIDTH = 90; // px
const GRID_WIDTH = HOURS.length * HOUR_WIDTH;

const pctLeft = (startMin: number) =>
  ((Math.max(startMin, GRID_START_MIN) - GRID_START_MIN) / TOTAL_MIN) * 100;
const pctWidth = (startMin: number, endMin: number) =>
  ((Math.min(endMin, GRID_END_MIN) - Math.max(startMin, GRID_START_MIN)) / TOTAL_MIN) * 100;

const ReservationsGrid = ({ weekday }: ReservationsGridProps) => {
  const reservationsBySpace = useMemo(() => {
    const map = new Map<string, typeof RESERVATIONS>();
    for (const r of RESERVATIONS) {
      if (r.weekday !== undefined && r.weekday !== weekday) continue;
      if (!map.has(r.space)) map.set(r.space, []);
      map.get(r.space)!.push(r);
    }
    return map;
  }, [weekday]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div style={{ minWidth: SPACE_COL_WIDTH + GRID_WIDTH }}>
        {/* Header row */}
        <div className="flex sticky top-0 z-20 bg-muted/60 backdrop-blur border-b border-border">
          <div
            className="flex items-center px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-border bg-muted/80 sticky left-0 z-10"
            style={{ width: SPACE_COL_WIDTH, height: ROW_HEIGHT }}
          >
            Space
          </div>
          <div className="relative" style={{ width: GRID_WIDTH, height: ROW_HEIGHT }}>
            {HOURS.map((h, i) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 flex items-center px-2 text-xs font-medium text-muted-foreground border-r border-border"
                style={{ left: i * HOUR_WIDTH, width: HOUR_WIDTH }}
              >
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Body rows */}
        {SPACES.map((space, idx) => {
          const items = reservationsBySpace.get(space) ?? [];
          const closed = CLOSED_SPACES[space] ?? [];
          return (
            <div
              key={space}
              className={`flex border-b border-border ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
            >
              <div
                className="flex items-center px-3 text-sm font-medium text-foreground border-r border-border bg-card sticky left-0 z-10 truncate"
                style={{ width: SPACE_COL_WIDTH, height: ROW_HEIGHT }}
                title={space}
              >
                {space}
              </div>
              <div className="relative" style={{ width: GRID_WIDTH, height: ROW_HEIGHT }}>
                {/* Hour gridlines */}
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-r border-border/60"
                    style={{ left: i * HOUR_WIDTH, width: HOUR_WIDTH }}
                  />
                ))}

                {/* Closed segments */}
                {closed.map((c, i) => (
                  <div
                    key={`c-${i}`}
                    className="absolute top-0 bottom-0 flex items-center justify-center text-muted-foreground"
                    style={{
                      left: `${pctLeft(c.startMin)}%`,
                      width: `${pctWidth(c.startMin, c.endMin)}%`,
                      backgroundImage:
                        "repeating-linear-gradient(45deg, hsl(var(--muted)) 0 6px, transparent 6px 12px)",
                    }}
                    aria-label="Closed"
                  >
                    <span className="text-xs">×</span>
                  </div>
                ))}

                {/* Reservation blocks */}
                {items.map((r) => (
                  <div
                    key={r.id}
                    className={`absolute top-1 bottom-1 rounded px-1.5 text-[11px] font-semibold leading-tight flex items-center overflow-hidden border shadow-sm ${COLOR_CLASSES[r.color]}`}
                    style={{
                      left: `${pctLeft(r.startMin)}%`,
                      width: `${pctWidth(r.startMin, r.endMin)}%`,
                    }}
                    title={`${r.title} • ${formatHourLabel(Math.floor(r.startMin / 60))}–${formatHourLabel(Math.floor(r.endMin / 60))}`}
                  >
                    <span className="truncate">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReservationsGrid;
