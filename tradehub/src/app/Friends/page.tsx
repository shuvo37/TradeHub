// src/app/Friends/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { markRequestsSeen } from "@/lib/friends-api";
import FriendRequestCard from "@/components/FriendRequestCard";
import { HomeTopBar, MobileTabBar } from "@/app/Home/HomeTopBar";

// All the friend requests I received, like on social media: a card for each person with Confirm / Delete.
// Opened by the two-people icon in the top bar.
export default function FriendsPage() {
  const { profile: me, error: profileError } = useProfile(); // the top bar shows my avatar
  const { requests, error } = useFriendRequests();
  // How many of the shown requests I have already answered. They stay on screen with their result
  // (like Facebook does), but they no longer count as waiting.
  const [answered, setAnswered] = useState(0);

  // Once the list is on screen, the requests count as seen: the red number on the Friends icon goes away.
  // They stay in the list until answered. A failure here is not worth showing: the badge just stays.
  const loaded = requests !== null;
  useEffect(() => {
    if (loaded) markRequestsSeen().catch(() => {});
  }, [loaded]);

  if (!me) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

  const waiting = requests ? requests.length - answered : 0;

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      {/* requestCount 0: on this page every request is already seen, so no badge */}
      <HomeTopBar profile={me} active="friends" requestCount={0} />

      <main className="mx-auto max-w-5xl px-3 pb-24 pt-6 sm:px-4 md:pb-8">
        <h1 className="text-xl font-bold tracking-tight">Friend requests</h1>
        {requests && requests.length > 0 && (
          <p className="mt-0.5 text-sm text-slate-500">{waiting} waiting for your answer</p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {!requests && !error && <p className="mt-4 text-sm text-slate-400">Loading...</p>}

        {requests && requests.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">No friend requests</h2>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              When someone sends you a friend request, it shows up here.
            </p>
          </div>
        )}

        {requests && requests.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {requests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                onResolved={() => setAnswered((n) => n + 1)}
              />
            ))}
          </div>
        )}
      </main>

      <MobileTabBar active="friends" requestCount={0} />
    </div>
  );
}
