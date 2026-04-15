import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PassType = "single" | "3-pack" | "5-pack" | "10-pack" | "semester";

export interface PassOption {
  type: PassType;
  label: string;
  price: number;
  classes: number | null;
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
  status: string;
}

interface PassContextType {
  passes: FitnessPass[];
  loading: boolean;
  purchasePass: (type: PassType) => Promise<void>;
  getActivePass: () => FitnessPass | null;
  refreshPasses: () => Promise<void>;
}

const PassContext = createContext<PassContextType | null>(null);

export const PassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [passes, setPasses] = useState<FitnessPass[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPasses = useCallback(async () => {
    if (!user) { setPasses([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("fitness_passes")
      .select("*")
      .eq("user_id", user.id);
    setPasses(
      (data ?? []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        type: p.pass_type as PassType,
        classesRemaining: p.classes_remaining,
        status: p.status,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPasses(); }, [fetchPasses]);

  const getActivePass = useCallback((): FitnessPass | null => {
    if (!user) return null;
    return passes.find(
      (p) => p.userId === user.id && p.status === "active" && (p.classesRemaining === null || p.classesRemaining > 0)
    ) ?? null;
  }, [passes, user]);

  const purchasePass = useCallback(async (type: PassType) => {
    if (!user) return;
    const option = PASS_OPTIONS.find((o) => o.type === type)!;
    await supabase.from("fitness_passes").insert({
      user_id: user.id,
      pass_type: type,
      classes_remaining: option.classes,
      status: "active",
    });
    await fetchPasses();
  }, [user, fetchPasses]);

  return (
    <PassContext.Provider value={{ passes, loading, purchasePass, getActivePass, refreshPasses: fetchPasses }}>
      {children}
    </PassContext.Provider>
  );
};

export const usePassContext = () => {
  const ctx = useContext(PassContext);
  if (!ctx) throw new Error("usePassContext must be used within PassProvider");
  return ctx;
};
