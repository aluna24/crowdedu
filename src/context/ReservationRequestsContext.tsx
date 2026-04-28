import React, { createContext, useContext, useState, useCallback } from "react";
import { RESERVATIONS } from "@/data/reservationsSeed";

export type RequestStatus = "pending" | "approved" | "denied";

export interface ReservationRequest {
  id: string;
  userId: string;
  name: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  space: string;
  expectedOccupancy: number;
  purpose: string;
  specialRequest?: string;
  status: RequestStatus;
  denialReason?: string;
  createdAt: string;
}

interface Ctx {
  requests: ReservationRequest[];
  addRequest: (r: Omit<ReservationRequest, "id" | "status" | "createdAt">) => { ok: boolean; error?: string };
  approveRequest: (id: string) => void;
  denyRequest: (id: string, reason: string) => void;
  clearRequest: (id: string) => void;
}

const ReservationRequestsContext = createContext<Ctx | null>(null);

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const ReservationRequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<ReservationRequest[]>([]);

  const addRequest: Ctx["addRequest"] = useCallback((r) => {
    const newStart = toMin(r.startTime);
    const newEnd = toMin(r.endTime);
    const weekday = new Date(`${r.date}T00:00:00`).getDay();

    // Check existing seed reservations for same space + weekday
    const seedConflict = RESERVATIONS.find(
      (sr) =>
        sr.space === r.space &&
        (sr.weekday === undefined || sr.weekday === weekday) &&
        newStart < sr.endMin &&
        newEnd > sr.startMin,
    );
    if (seedConflict) {
      return { ok: false, error: `Conflicts with "${seedConflict.title}" already booked in ${r.space}.` };
    }

    // Check pending/approved requests for same space + date
    let conflict: ReservationRequest | undefined;
    setRequests((prev) => {
      conflict = prev.find(
        (er) =>
          er.status !== "denied" &&
          er.space === r.space &&
          er.date === r.date &&
          newStart < toMin(er.endTime) &&
          newEnd > toMin(er.startTime),
      );
      if (conflict) return prev;
      return [
        {
          ...r,
          id: crypto.randomUUID(),
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    if (conflict) {
      return {
        ok: false,
        error: `Conflicts with an existing ${conflict.status} request by ${conflict.name} (${conflict.startTime}–${conflict.endTime}).`,
      };
    }
    return { ok: true };
  }, []);

  const approveRequest = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved", denialReason: undefined } : r)));
  }, []);

  const denyRequest = useCallback((id: string, reason: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied", denialReason: reason } : r)));
  }, []);

  const clearRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <ReservationRequestsContext.Provider value={{ requests, addRequest, approveRequest, denyRequest, clearRequest }}>
      {children}
    </ReservationRequestsContext.Provider>
  );
};

export const useReservationRequests = () => {
  const ctx = useContext(ReservationRequestsContext);
  if (!ctx) throw new Error("useReservationRequests must be used within ReservationRequestsProvider");
  return ctx;
};
