import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export interface ActiveReminder {
  id: string;
  created_at: string;
}

interface GymContextType extends GymState {
  updateFloorCount: (floorId: string, count: number) => void;
  setAnnouncement: (text: string) => void;
  clearAnnouncement: () => void;
  totalCount: number;
  totalCapacity: number;
  totalPercent: number;
  totalStatus: "Low" | "Moderate" | "High";
  activeReminder: ActiveReminder | null;
  createReminder: (createdBy?: string) => Promise<{ ok: boolean; error?: string }>;
}

// Mapping between app floor IDs and Supabase column names
export const FLOOR_DB_MAP: Record<string, string> = {
  multipurpose: "Multipurpose Room",
  "4th-courts": "4th floor courts",
  "4th-squash": "4th floor squash courts",
  "3m": "3M",
  "3rd-courts": "3rd floor courts",
  "3rd-squash": "3rd floor squash courts",
  fc: "Fitness Center",
  pool: "Pool",
  p3: "P3",
};

const DB_FLOOR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FLOOR_DB_MAP).map(([k, v]) => [v, k])
);

const defaultFloors: FloorData[] = [
  { id: "multipurpose", name: "Multipurpose Room", currentCount: 0, maxCapacity: 60 },
  { id: "4th-courts", name: "4th Floor Courts", currentCount: 0, maxCapacity: 210 },
  { id: "4th-squash", name: "4th Floor Squash Courts", currentCount: 0, maxCapacity: 18 },
  { id: "3m", name: "3M", currentCount: 0, maxCapacity: 80 },
  { id: "3rd-courts", name: "3rd Floor Courts", currentCount: 0, maxCapacity: 210 },
  { id: "3rd-squash", name: "3rd Floor Squash Courts", currentCount: 0, maxCapacity: 18 },
  { id: "fc", name: "Fitness Center", currentCount: 0, maxCapacity: 140 },
  { id: "pool", name: "Pool", currentCount: 0, maxCapacity: 12 },
  { id: "p3", name: "P3", currentCount: 0, maxCapacity: 60 },
];

const defaultHours = [
  { day: "Monday", hours: "6:00 AM – 10:00 PM" },
  { day: "Tuesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Wednesday", hours: "6:00 AM – 10:00 PM" },
  { day: "Thursday", hours: "6:00 AM – 10:00 PM" },
  { day: "Friday", hours: "6:00 AM – 10:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 8:00 PM" },
  { day: "Sunday", hours: "8:00 AM – 8:00 PM" },
];

function parseEntryTimestamp(row: Record<string, unknown>): Date | null {
  const dateStr = row["Date"] as string | undefined;
  const timeStr = row["Time"] as string | undefined;
  if (!dateStr) return null;
  const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  const d = new Date(combined);
  return isNaN(d.getTime()) ? null : d;
}

function getStatus(percent: number): "Low" | "Moderate" | "High" {
  return percent < 40 ? "Low" : percent < 75 ? "Moderate" : "High";
}

function applyDbRow(row: Record<string, unknown>, prev: FloorData[]): FloorData[] {
  return prev.map((f) => {
    const col = FLOOR_DB_MAP[f.id];
    if (col && row[col] !== undefined) {
      return { ...f, currentCount: Number(row[col]) };
    }
    return f;
  });
}

const GymContext = createContext<GymContextType | null>(null);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [floors, setFloors] = useState<FloorData[]>(defaultFloors);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [announcement, setAnnouncementState] = useState("");
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  // Fetch latest row on mount
  useEffect(() => {
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from("facility_count")
        .select("*")
        .order("Entry_num", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setFloors((prev) => applyDbRow(data as Record<string, unknown>, prev));
        const ts = parseEntryTimestamp(data as Record<string, unknown>);
        setLastUpdated(ts ?? new Date());
      }
    };
    fetchLatest();
  }, []);

  // Fetch active reminder on mount
  useEffect(() => {
    const fetchReminder = async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("capacity_reminders")
        .select("id, created_at")
        .is("resolved_at", null)
        .gte("created_at", tenMinAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setActiveReminder(data as ActiveReminder);
    };
    fetchReminder();
  }, []);

  // Auto-expire local reminder after 10 minutes
  useEffect(() => {
    if (!activeReminder) return;
    const ageMs = Date.now() - new Date(activeReminder.created_at).getTime();
    const remaining = 10 * 60 * 1000 - ageMs;
    if (remaining <= 0) {
      setActiveReminder(null);
      return;
    }
    const t = setTimeout(() => setActiveReminder(null), remaining);
    return () => clearTimeout(t);
  }, [activeReminder]);

  // Subscribe to realtime inserts on facility_count + capacity_reminders
  useEffect(() => {
    const channel = supabase
      .channel("gym_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "facility_count" },
        (payload) => {
          setFloors((prev) => applyDbRow(payload.new as Record<string, unknown>, prev));
          const ts = parseEntryTimestamp(payload.new as Record<string, unknown>);
          setLastUpdated(ts ?? new Date());
          // Resolve any active reminders
          setActiveReminder(null);
          supabase
            .from("capacity_reminders")
            .update({ resolved_at: new Date().toISOString() })
            .is("resolved_at", null)
            .then(() => {});
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "capacity_reminders" },
        (payload) => {
          const row = payload.new as { id: string; created_at: string; resolved_at: string | null };
          if (!row.resolved_at) {
            setActiveReminder({ id: row.id, created_at: row.created_at });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "capacity_reminders" },
        (payload) => {
          const row = payload.new as { id: string; resolved_at: string | null };
          if (row.resolved_at) {
            setActiveReminder((cur) => (cur?.id === row.id ? null : cur));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalCount = floors.reduce((s, f) => s + f.currentCount, 0);
  const totalCapacity = floors.reduce((s, f) => s + f.maxCapacity, 0);
  const totalPercent = totalCapacity > 0 ? Math.round((totalCount / totalCapacity) * 100) : 0;
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

  const createReminder = useCallback(async (createdBy?: string) => {
    const { data, error } = await supabase
      .from("capacity_reminders")
      .insert({ created_by: createdBy ?? "anonymous" })
      .select("id, created_at")
      .single();
    if (error) return { ok: false, error: error.message };
    if (data) setActiveReminder(data as ActiveReminder);
    return { ok: true };
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
        activeReminder,
        createReminder,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export { getStatus };

// Capacity by DB column name (matches FLOOR_DB_MAP values)
export const AREA_CAPACITY: Record<string, number> = defaultFloors.reduce(
  (acc, f) => {
    const col = FLOOR_DB_MAP[f.id];
    if (col) acc[col] = f.maxCapacity;
    return acc;
  },
  {} as Record<string, number>
);

export const TOTAL_CAPACITY_ALL = defaultFloors.reduce((s, f) => s + f.maxCapacity, 0);

export const useGym = () => {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
};
