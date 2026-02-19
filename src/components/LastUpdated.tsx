import { useGym } from "@/context/GymContext";

const LastUpdated = () => {
  const { lastUpdated } = useGym();

  const formatted = lastUpdated.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = lastUpdated.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full bg-capacity-low animate-pulse-slow" />
      <span>
        Last Updated: {dateStr} at {formatted}
      </span>
    </div>
  );
};

export default LastUpdated;
