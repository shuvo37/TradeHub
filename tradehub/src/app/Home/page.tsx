// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProfile } from "../../hooks/useProfile";
import { usePosts } from "../../hooks/usePosts";
import { fetchCategories } from "@/lib/store-api";
import { Category, Product, Post } from "@/types/profile";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import OrderFormModal, { OrderFormData } from "@/components/modals/OrderFormModal";
import { HomeTopBar, MobileTabBar } from "./HomeTopBar";
import { LeftRail, RightRail } from "./HomeSideRails";

export default function HomePage() {
  // The profile comes from the backend (null until loaded)
  const { profile, error: profileError } = useProfile();
  // Categories (with their products) come from the API; the Composer needs them to attach a product.
  const [categories, setCategories] = useState<Category[]>([]);
  // For now Home shows my own posts, same as the Profile page. The real feed rule comes later.
  const { posts, myId, error, createPost, editPost, deletePost, toggleLike } = usePosts();
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error(err));
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

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
                onEdit={editPost}
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
