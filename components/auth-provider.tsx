"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { User } from "@/lib/types";
import { getStoredUser, setStoredUser } from "@/lib/storage";

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedUser: User | null | undefined;

function getSnapshot(): User | null {
  if (cachedUser === undefined) cachedUser = getStoredUser();
  return cachedUser;
}

function getServerSnapshot(): User | null {
  return null;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setUser(user: User | null): void {
  cachedUser = user;
  setStoredUser(user);
  listeners.forEach((listener) => listener());
}

interface AuthContextValue {
  user: User | null;
  login: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = (u: User | null) => setUser(u);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
