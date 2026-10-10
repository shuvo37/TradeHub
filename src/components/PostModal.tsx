// src/components/PostModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getUser } from "@/lib/auth-store";
import { fetchPostById } from "@/lib/posts-api";
import { timeAgo } from "@/lib/time";
import { Avatar } from "@/app/Home/ui";
import CommentSection from "./CommentSection";
import type { Post } from "@/types/profile";

interface Props {
  postId: string;
  onClose: () => void;
}

// A popup that shows ONE post and its comments, opened from a "commented on your post" notification.
// The post is read-only here (no like, edit, delete or order). The comments use the same rules as on the
// timeline: only the author edits a comment, the author or the post's owner deletes it, and anyone can
// write a new comment. Closes on the X button, a press outside the box, or Escape.
export default function PostModal({ postId, onClose }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The comment count lives here, because only the comment list below changes it.
  const [commentCount, setCommentCount] = useState(0);
  // Load the post. A deleted post answers 404 and the backend's message is shown.
  useEffect(() => {
    let cancelled = false;
    fetchPostById(postId)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        setCommentCount(p.commentCount);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Escape closes the popup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const product = post?.product ?? null;

  // Portal to <body>: the top bar can clip or re-position a fixed popup placed inside it.
  // This only renders after a click (never during server rendering), so `document` exists.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        // Only a press on the dark area itself closes it, not a press inside the box
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post"
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">
            {post ? `${post.authorName}'s post` : "Post"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          {error && <p className="px-4 py-10 text-center text-sm text-red-600">{error}</p>}
          {!post && !error && <p className="px-4 py-10 text-center text-sm text-gray-400">Loading...</p>}

          {post && (
            <>
              <div className="flex items-center gap-3 p-4">
                <Avatar name={post.authorName} src={post.authorAvatar} className="h-10 w-10 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{post.authorName}</p>
                  <p className="text-[11px] text-gray-400">{timeAgo(post.createdAt)}</p>
                </div>
              </div>

              {post.text && (
                <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-gray-800">{post.text}</p>
              )}

              {post.image && (
                <div className="w-full bg-gray-50">
                  <img src={post.image} alt="Post" className="max-h-[50vh] w-full object-contain" />
                </div>
              )}

              {/* The attached product, shown for information only (no Order button here) */}
              {product && (
                <div className="mx-4 my-3 flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-800">{product.name}</h4>
                    <p className="font-mono text-base font-bold text-blue-600">{product.price}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                <span>
                  {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                </span>
                <span>
                  {commentCount} {commentCount === 1 ? "comment" : "comments"}
                </span>
              </div>

              <CommentSection
                postId={post.id}
                postAuthorId={post.authorId}
                currentUserId={getUser()?.id ?? null}
                setCommentCount={setCommentCount}
              />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
