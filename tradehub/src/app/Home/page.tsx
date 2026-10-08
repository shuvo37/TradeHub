// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProfile } from "../../hooks/useProfile";
import { usePosts } from "../../hooks/usePosts";
import { onFeedRefresh } from "@/lib/feed-refresh";
import { fetchCategories } from "@/lib/store-api";
import { Category, Product, Post } from "@/types/profile";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import OrderFormModal from "@/components/modals/OrderFormModal";
import { HomeTopBar, MobileTabBar } from "./HomeTopBar";
import { LeftRail, RightRail } from "./HomeSideRails";

export default function HomePage() {
  // The profile comes from the backend (null until loaded)
  const { profile, error: profileError } = useProfile();
  // Categories (with their products) come from the API; the Composer needs them to attach a product.
  const [categories, setCategories] = useState<Category[]>([]);
  // Home is the news feed: my posts and my friends' posts, newest first, 10 at a time ("More" loads older ones).
  const {
    posts,
    myId,
    error,
    loaded,
    hasMore,
    loadingMore,
    version,
    createPost,
    editPost,
    revivePost,
    deletePost,
    toggleLike,
    loadMore,
    refresh,
  } = usePosts(undefined, "feed");
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error(err));
  }, []);

  // The Home icon in the top bar: reload the feed from the newest post and go back to the top
  useEffect(
    () =>
      onFeedRefresh(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        refresh();
      }),
    [refresh]
  );

  if (!profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

  // "Revive Post": the post goes to the top of the feed, so the page goes to the top too and the result is visible
  const handleRevivePost = async (postId: string) => {
    await revivePost(postId); // throws with the backend's message when it is too early (the card shows it)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOrderPost = (post: Post) => {
    if (post.product) setOrderingProduct(post.product);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      <HomeTopBar profile={profile} />

      <div className="mx-auto flex max-w-[1400px] justify-center gap-6 px-3 pb-24 pt-4 sm:px-4 md:pb-8">
        <LeftRail profile={profile} />

        <main className="flex w-full min-w-0 max-w-2xl flex-col gap-3 sm:gap-4">
          <Composer profile={profile} categories={categories} onPublish={createPost} />

          {error && <p className="px-1 text-xs text-red-600">{error}</p>}

          {!loaded ? (
            <p className="px-1 text-sm text-slate-500">Loading...</p>
          ) : posts.length === 0 && !hasMore ? (
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Nothing here yet</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Posts from you and your friends show up here. Write a post, attach a product from your store, or add some friends.
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                // `version` changes on every refresh, so the cards start fresh and show the new comment counts
                key={`${version}:${post.id}`}
                post={post}
                currentUserId={myId}
                onEdit={editPost}
                onRevive={handleRevivePost}
                onDelete={deletePost}
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
        </main>

        <RightRail />
      </div>

      <MobileTabBar />

      <OrderFormModal
        key={orderingProduct?.id ?? "no-order"}
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
      />
    </div>
  );
}
