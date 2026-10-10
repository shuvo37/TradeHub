// src/components/FriendRequestCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptFriendRequest, deleteFriendRequest, type FriendRequest } from "@/lib/friends-api";
import { timeAgo } from "@/lib/time";

interface Props {
  request: FriendRequest;
  onResolved: () => void; // called once the request is accepted or deleted, so the page can update its count
}

// One received friend request, like on social media: a big photo, the name, and Confirm / Delete.
// API first: the card changes only after the server says OK, and shows the backend's own message if it refuses.
export default function FriendRequestCard({ request, onResolved }: Props) {
  const [outcome, setOutcome] = useState<"pending" | "accepted" | "deleted">("pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = async (action: () => Promise<void>, result: "accepted" | "deleted") => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setOutcome(result);
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const profileHref = `/User/${request.userId}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={profileHref} className="block">
        <div className="aspect-square w-full bg-gradient-to-tr from-blue-100 to-violet-100">
          {request.avatar ? (
            <img src={request.avatar} alt={request.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-blue-400">
              {(request.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link
          href={profileHref}
          className="block truncate text-base font-semibold text-slate-900 hover:underline"
        >
          {request.name}
        </Link>
        <p className="truncate font-mono text-xs text-slate-400">{request.uniqueName}</p>
        {request.location && (
          <p className="truncate text-xs text-slate-500">📍 {request.location}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-400">{timeAgo(request.createdAt)}</p>

        {outcome === "pending" && (
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => answer(() => acceptFriendRequest(request.id), "accepted")}
              disabled={busy}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => answer(() => deleteFriendRequest(request.id), "deleted")}
              disabled={busy}
              className="w-full rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        )}

        {outcome === "accepted" && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
            Request accepted. You are now friends.
          </p>
        )}

        {outcome === "deleted" && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-500">
            Request deleted
          </p>
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
