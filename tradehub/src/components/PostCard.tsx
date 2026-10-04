// src/components/PostCard.tsx
"use client";

import { useState } from "react";
import { Post, UserProfile } from "@/types/profile";

interface Props {
  post: Post;
  profile: UserProfile;
  onDelete: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleLike: (postId: string) => void;
  onOrder: (post: Post) => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
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
  profile,
  onDelete,
  onAddComment,
  onToggleLike,
  onOrder,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [likePulse, setLikePulse] = useState(false);

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText("");
  };

  const handleLikeClick = () => {
    onToggleLike(post.id);
    if (!post.likedByMe) {
      setLikePulse(true);
      setTimeout(() => setLikePulse(false), 350);
    }
  };

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

  const isOrderable = post.orderItem?.quantity !== "Unavailable";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-500 font-bold text-sm sm:text-base">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{profile.name}</p>
          <p className="text-[11px] text-gray-400">
            {timeAgo(post.createdAt)} · <span className="text-gray-300">🌐 Public</span>
          </p>
        </div>

        <div className="relative">
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
      </div>

      {/* Text */}
      {post.text && (
        <p className="px-3 sm:px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.text}
        </p>
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
      {post.orderItem && (
        <div className="mx-3 sm:mx-4 my-3 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <div className="flex gap-3 p-3">
            {post.orderItem.image && (
              <img
                src={post.orderItem.image}
                alt={post.orderItem.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-800 truncate">
                  {post.orderItem.name}
                </h4>
                {renderAvailabilityBadge(post.orderItem.quantity)}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {post.orderItem.description}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-base font-bold text-blue-600 font-mono">
                  {post.orderItem.price}
                </p>
                {post.orderItem.discount && post.orderItem.discount > 0 && (
                  <span className="inline-flex items-center text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                    {post.orderItem.discount}% off
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
      {(post.likes > 0 || post.comments.length > 0) && (
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {post.likes > 0 && (
              <>
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </span>
                <span>{post.likes}</span>
              </>
            )}
          </div>
          {post.comments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline">
              {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
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

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-3 sm:px-4 py-3 flex flex-col gap-3">
          {post.comments.length > 0 && (
            <div className="flex flex-col gap-2">
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
                    {c.authorAvatar ? (
                      <img
                        src={c.authorAvatar}
                        alt={c.authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-500 text-[10px] font-bold">
                        {c.authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 bg-white rounded-xl px-3 py-1.5 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-800">{c.authorName}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-500 text-[10px] font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
              placeholder="Write a comment..."
              className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={!commentText.trim()}
              className={`px-3 rounded-full text-xs font-semibold transition-colors ${
                commentText.trim()
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </article>
  );
}