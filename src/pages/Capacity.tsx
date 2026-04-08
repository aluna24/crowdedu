import { useState } from "react";
import CapacityMeter from "@/components/CapacityMeter";
import LastUpdated from "@/components/LastUpdated";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useGym } from "@/context/GymContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Capacity = () => {
  const { floors } = useGym();
  const [selectedArea, setSelectedArea] = useState("all");

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Capacity Tracker
        </h1>
        <div className="mt-2">
          <LastUpdated />
        </div>
      </div>
      <AnnouncementBanner />

      <div className="mt-6 mb-4">
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
          Filter by Area
        </label>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {floors.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <CapacityMeter filterArea={selectedArea === "all" ? null : selectedArea} />
      </div>
    </div>
  );
};

export default Capacity;
