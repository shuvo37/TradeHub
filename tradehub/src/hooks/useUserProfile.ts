// src/hooks/useUserProfile.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import { fetchUserById } from "@/lib/profile-api";
import type { UserProfile } from "@/types/profile";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Another user's profile, loaded by id (for visiting their page).
// Pass undefined when you are on your own page: nothing is loaded then, and profile stays null.
// `profile` is null until it has loaded (or if loading failed: then `error` says why, e.g. "User not found.").
export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setProfile(await fetchUserById(userId));
      })
      .catch((err) => setError(errorMessage(err)));
  }, [userId]);

  return { profile, error };
}
