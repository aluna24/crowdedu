# Capacity Trends Graph

Add a trend visualization to the Capacity page that uses all historical rows from `facility_count` to show patrons:
- **What capacity to expect right now** (predicted from historical average for current hour/day) — useful when live data is stale
- **Peak hours** (when the facility is busiest)
- **Quietest hours** (best time to visit)
- **An hourly trend chart** for the selected area, optionally split by day-of-week

## What the user will see

A new "Capacity Trends" section appears below the existing meter on `/capacity`, respecting the same area filter dropdown.

```text
┌─────────────────────────────────────────────────────┐
│  Capacity Trends                  [Today ▾] [All ▾] │
├─────────────────────────────────────────────────────┤
│  ⚡ Predicted now: 68% (Moderate)                   │
│  🔥 Peak: 5–7 PM (avg 82%)                          │
│  🌙 Quietest: 6–8 AM (avg 14%)                      │
├─────────────────────────────────────────────────────┤
│   Avg % full by hour                                │
│   100│         ╱▔▔▔╲                                │
│    50│    ╱▔▔▔╯    ╲▁                              │
│     0│▁▁▁╯           ╲▁▁▁                          │
│       6a  9a  12p  3p  6p  9p                       │
└─────────────────────────────────────────────────────┘
```

Three insight chips on top, then a smooth area chart below. A small toggle lets the user switch between "Today's pattern" (current weekday) and "All days averaged".

## Sections

### 1. Insight chips
- **Predicted now** — average %-full at the current hour-of-day (and weekday for "Today" view). Shown with the same Low/Moderate/High color logic.
- **Peak window** — the 2-hour window with highest average occupancy.
- **Quietest window** — the 2-hour window with lowest non-zero average occupancy.

### 2. Hourly trend chart
- Recharts `AreaChart` with smooth gradient (matches blue brand palette).
- X-axis: hour of day (6 AM → 11 PM).
- Y-axis: % full.
- Tooltip shows hour, avg %, and avg headcount.
- Respects the existing area filter dropdown — when "All Areas" is selected, uses total capacity; when a specific area is selected, uses that area only.

### 3. View toggle
Small `Tabs`: **Today** (filter to today's weekday) vs **All days** (average across every day in the dataset). Defaults to "Today".

## Technical Plan

**New file**: `src/components/CapacityTrends.tsx`
- Props: `filterArea: string | null` (mirrors `CapacityMeter`).
- On mount, fetch all rows from `facility_count` (dataset is small — ~200 rows today; cap query at 5000 with `.limit(5000)` for safety).
- Parse each row's `Date` + `Time` into a JS Date. Handles the two formats present in the data:
  - ISO-like: `2026-04-21` + `10:26 AM`
  - Short: `13-Feb` + `9:30 PM` (assume current year)
  - Bucket failed parses as "unknown weekday" and exclude from "Today" view.
- Compute, per hour bucket (0–23):
  - average headcount for the selected scope (single area column or sum of all area columns)
  - average % of capacity (using the same per-area capacity values from `GymContext.FLOOR_DB_MAP` + the default capacities already in `defaultFloors`)
- Derive insights:
  - `predictedNow` = bucket for current hour (fallback ±1 hour if empty).
  - `peakWindow` = argmax of 2-hour rolling average.
  - `quietWindow` = argmin of 2-hour rolling average over rows with data.
- Render with `recharts` (already in deps via `src/components/ui/chart.tsx`) using `ChartContainer` + `AreaChart` + `Area` + gradient `defs`.

**Edited file**: `src/pages/Capacity.tsx`
- Import and render `<CapacityTrends filterArea={selectedArea === "all" ? null : selectedArea} />` directly under the existing `<CapacityMeter>`.

**Capacity lookup helper**
- Export a small `AREA_CAPACITY` map (or expose `defaultFloors` capacities) from `GymContext.tsx` so `CapacityTrends` can convert raw counts → % full without re-declaring them. Cleanest: export `getAreaCapacity(dbColumn: string): number`.

**No DB changes** — purely reads existing `facility_count` rows. No new tables, no RLS changes, no migrations.

**No new dependencies** — `recharts` and `lucide-react` are already in use.

## Out of scope
- Per-day-of-week breakdown beyond the Today/All toggle (can add later).
- Historical sparkline per area in the breakdown list.
- ML-based forecasting (current "predicted now" is a simple historical average — appropriate for the dataset size).
