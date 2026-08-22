import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, refreshAccessToken } from "../api/client";
import { setAccessToken } from "./tokenStore";
import type { User } from "../api/types";

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function silentRefresh() {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiFetch<User>("/api/auth/me");
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void silentRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function register(email: string, password: string, name: string) {
    const data = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name })
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
