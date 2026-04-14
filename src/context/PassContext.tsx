import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

export type PassType = "single" | "3-pack" | "5-pack" | "10-pack" | "semester";

export interface PassOption {
  type: PassType;
  label: string;
  price: number;
  classes: number | null; // null = unlimited (semester)
}

export const PASS_OPTIONS: PassOption[] = [
  { type: "single", label: "Single Class", price: 10, classes: 1 },
  { type: "3-pack", label: "3-Class Pack", price: 20, classes: 3 },
  { type: "5-pack", label: "5-Class Pack", price: 30, classes: 5 },
  { type: "10-pack", label: "10-Class Pack", price: 50, classes: 10 },
  { type: "semester", label: "Semester Pass", price: 70, classes: null },
];

export interface FitnessPass {
  id: string;
  userId: string;
  type: PassType;
  classesRemaining: number | null;
  purchasedAt: Date;
}

interface PassContextType {
  passes: FitnessPass[];
  purchasePass: (type: PassType) => void;
  usePass: () => boolean;
  getActivePass: () => FitnessPass | null;
}

const PassContext = createContext<PassContextType | null>(null);

let passIdCounter = 0;

export const PassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [passes, setPasses] = useState<FitnessPass[]>([]);
  const { user } = useAuth();

  const getActivePass = useCallback((): FitnessPass | null => {
    if (!user) return null;
    return passes.find(
      (p) => p.userId === user.id && (p.classesRemaining === null || p.classesRemaining > 0)
    ) ?? null;
  }, [passes, user]);

  const purchasePass = useCallback((type: PassType) => {
    if (!user) return;
    const option = PASS_OPTIONS.find((o) => o.type === type)!;
    setPasses((prev) => [
      ...prev,
      {
        id: `pass-${++passIdCounter}`,
        userId: user.id,
        type,
        classesRemaining: option.classes,
        purchasedAt: new Date(),
      },
    ]);
  }, [user]);

  const usePass = useCallback((): boolean => {
    const active = getActivePass();
    if (!active) return false;
    if (active.classesRemaining === null) return true; // semester
    setPasses((prev) =>
      prev.map((p) =>
        p.id === active.id ? { ...p, classesRemaining: (p.classesRemaining ?? 1) - 1 } : p
      )
    );
    return true;
  }, [getActivePass]);

  return (
    <PassContext.Provider value={{ passes, purchasePass, usePass, getActivePass }}>
      {children}
    </PassContext.Provider>
  );
};

export const usePass_context = () => {
  const ctx = useContext(PassContext);
  if (!ctx) throw new Error("usePass_context must be used within PassProvider");
  return ctx;
};
