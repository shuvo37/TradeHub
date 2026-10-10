// src/hooks/useReceivedOrders.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import {
  deleteReceivedOrder,
  fetchOrderCounts,
  fetchReceivedOrders,
  updateOrderStatus,
  type Order,
  type OrderCounts,
  type OrderFilter,
} from "@/lib/orders-api";

const POLL_MS = 30_000; // how often the tab numbers are refreshed

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// The pages loaded so far for one combination of tab + phone search (`key` says which one)
interface Loaded {
  key: string;
  filter: OrderFilter;
  items: Order[];
  hasMore: boolean;
  cursor: string | null; // nextCursor of the last page: where "More" continues
}

// The orders I received (I am the seller): tab, phone search, paging, counts, accept / reject / delete.
// The list belongs to the tab + search it was loaded for. When either changes, the old list is not shown
// (`loading` is true until the new first page arrives), and a late answer for an old tab is thrown away.
export function useReceivedOrders() {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState(""); // what is typed in the box
  const [phone, setPhone] = useState(""); // what is sent to the server: the box content after a short pause
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [counts, setCounts] = useState<OrderCounts | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const busy = useRef(false); // one "More" at a time

  const key = `${filter}|${phone}`;
  const current = loaded && loaded.key === key ? loaded : null;
  const error = failed && failed.key === key ? failed.message : null;
  const loading = !current && !error;

  // Typing: wait 300 ms after the last key, then ask the server
  useEffect(() => {
    const timer = setTimeout(() => setPhone(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // First page for the current tab + search
  useEffect(() => {
    let cancelled = false;
    const forKey = `${filter}|${phone}`;
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) throw new Error("You are not logged in.");
        const page = await fetchReceivedOrders({
          status: filter === "all" ? undefined : filter,
          phone,
        });
        if (cancelled) return;
        setFailed(null);
        setLoaded({
          key: forKey,
          filter,
          items: page.items,
          hasMore: page.hasMore,
          cursor: page.nextCursor,
        });
      })
      .catch((err) => {
        if (!cancelled) setFailed({ key: forKey, message: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [filter, phone]);

  // The numbers on the tabs, now and every 30 seconds. A failure just keeps the old numbers.
  const refreshCounts = useCallback(
    () =>
      ensureUser()
        .then(async (user) => {
          if (!user) return;
          setCounts(await fetchOrderCounts());
        })
        .catch(() => {}),
    []
  );
  useEffect(() => {
    refreshCounts();
    const timer = setInterval(refreshCounts, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCounts]);

  const changeFilter = (next: OrderFilter) => {
    setMoreError(null);
    setFilter(next);
  };

  const changeSearch = (next: string) => {
    setMoreError(null);
    setSearch(next);
  };

  // Clear the box: no need to wait for the pause
  const clearSearch = () => {
    setMoreError(null);
    setSearch("");
    setPhone("");
  };

  // The next 10 older orders are added under the ones on screen.
  // On failure the list stays and `moreError` says why.
  const loadMore = async () => {
    if (busy.current || !current || !current.hasMore || !current.cursor) return;
    busy.current = true;
    setLoadingMore(true);
    setMoreError(null);
    const forKey = current.key;
    try {
      const page = await fetchReceivedOrders({
        status: current.filter === "all" ? undefined : current.filter,
        phone,
        before: current.cursor,
      });
      setLoaded((prev) => {
        if (!prev || prev.key !== forKey) return prev; // the tab or search changed meanwhile
        const seen = new Set(prev.items.map((o) => o.id));
        return {
          ...prev,
          items: [...prev.items, ...page.items.filter((o) => !seen.has(o.id))],
          hasMore: page.hasMore,
          cursor: page.nextCursor,
        };
      });
    } catch (err) {
      setMoreError(errorMessage(err));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  };

  // Accept or reject: the server first, the list after. Throws with the backend's message on failure.
  // On the "All" tab the order stays and changes status; on a status tab it no longer belongs there, so it leaves.
  const decide = async (order: Order, status: "ACCEPTED" | "REJECTED") => {
    await updateOrderStatus(order.id, status);
    setLoaded((prev) =>
      prev
        ? {
            ...prev,
            items:
              prev.filter === "all"
                ? prev.items.map((o) => (o.id === order.id ? { ...o, orderStatus: status } : o))
                : prev.items.filter((o) => o.id !== order.id),
          }
        : prev
    );
    void refreshCounts();
  };

  // Delete (only after the order is decided): the server first, the list after. Throws on failure.
  const remove = async (order: Order) => {
    await deleteReceivedOrder(order.id);
    setLoaded((prev) =>
      prev ? { ...prev, items: prev.items.filter((o) => o.id !== order.id) } : prev
    );
    void refreshCounts();
  };

  return {
    filter,
    changeFilter,
    search,
    changeSearch,
    clearSearch,
    phone, // the search the shown list was made for
    orders: current?.items ?? [],
    hasMore: current?.hasMore ?? false,
    loading,
    error,
    loadingMore,
    moreError,
    counts,
    loadMore,
    decide,
    remove,
  };
}

export type ReceivedOrders = ReturnType<typeof useReceivedOrders>;
