import { useGym, getStatus } from "@/context/GymContext";

const CapacityMeter = () => {
  const { floors, totalCount, totalCapacity, totalPercent, totalStatus } = useGym();

  const statusColor = (s: string) =>
    s === "Low" ? "bg-capacity-low" : s === "Moderate" ? "bg-capacity-moderate" : "bg-capacity-high";
  const statusBg = (s: string) =>
    s === "Low" ? "bg-capacity-low-bg" : s === "Moderate" ? "bg-capacity-moderate-bg" : "bg-capacity-high-bg";
  const statusText = (s: string) =>
    s === "Low" ? "text-capacity-low" : s === "Moderate" ? "text-capacity-moderate" : "text-capacity-high";

  return (
    <div className="space-y-4">
      {/* Overall summary */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Total Capacity
          </h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBg(totalStatus)} ${statusText(totalStatus)}`}>
            {totalStatus}
          </span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-display text-5xl font-bold text-foreground leading-none">{totalCount}</span>
          <span className="mb-1 text-lg text-muted-foreground">/ {totalCapacity}</span>
        </div>
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${statusColor(totalStatus)}`}
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{totalPercent}% full</p>
        </div>
      </div>

      {/* Per-floor breakdown */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          By Area
        </h2>
        <div className="space-y-3">
          {floors.map((floor) => {
            const pct = Math.round((floor.currentCount / floor.maxCapacity) * 100);
            const s = getStatus(pct);
            return (
              <div key={floor.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{floor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {floor.currentCount}/{floor.maxCapacity}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBg(s)} ${statusText(s)}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${statusColor(s)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CapacityMeter;
