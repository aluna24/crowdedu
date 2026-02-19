import { useGym } from "@/context/GymContext";

const OperatingHours = () => {
  const { operatingHours } = useGym();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Operating Hours
      </h2>
      <ul className="space-y-2">
        {operatingHours.map(({ day, hours }) => (
          <li
            key={day}
            className={`flex justify-between rounded-md px-3 py-2 text-sm ${
              day === today
                ? "bg-primary/10 font-semibold text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span>{day}</span>
            <span>{hours}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OperatingHours;
