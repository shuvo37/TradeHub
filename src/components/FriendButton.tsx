// src/components/FriendButton.tsx
"use client";

import { useEffect, useState } from "react";
import {
  fetchFriendStatus,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendRequest,
  type FriendInfo,
} from "../lib/friends-api";

interface Props {
  userId: string;       // the other person
  initial?: FriendInfo; // when the parent already knows the status (search rows); otherwise the button asks the server
  className?: string;
}

// The friend button for one other user. It shows the right words for how you are connected:
//   None -> "Add friend"   RequestSent -> "Request sent"   RequestReceived -> "Accept" + "Decline"   Friends -> "Friends"
// Same pattern as the rest of the app: call the API first, change what is shown only after the server says OK,
// and show the backend's own error message if it refuses.
export default function FriendButton({ userId, initial, className = "" }: Props) {
  const [info, setInfo] = useState<FriendInfo | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ask the server only when the parent didn't already pass the status
  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetchFriendStatus(userId)
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, initial]);

  // Runs one action, then shows the status it returns
  const run = async (action: () => Promise<FriendInfo>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setInfo(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => run(() => sendFriendRequest(userId));

  const handleAccept = () =>
    run(async () => {
      await acceptFriendRequest(info!.requestId!);
      return { status: "Friends", requestId: info!.requestId };
    });

  const handleDecline = () =>
    run(async () => {
      await deleteFriendRequest(info!.requestId!);
      return { status: "None", requestId: null };
    });

  const primary =
    "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60";
  const secondary =
    "rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60";
  const label = "rounded-full px-4 py-1.5 text-sm font-medium";

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      {info?.status === "None" && (
        <button type="button" onClick={handleAdd} disabled={busy} className={primary}>
          {busy ? "Sending..." : "Add friend"}
        </button>
      )}

      {info?.status === "RequestSent" && (
        <span className={`${label} bg-slate-100 text-slate-500`}>Request sent</span>
      )}

      {info?.status === "RequestReceived" && (
        <div className="flex gap-2">
          <button type="button" onClick={handleAccept} disabled={busy} className={primary}>
            Accept
          </button>
          <button type="button" onClick={handleDecline} disabled={busy} className={secondary}>
            Decline
          </button>
        </div>
      )}

      {info?.status === "Friends" && (
        <span className={`${label} bg-green-50 text-green-700`}>✓ Friends</span>
      )}

      {error && <p className="max-w-[16rem] text-xs text-red-600">{error}</p>}
    </div>
  );
}
