// src/app/Discover/page.tsx
"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useDiscoverPosts } from "@/hooks/useDiscoverPosts";
import SuggestionRow from "@/components/SuggestionRow";
import PostCard from "@/components/PostCard";
import OrderFormModal from "@/components/modals/OrderFormModal";
import { HomeTopBar, MobileTabBar } from "@/app/Home/HomeTopBar";
import type { Post, Product } from "@/types/profile";

// The tabs of the posts side. Only "For you" exists for now; more (for example Popular or New) are added here later.
const POST_TABS = [{ id: "for-you", label: "For you" }] as const;

// Discover shows other people's posts only, so a card's edit, revive and delete never run here;
// the card still asks for them, so these do nothing.
const noEdit = async () => {};
const noRevive = async () => {};
const noDelete = () => {};

// Discover has two parts. Left: people you may know (the friend suggestions). Right: other people's posts, in tabs.
// From the lg width both parts show side by side; below it only one shows, and the "People" / "Posts" switch picks which.
export default function DiscoverPage() {
  const { profile: me, error: profileError } = useProfile(); // the top bar shows my avatar
  const { suggestions, error } = useSuggestions();
  const {
    posts,
    myId,
    error: postsError,
    loaded: postsLoaded,
    hasMore,
    loadingMore,
    toggleLike,
    loadMore,
  } = useDiscoverPosts();
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);
  const [section, setSection] = useState<"people" | "posts">("people"); // small screens only
  const [postTab, setPostTab] = useState<(typeof POST_TABS)[number]["id"]>("for-you");

  if (!me) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

  const handleOrderPost = (post: Post) => {
    if (post.product) setOrderingProduct(post.product);
  };

  const switchButton = (id: "people" | "posts", label: string) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      aria-pressed={section === id}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        section === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      <HomeTopBar profile={me} active="discover" />

      <div className="mx-auto max-w-[1100px] px-3 pb-24 pt-4 sm:px-4 md:pb-8">
        {/* Small screens: pick which part to see */}
        <div className="mb-3 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm lg:hidden">
          {switchButton("people", "People")}
          {switchButton("posts", "Posts")}
        </div>

        <div className="flex items-start gap-6">
          {/* Left: people you may know */}
          <section
            className={`${section === "people" ? "block" : "hidden"} w-full lg:sticky lg:top-[4.5rem] lg:block lg:w-96 lg:shrink-0`}
          >
            <h1 className="mb-3 text-lg font-bold tracking-tight">People you may know</h1>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {!suggestions && !error && <p className="text-sm text-slate-400">Loading...</p>}

            {suggestions && suggestions.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                <h2 className="text-base font-semibold text-slate-800">No suggestions yet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Suggestions appear as you add friends, order from sellers and join in on posts.
                </p>
              </div>
            )}

            {suggestions && suggestions.length > 0 && (
              <ul className="flex flex-col gap-3">
                {suggestions.map((person) => (
                  <SuggestionRow key={person.id} person={person} />
                ))}
              </ul>
            )}
          </section>

          {/* Right: other people's posts */}
          <section className={`${section === "posts" ? "block" : "hidden"} min-w-0 flex-1 lg:block`}>
            <div className="mb-3 flex gap-2" role="tablist" aria-label="Post lists">
              {POST_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={postTab === tab.id}
                  onClick={() => setPostTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    postTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {postsError && <p className="px-1 text-xs text-red-600">{postsError}</p>}

              {!postsLoaded ? (
                <p className="px-1 text-sm text-slate-500">Loading...</p>
              ) : posts.length === 0 && !hasMore ? (
                <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">No posts to show yet</h2>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    Posts from people outside your friends list show up here.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={myId}
                    onEdit={noEdit}
                    onRevive={noRevive}
                    onDelete={noDelete}
                    onToggleLike={toggleLike}
                    onOrder={handleOrderPost}
                  />
                ))
              )}

              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mx-auto rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "More"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      <MobileTabBar active="discover" />

      <OrderFormModal
        key={orderingProduct?.id ?? "no-order"}
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
      />
    </div>
  );
}
