// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  UserProfile,
  defaultProfile,
  Category,
  Product,
  Post,
  Comment,
  OrderItem,
} from "@/types/profile";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import OrderFormModal, { OrderFormData } from "@/components/modals/OrderFormModal";
import { HomeTopBar, MobileTabBar } from "./HomeTopBar";
import { LeftRail, RightRail } from "./HomeSideRails";

type PostDraft = { text: string; image?: string; orderItem?: OrderItem };

export default function page() {
  // Same localStorage keys as TradeHubApp, so posts are shared with the profile page.
  const [profile] = useLocalStorage<UserProfile>("tradehub_profile", defaultProfile);
  const [categories] = useLocalStorage<Category[]>("tradehub_categories", []);
  const [posts, setPosts] = useLocalStorage<Post[]>("tradehub_posts", []);
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);

  // localStorage only exists in the browser; wait for mount so server and client HTML match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-[100dvh] bg-slate-100" />;

  const handleCreatePost = (draft: PostDraft) => {
    const post: Post = {
      id: Date.now().toString(),
      text: draft.text,
      image: draft.image,
      orderItem: draft.orderItem,
      comments: [],
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
    };
    setPosts(prev => [post, ...prev]);
  };

  const handleDeletePost = (postId: string) =>
    setPosts(prev => prev.filter(p => p.id !== postId));

  const handleAddComment = (postId: string, text: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      authorName: profile.name,
      authorAvatar: profile.avatar,
      text,
      createdAt: Date.now(),
    };
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  };

  const handleToggleLike = (postId: string) =>
    setPosts(prev =>
      prev.map(p =>
        p.id !== postId
          ? p
          : {
              ...p,
              likedByMe: !p.likedByMe,
              likes: p.likedByMe ? Math.max(0, (p.likes ?? 0) - 1) : (p.likes ?? 0) + 1,
            }
      )
    );

  const handleOrderPost = (post: Post) => {
    if (!post.orderItem) return;
    setOrderingProduct({
      id: `post-${post.id}`,
      name: post.orderItem.name,
      price: post.orderItem.price,
      description: post.orderItem.description,
      image: post.orderItem.image ?? "",
      quantity: post.orderItem.quantity,
      discount: post.orderItem.discount,
    });
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
          <Composer profile={profile} categories={categories} onPublish={handleCreatePost} />

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
                profile={profile}
                onDelete={handleDeletePost}
                onAddComment={handleAddComment}
                onToggleLike={handleToggleLike}
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
