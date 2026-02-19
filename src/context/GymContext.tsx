import React, { createContext, useContext, useState, useCallback } from "react";

interface GymState {
  currentCount: number;
  maxCapacity: number;
  lastUpdated: Date;
  announcement: string;
  operatingHours: { day: string; hours: string }[];
}

interface GymContextType extends GymState {
  updateHeadcount: (count: number) => void;
  setAnnouncement: (text: string) => void;
  clearAnnouncement: () => void;
  capacityPercent: number;
  status: "Low" | "Moderate" | "High";
}

const defaultHours = [
  { day: "Monday", hours: "6:00 AM – 10:00 PM" },
  { day: "Tuesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Wednesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Thursday", hours: "6:00 AM – 10:00 PM" },
  { day: "Friday", hours: "6:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "10:00 AM – 6:00 PM" },
];

const GymContext = createContext<GymContextType | null>(null);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCount, setCurrentCount] = useState(47);
  const [maxCapacity] = useState(120);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [announcement, setAnnouncementState] = useState("");

  const capacityPercent = Math.round((currentCount / maxCapacity) * 100);

  const status: "Low" | "Moderate" | "High" =
    capacityPercent < 40 ? "Low" : capacityPercent < 75 ? "Moderate" : "High";

  const updateHeadcount = useCallback((count: number) => {
    setCurrentCount(count);
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
        currentCount,
        maxCapacity,
        lastUpdated,
        announcement,
        operatingHours: defaultHours,
        updateHeadcount,
        setAnnouncement,
        clearAnnouncement,
        capacityPercent,
        status,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
};
