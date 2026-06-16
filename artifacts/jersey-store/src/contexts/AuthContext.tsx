import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "jersey_auth_token";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `HTTP ${res.status}`);
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const storeToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthTokenGetter(() => token);
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthTokenGetter(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoaded(true);
      return;
    }

    setAuthTokenGetter(() => token);

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json();
      })
      .then((data: AuthUser) => {
        setUser(data);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    storeToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    storeToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded, isSignedIn: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
