// src/app/FriendList/page.tsx
"use client";

import { useProfile } from "@/hooks/useProfile";
import { useFriends } from "@/hooks/useFriends";
import FriendRow from "@/components/FriendRow";
import { HomeTopBar, MobileTabBar } from "@/app/Home/HomeTopBar";

// My friends, 10 at a time, with an Unfriend button on each. Opened by "Friends" in the Home left rail.
// "More" replaces the 10 on screen with the next 10.
export default function FriendListPage() {
  const { profile: me, error: profileError } = useProfile(); // the top bar shows my avatar
  const { friends, hasMore, loadingMore, error, loadMore, unfriend } = useFriends();

  if (!me) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      {/* active={null}: this page is not one of the three tabs */}
      <HomeTopBar profile={me} active={null} />

      <main className="mx-auto max-w-2xl px-3 pb-24 pt-6 sm:px-4 md:pb-8">
        <h1 className="text-xl font-bold tracking-tight">Friends</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {!friends && !error && <p className="mt-4 text-sm text-slate-400">Loading...</p>}

        {friends && friends.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">No friends yet</h2>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Search for people in the top bar and send a friend request.
            </p>
          </div>
        )}

        {friends && friends.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {friends.map((friend) => (
              <FriendRow key={friend.userId} friend={friend} onUnfriend={unfriend} />
            ))}
          </ul>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-auto mt-4 block rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "More"}
          </button>
        )}
      </main>

      <MobileTabBar active={null} />
    </div>
  );
}
