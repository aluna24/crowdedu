import React, { createContext, useContext, useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "employee" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const mockUsers: { email: string; password: string; user: User }[] = [
  { email: "student@rec.edu", password: "password", user: { id: "1", name: "Alex Student", email: "student@rec.edu", role: "student" } },
  { email: "employee@rec.edu", password: "password", user: { id: "2", name: "Jamie Staff", email: "employee@rec.edu", role: "employee" } },
  { email: "admin@rec.edu", password: "password", user: { id: "3", name: "Morgan Admin", email: "admin@rec.edu", role: "admin" } },
];

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
