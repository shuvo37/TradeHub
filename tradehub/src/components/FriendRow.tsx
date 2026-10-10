// src/components/FriendRow.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Friend } from "@/lib/friends-api";
import { Avatar } from "@/app/Home/ui";

interface Props {
  friend: Friend;
  onUnfriend: (userId: string) => Promise<void>; // throws with the backend's message when it fails
}

// One friend in my list: avatar, name (opens the profile), and an Unfriend button.
// API first: the row leaves the list only after the server says OK; on failure the message shows under the row.
export default function FriendRow({ friend, onUnfriend }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnfriend = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onUnfriend(friend.userId);
      // On success the list drops this row, so there is nothing more to update here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  const profileHref = `/User/${friend.userId}`;

  return (
    <li className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0">
          <Avatar name={friend.name} src={friend.avatar || undefined} className="h-14 w-14 text-xl" />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={profileHref}
            className="block truncate text-base font-semibold text-slate-900 hover:underline"
          >
            {friend.name}
          </Link>
          <p className="truncate font-mono text-xs text-slate-400">{friend.uniqueName}</p>
          {friend.location && <p className="truncate text-xs text-slate-500">📍 {friend.location}</p>}
        </div>

        <button
          type="button"
          onClick={handleUnfriend}
          disabled={busy}
          className="shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60"
        >
          {busy ? "Removing..." : "Unfriend"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}
