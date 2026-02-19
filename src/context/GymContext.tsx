import React, { createContext, useContext, useState, useCallback } from "react";

export interface FloorData {
  id: string;
  name: string;
  currentCount: number;
  maxCapacity: number;
}

interface GymState {
  floors: FloorData[];
  lastUpdated: Date;
  announcement: string;
  operatingHours: { day: string; hours: string }[];
}

interface GymContextType extends GymState {
  updateFloorCount: (floorId: string, count: number) => void;
  setAnnouncement: (text: string) => void;
  clearAnnouncement: () => void;
  totalCount: number;
  totalCapacity: number;
  totalPercent: number;
  totalStatus: "Low" | "Moderate" | "High";
}

const defaultFloors: FloorData[] = [
  { id: "fc", name: "Fitness Center", currentCount: 32, maxCapacity: 50 },
  { id: "p3", name: "P3", currentCount: 12, maxCapacity: 30 },
  { id: "4th-courts", name: "4th Floor Courts", currentCount: 18, maxCapacity: 40 },
  { id: "3m", name: "3M", currentCount: 8, maxCapacity: 25 },
  { id: "3rd-floor", name: "3rd Floor", currentCount: 15, maxCapacity: 35 },
  { id: "pool", name: "Pool", currentCount: 22, maxCapacity: 40 },
  { id: "p3-2", name: "P3", currentCount: 5, maxCapacity: 20 },
];

const defaultHours = [
  { day: "Monday", hours: "6:00 AM – 10:00 PM" },
  { day: "Tuesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Wednesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Thursday", hours: "6:00 AM – 10:00 PM" },
  { day: "Friday", hours: "6:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "10:00 AM – 6:00 PM" },
];

function getStatus(percent: number): "Low" | "Moderate" | "High" {
  return percent < 40 ? "Low" : percent < 75 ? "Moderate" : "High";
}

const GymContext = createContext<GymContextType | null>(null);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [floors, setFloors] = useState<FloorData[]>(defaultFloors);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [announcement, setAnnouncementState] = useState("");

  const totalCount = floors.reduce((s, f) => s + f.currentCount, 0);
  const totalCapacity = floors.reduce((s, f) => s + f.maxCapacity, 0);
  const totalPercent = Math.round((totalCount / totalCapacity) * 100);
  const totalStatus = getStatus(totalPercent);

  const updateFloorCount = useCallback((floorId: string, count: number) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, currentCount: count } : f))
    );
    setLastUpdated(new Date());
  }, []);

  const setAnnouncement = useCallback((text: string) => {
    setAnnouncementState(text);
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncementState("");
  }, []);

  return (
    <GymContext.Provider
      value={{
        floors,
        lastUpdated,
        announcement,
        operatingHours: defaultHours,
        updateFloorCount,
        setAnnouncement,
        clearAnnouncement,
        totalCount,
        totalCapacity,
        totalPercent,
        totalStatus,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export { getStatus };

export const useGym = () => {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
};
