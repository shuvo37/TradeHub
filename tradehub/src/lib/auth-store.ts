import type { AuthResponse } from "@/app/auth/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

let accessToken: string | null = null;
let currentUser: AuthResponse | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;

export const getAccessToken = () => accessToken;
export const getUser = () => currentUser;

export function setAuth(user: AuthResponse) {
  accessToken = user.accessToken;
  currentUser = user;
}

export function clearAuth() {
  accessToken = null;
  currentUser = null;
}

// Single-flight: if several callers refresh at once (React StrictMode runs effects twice in dev),
// they share ONE request. Two parallel refreshes would rotate the token twice.
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the httpOnly cookie
      });
      if (!res.ok) {
        clearAuth();
        return null;
      }
      const user: AuthResponse = await res.json();
      setAuth(user);
      return user;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}