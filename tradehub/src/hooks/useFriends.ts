// src/hooks/useFriends.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import { fetchFriends, unfriend as unfriendApi, type Friend } from "@/lib/friends-api";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// My friends, 10 at a time. Unlike the feed, "More" REPLACES the 10 on screen with the next 10
// (the old ones go away, they are not appended).
// `friends` is null until the first page arrives (or if it failed: then `error` says why).
export function useFriends() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where the next page starts (the nextCursor of the page on screen). A ref: it never changes what is drawn.
  const cursor = useRef<string | null>(null);
  const busy = useRef(false); // one "More" at a time

  useEffect(() => {
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        const page = await fetchFriends();
        cursor.current = page.nextCursor;
        setFriends(page.items);
        setHasMore(page.hasMore);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // Replace the page on screen with the next one. On failure the current page stays and `error` says why.
  const loadMore = useCallback(async () => {
    if (busy.current || !cursor.current) return;
    busy.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchFriends(cursor.current);
      cursor.current = page.nextCursor;
      setFriends(page.items);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Unfriend: the server first, the list after. Throws with the backend's message so the row can show it.
  const unfriend = useCallback(
    async (userId: string) => {
      await unfriendApi(userId);
      const left = (friends ?? []).filter((f) => f.userId !== userId);
      setFriends(left);
      // The page ran empty but older friends exist: bring the next page instead of an empty screen
      if (left.length === 0 && hasMore) void loadMore();
    },
    [friends, hasMore, loadMore]
  );

  return { friends, hasMore, loadingMore, error, loadMore, unfriend };
}
