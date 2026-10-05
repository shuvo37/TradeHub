// src/components/CommentSection.tsx
"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { getUser } from "@/lib/auth-store";
import { fetchComments, addComment, updateComment, deleteComment } from "@/lib/comments-api";
import type { Comment } from "@/types/profile";

interface Props {
  postId: string;
  postAuthorId: string;
  currentUserId: string | null;
  // The post card shows the comment count; this keeps it in step with the list below.
  setCommentCount: Dispatch<SetStateAction<number>>;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

function Avatar({ name, avatar, size }: { name: string; avatar: string; size: string }) {
  return (
    <div
      className={`${size} rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0`}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-blue-500 text-[10px] font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// Mounted when the user opens the comments, so a post's comments are only fetched if someone looks.
export default function CommentSection({
  postId,
  postAuthorId,
  currentUserId,
  setCommentCount,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Three-dot menu: only one comment's menu is open at a time
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null); // attached to the open comment's menu only

  // Editing: only one comment is edited at a time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const me = getUser(); // the logged-in user (already restored by the time anyone opens comments)

  useEffect(() => {
    fetchComments(postId)
      .then((list) => {
        setComments(list);
        setCommentCount(list.length); // the list is the truth, even if others commented since the page loaded
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [postId, setCommentCount]);

  // Close the open menu when the user presses anywhere outside it
  useEffect(() => {
    if (!openMenuId) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    try {
      const saved = await addComment(postId, trimmed);
      setComments((prev) => [...prev, saved]); // oldest first, so the new one goes last
      setCommentCount((c) => c + 1);
      setText("");
    } catch (err) {
      setError(errorMessage(err)); // the draft stays in the box
    } finally {
      setSending(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setOpenMenuId(null);
    setError(null);
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    const commentId = editingId;
    const trimmed = editText.trim();
    if (!commentId || !trimmed || savingEdit) return;

    setError(null);
    setSavingEdit(true);
    try {
      await updateComment(commentId, trimmed);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text: trimmed } : c)));
      cancelEdit();
    } catch (err) {
      setError(errorMessage(err)); // stay in edit mode so nothing typed is lost
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setOpenMenuId(null);
    setError(null);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((c) => c - 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-3 sm:px-4 py-3 flex flex-col gap-3">
      {loading && <p className="text-xs text-gray-400">Loading comments...</p>}

      {comments.length > 0 && (
        <div className="flex flex-col gap-2">
          {comments.map((c) => {
            const isAuthor = c.authorId === currentUserId;
            // Only the author can edit. The author or the post's owner can delete.
            // (The backend enforces the same rules.)
            const canEdit = isAuthor;
            const canDelete = isAuthor || postAuthorId === currentUserId;
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="flex gap-2">
                <Avatar name={c.authorName} avatar={c.authorAvatar} size="w-7 h-7" />
                <div className="flex-1 min-w-0 bg-white rounded-xl px-3 py-1.5 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800">{c.authorName}</p>

                    {(canEdit || canDelete) && !isEditing && (
                      <div
                        className="relative -mr-1"
                        ref={openMenuId === c.id ? menuRef : null}
                      >
                        <button
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                          aria-label="Comment options"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === c.id && (
                          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[110px]">
                            {canEdit && (
                              <button
                                onClick={() => startEdit(c)}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editText.trim() || savingEdit}
                          className={`text-[11px] font-semibold ${
                            editText.trim() && !savingEdit
                              ? "text-blue-600 hover:text-blue-800"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {c.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Avatar name={me?.name ?? "?"} avatar={me?.avatar ?? ""} size="w-7 h-7" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a comment..."
          className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={`px-3 rounded-full text-xs font-semibold transition-colors ${
            text.trim() && !sending
              ? "text-blue-600 hover:bg-blue-50"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          {sending ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
