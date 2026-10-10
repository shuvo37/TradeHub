// src/hooks/useFriendRequests.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import { fetchReceivedRequests, fetchUnseenCount, type FriendRequest } from "@/lib/friends-api";

const POLL_MS = 30_000; // how often the badge number is refreshed

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// The friend requests other people sent me (still waiting for my answer), newest first.
// `requests` is null until loaded (or if loading failed: then `error` says why).
export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setRequests(await fetchReceivedRequests());
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return { requests, error };
}

// Just the number, for the red badge on the Friends icon: requests I have not looked at yet.
// Opening the Friends page marks them seen, so the number goes away even though the requests stay in the list.
// Pass skip = true when the page doesn't want a badge (the Friends page itself), so nothing is fetched.
// The number is refreshed every 30 seconds. A badge that fails to load simply shows nothing.
export function useRequestCount(skip: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    const load = () =>
      ensureUser()
        .then(async (user) => {
          if (!user) return;
          const n = await fetchUnseenCount();
          if (!cancelled) setCount(n);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [skip]);

  return count;
}
