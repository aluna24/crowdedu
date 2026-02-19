import CapacityMeter from "@/components/CapacityMeter";
import LastUpdated from "@/components/LastUpdated";
import OperatingHours from "@/components/OperatingHours";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const Dashboard = () => {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Recreation Center
        </h1>
        <div className="mt-2">
          <LastUpdated />
        </div>
      </div>

      <AnnouncementBanner />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <CapacityMeter />
        <OperatingHours />
      </div>
    </div>
  );
};

export default Dashboard;
