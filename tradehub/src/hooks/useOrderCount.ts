// src/hooks/useOrderCount.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import { fetchOrderCounts } from "@/lib/orders-api";

const POLL_MS = 30_000; // how often the badge number is refreshed (same as the bell)

// Just the number for the red badge on the bag icon: orders waiting for my answer (PENDING).
// Pass skip = true when the page already knows the number (the Orders page), so nothing is fetched here.
// A badge that fails to load simply shows nothing.
export function useOrderCount(skip: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    const load = () =>
      ensureUser()
        .then(async (user) => {
          if (!user) return;
          const counts = await fetchOrderCounts();
          if (!cancelled) setCount(counts.pending);
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
