// src/components/Feed.tsx
"use client";

import { Post, UserProfile, Category } from "@/types/profile";
import type { NewPost } from "@/lib/posts-api";
import Composer from "./Composer";
import PostCard from "./PostCard";

interface Props {
  profile: UserProfile;
  categories: Category[];
  posts: Post[];
  currentUserId: string | null;
  error: string | null;
  onCreatePost: (post: NewPost) => Promise<void>;
  onEditPost: (postId: string, text: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onToggleLike: (postId: string) => Promise<void>;
  onOrderPost: (post: Post) => void;
}

export default function Feed({
  profile,
  categories,
  posts,
  currentUserId,
  error,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onToggleLike,
  onOrderPost,
}: Props) {
  return (
    <main className="flex-1 h-[100dvh] overflow-y-auto bg-gray-100 pt-14 pb-16 md:pt-0 md:pb-0">
      <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4">
      {/*<Composer profile={profile} categories={categories} onPublish={onCreatePost} />*/}

        {error && <p className="text-xs text-red-600 px-1">{error}</p>}

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">No posts yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Share an update, a product, or just say hello. Your posts will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {posts.map(post => (
                <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onEdit={onEditPost}
                onDelete={onDeletePost}
                onToggleLike={onToggleLike}
                onOrder={onOrderPost}
                />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
