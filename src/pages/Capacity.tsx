import CapacityMeter from "@/components/CapacityMeter";
import LastUpdated from "@/components/LastUpdated";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const Capacity = () => {
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
      <div className="mt-6">
        <CapacityMeter />
      </div>
    </div>
  );
};

export default Capacity;
