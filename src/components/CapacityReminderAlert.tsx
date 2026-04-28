import { BellRing } from "lucide-react";
import { useGym } from "@/context/GymContext";

const CapacityReminderAlert = () => {
  const { activeReminder } = useGym();
  if (!activeReminder) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-capacity-moderate/40 bg-capacity-moderate-bg p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
      <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-capacity-moderate" />
      <div className="text-sm">
        <p className="font-semibold text-foreground">Students are requesting a capacity update</p>
        <p className="mt-0.5 text-muted-foreground">
          Please submit a fresh headcount below — this alert clears automatically once you do.
        </p>
      </div>
    </div>
  );
};

export default CapacityReminderAlert;
