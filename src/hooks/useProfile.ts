// src/hooks/useProfile.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser, updateUser } from "@/lib/auth-store";
import { fetchMe, updateMe } from "../lib/profile-api";
import type { UserProfile } from "@/types/profile";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// The logged-in user's profile, loaded from the backend. Profile and Home both use this.
// `profile` is null until it has loaded (or if loading failed: then `error` says why).
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setProfile(await fetchMe());
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // Throws on failure: the Sidebar shows the message and keeps the draft.
  const saveProfile = async (next: UserProfile) => {
    const saved = await updateMe(next);
    setProfile(saved);
    // Keep the in-memory session user in step too (the comment box reads its avatar from there).
    updateUser({
      name: saved.name,
      uniqueName: saved.uniqueName,
      avatar: saved.avatar,
      location: saved.location,
      paymentNumber: saved.paymentNumber,
      email: saved.email,
      phone: saved.phone,
      necessaryInfo: saved.necessaryInfo,
    });
  };

  return { profile, error, saveProfile };
}
