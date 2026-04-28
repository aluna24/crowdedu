import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "employee" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, fullName: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithAzure: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async (sess: Session | null) => {
    if (!sess?.user) {
      setUser(null);
      return;
    }
    // Defer DB fetches to avoid deadlocking the auth callback
    setTimeout(async () => {
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", sess.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", sess.user.id).maybeSingle(),
      ]);
      setUser({
        id: sess.user.id,
        email: profile?.email ?? sess.user.email ?? "",
        name: profile?.full_name || sess.user.email?.split("@")[0] || "User",
        role: (roleRow?.role as User["role"]) ?? "student",
      });
    }, 0);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      hydrateUser(sess);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      hydrateUser(sess);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, fullName: string, password: string) => {
    if (!email.toLowerCase().endsWith("@gwu.edu")) {
      return { ok: false, error: "Student email must end with @gwu.edu" };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signInWithAzure = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email openid profile",
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!session && !!user, loading, login, signUp, signInWithAzure, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
