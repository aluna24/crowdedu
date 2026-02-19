import { useGym } from "@/context/GymContext";
import { AlertTriangle, X } from "lucide-react";

const AnnouncementBanner = () => {
  const { announcement } = useGym();

  if (!announcement) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-capacity-moderate/30 bg-capacity-moderate-bg p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-capacity-moderate" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Announcement</p>
        <p className="mt-1 text-sm text-muted-foreground">{announcement}</p>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
