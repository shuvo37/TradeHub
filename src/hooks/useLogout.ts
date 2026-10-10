// src/hooks/useLogout.ts
"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth-store";

// Returns a function that logs the user out: the server revokes the refresh token and deletes its cookie,
// then the in-memory session is cleared and the user lands on the login page.
// The navbar icon and the phone header's "Log out" item both use this.
export function useLogout() {
  const router = useRouter();

  return async () => {
    try {
      await authApi.logout();
    } catch {
      // Server not reachable: still sign out on this device
    }
    clearAuth();
    router.replace("/auth/Login"); // replace, so the Back button doesn't return to a page that needs a login
  };
}
