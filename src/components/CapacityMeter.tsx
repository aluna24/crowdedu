import { useGym } from "@/context/GymContext";

const CapacityMeter = () => {
  const { currentCount, maxCapacity, capacityPercent, status } = useGym();

  const statusColor =
    status === "Low"
      ? "bg-capacity-low"
      : status === "Moderate"
      ? "bg-capacity-moderate"
      : "bg-capacity-high";

  const statusBgColor =
    status === "Low"
      ? "bg-capacity-low-bg"
      : status === "Moderate"
      ? "bg-capacity-moderate-bg"
      : "bg-capacity-high-bg";

  const statusTextColor =
    status === "Low"
      ? "text-capacity-low"
      : status === "Moderate"
      ? "text-capacity-moderate"
      : "text-capacity-high";

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Current Capacity
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBgColor} ${statusTextColor}`}>
          {status}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-5xl font-bold text-foreground leading-none">
          {currentCount}
        </span>
        <span className="mb-1 text-lg text-muted-foreground">/ {maxCapacity}</span>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${statusColor}`}
            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{capacityPercent}% full</p>
      </div>

      <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
        <p className="text-sm font-medium text-foreground">
          {status === "Low" && "🟢 Great time to visit — plenty of space available."}
          {status === "Moderate" && "🟡 Moderate activity — expect some wait for equipment."}
          {status === "High" && "🔴 Very busy — consider visiting later."}
        </p>
      </div>
    </div>
  );
};

export default CapacityMeter;
