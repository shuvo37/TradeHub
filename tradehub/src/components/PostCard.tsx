// src/components/PostCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Post } from "@/types/profile";
import CommentSection from "./CommentSection";

interface Props {
  post: Post;
  currentUserId: string | null;
  onEdit: (postId: string, text: string) => Promise<void>;
  onRevive: (postId: string) => Promise<void>; // rejects with the backend's message when it is too early
  onDelete: (postId: string) => void;
  onToggleLike: (postId: string) => Promise<void>;
  onOrder: (post: Post) => void;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostCard({
  post,
  currentUserId,
  onEdit,
  onRevive,
  onDelete,
  onToggleLike,
  onOrder,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [showComments, setShowComments] = useState(false);
  // The comment count lives here, because only this card and its comment list change it.
  const [commentCount, setCommentCount] = useState(post.commentCount);

  // Editing the post's text (the image and the attached product can't be changed)
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // The result of "Revive post": a short message on the card (success, or the backend's reason), hidden after a few seconds
  const [reviveNote, setReviveNote] = useState<{ text: string; ok: boolean } | null>(null);

  // Close the three-dot menu when the user presses anywhere outside it
  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  const handleLikeClick = async () => {
    // One request at a time: two quick clicks could otherwise reach the server in the wrong order.
    if (likeBusy) return;
    if (!post.likedByMe) {
      setLikePulse(true);
      setTimeout(() => setLikePulse(false), 350);
    }
    setLikeBusy(true);
    try {
      await onToggleLike(post.id);
    } finally {
      setLikeBusy(false);
    }
  };

  useEffect(() => {
    if (!reviveNote) return;
    const timer = setTimeout(() => setReviveNote(null), 5000);
    return () => clearTimeout(timer);
  }, [reviveNote]);

  // The backend decides if the post can be revived (once in 24 hours) and its message is shown here,
  // for example "You can revive this post again in 5h 12m".
  const handleRevive = async () => {
    setShowMenu(false);
    try {
      await onRevive(post.id);
      setReviveNote({ text: "Post revived. It is back at the top of your friends' feeds.", ok: true });
    } catch (err) {
      setReviveNote({ text: err instanceof Error ? err.message : "Something went wrong", ok: false });
    }
  };

  const startEdit = () => {
    setShowMenu(false);
    setEditError(null);
    setEditText(post.text);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError(null);
  };

  // The backend decides what is allowed (for example, a post with no image and no product needs text),
  // and its message is shown here. On failure the card stays in edit mode so nothing typed is lost.
  const handleSaveEdit = async () => {
    if (savingEdit) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      await onEdit(post.id, editText);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  };

  // Only the author can edit or delete a post (the backend enforces it too)
  const isAuthor = post.authorId === currentUserId;
  const product = post.product;

  const renderAvailabilityBadge = (qty: number | "Available" | "Unavailable") => {
    if (qty === "Available") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Available
        </span>
      );
    }
    if (qty === "Unavailable") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Unavailable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Qty: {qty}
      </span>
    );
  };

  const isOrderable = product?.quantity !== "Unavailable";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-500 font-bold text-sm sm:text-base">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{post.authorName}</p>
          <p className="text-[11px] text-gray-400">
            {timeAgo(post.createdAt)} · <span className="text-gray-300">🌐 Public</span>
          </p>
        </div>

        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Post options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={startEdit}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Edit Post
                </button>
                <button
                  onClick={handleRevive}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Revive Post
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {reviveNote && (
        <p
          role="status"
          className={`px-3 sm:px-4 pb-2 text-xs ${reviveNote.ok ? "text-green-700" : "text-red-600"}`}
        >
          {reviveNote.text}
        </p>
      )}

      {/* Text (or the edit box) */}
      {editing ? (
        <div className="px-3 sm:px-4 pb-3 flex flex-col gap-2">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {editError && <p className="text-xs text-red-600">{editError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingEdit ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        post.text && (
          <p className="px-3 sm:px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.text}
          </p>
        )
      )}

      {/* Image */}
      {post.image && (
        <div className="w-full bg-gray-50">
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-[70vh] sm:max-h-[500px] object-contain"
          />
        </div>
      )}

      {/* Order Now Block */}
      {product && (
        <div className="mx-3 sm:mx-4 my-3 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <div className="flex gap-3 p-3">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-800 truncate">
                  {product.name}
                </h4>
                {renderAvailabilityBadge(product.quantity)}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {product.description}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-base font-bold text-blue-600 font-mono">
                  {product.price}
                </p>
                {product.discount && product.discount > 0 && (
                  <span className="inline-flex items-center text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                    {product.discount}% off
                  </span>
                )}

              </div>
            </div>
          </div>
          <div className="px-3 pb-3">
                <button
                disabled={!isOrderable}
                onClick={() => {
                    if (!isOrderable) return;
                    onOrder(post);
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isOrderable
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                >
                {isOrderable ? "🛒 Order Now" : "Out of Stock"}
                </button>
          </div>
        </div>
      )}

      {/* Engagement Summary */}
      {(post.likeCount > 0 || commentCount > 0) && (
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {post.likeCount > 0 && (
              <>
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </span>
                <span>{post.likeCount}</span>
              </>
            )}
          </div>
          {commentCount > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline">
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-2 py-1 border-t border-gray-100 flex">
        <button
          onClick={handleLikeClick}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            post.likedByMe ? "text-blue-600 hover:bg-blue-50" : "text-gray-600 hover:bg-gray-50"
          } ${likePulse ? "scale-105" : "scale-100"}`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${likePulse ? "scale-125" : "scale-100"}`}
            fill={post.likedByMe ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Comment
        </button>
      </div>

      {/* Comments (fetched when opened) */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postAuthorId={post.authorId}
          currentUserId={currentUserId}
          setCommentCount={setCommentCount}
        />
      )}
    </article>
  );
}
