// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePosts } from "@/hooks/usePosts";
import { fetchCategories } from "@/lib/store-api";
import {
  UserProfile,
  defaultProfile,
  Category,
  Product,
  Post,
} from "@/types/profile";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import OrderFormModal, { OrderFormData } from "@/components/modals/OrderFormModal";
import { HomeTopBar, MobileTabBar } from "./HomeTopBar";
import { LeftRail, RightRail } from "./HomeSideRails";

export default function HomePage() {
  // The profile is still the localStorage prototype (wired in a later step).
  const [profile] = useLocalStorage<UserProfile>("tradehub_profile", defaultProfile);
  // Categories (with their products) come from the API; the Composer needs them to attach a product.
  const [categories, setCategories] = useState<Category[]>([]);
  // For now Home shows my own posts, same as the Profile page. The real feed rule comes later.
  const { posts, myId, error, createPost, deletePost, toggleLike } = usePosts();
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error(err));
  }, []);

  // localStorage only exists in the browser; wait for mount so server and client HTML match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-[100dvh] bg-slate-100" />;

  const handleOrderPost = (post: Post) => {
    if (post.product) setOrderingProduct(post.product);
  };

  const handleSubmitOrder = (data: OrderFormData) => {
    console.log("Order submitted:", data); // same as before: seller end not wired here
    setOrderingProduct(null);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      <HomeTopBar profile={profile} />

      <div className="mx-auto flex max-w-[1400px] justify-center gap-6 px-3 pb-24 pt-4 sm:px-4 md:pb-8">
        <LeftRail profile={profile} />

        <main className="flex w-full min-w-0 max-w-2xl flex-col gap-3 sm:gap-4">
          <Composer profile={profile} categories={categories} onPublish={createPost} />

          {error && <p className="px-1 text-xs text-red-600">{error}</p>}

          {posts.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">Nothing here yet</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Write your first post or attach a product from your store. It will show up here.
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={myId}
                onDelete={deletePost}
                onToggleLike={toggleLike}
                onOrder={handleOrderPost}
              />
            ))
          )}
        </main>

        <RightRail />
      </div>

      <MobileTabBar />

      <OrderFormModal
        key={orderingProduct?.id ?? "no-order"}
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
        onSubmit={handleSubmitOrder}
      />
    </div>
  );
}
