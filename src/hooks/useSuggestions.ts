// src/hooks/useSuggestions.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import { fetchSuggestions, type Suggestion } from "@/lib/friends-api";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// "People you may know": up to 10 people, loaded once when the page opens.
// `suggestions` is null until they arrive (or if loading failed: then `error` says why).
export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setSuggestions(await fetchSuggestions());
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return { suggestions, error };
}
