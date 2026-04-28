import React, { createContext, useContext, useState, useCallback } from "react";

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
  addRequest: (r: Omit<ReservationRequest, "id" | "status" | "createdAt">) => void;
  approveRequest: (id: string) => void;
  denyRequest: (id: string, reason: string) => void;
  clearRequest: (id: string) => void;
}

const ReservationRequestsContext = createContext<Ctx | null>(null);

export const ReservationRequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<ReservationRequest[]>([]);

  const addRequest: Ctx["addRequest"] = useCallback((r) => {
    setRequests((prev) => [
      {
        ...r,
        id: crypto.randomUUID(),
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
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
