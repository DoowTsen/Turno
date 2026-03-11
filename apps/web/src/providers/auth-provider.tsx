"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@turno/api-sdk";
import type { AuthSession, UserProfile } from "@turno/types";

const STORAGE_KEY = "turno-auth-session";

type AuthContextValue = {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const session = JSON.parse(raw) as AuthSession;
        if (!session.accessToken) {
          throw new Error("invalid session");
        }

        setAccessToken(session.accessToken);
        setUser(session.user);

        const latestUser = await getCurrentUser(session.accessToken);
        if (!mounted) {
          return;
        }

        setUser(latestUser);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            accessToken: session.accessToken,
            user: latestUser,
          } satisfies AuthSession),
        );
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        if (mounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      setSession: (session: AuthSession) => {
        setUser(session.user);
        setAccessToken(session.accessToken);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      },
      logout: () => {
        setUser(null);
        setAccessToken(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [accessToken, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
