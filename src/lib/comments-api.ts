// src/lib/comments-api.ts
import { apiRequest, jsonInit } from "@/lib/api";
import type { Comment } from "@/types/profile";

// The backend's CommentDto and the UI's Comment have the same shape, so nothing is converted.

// One page of comments, oldest first (the backend decides the page size: 5).
// `after` is the createdAt of the last comment you already have; leave it out for the first page.
export interface CommentPage {
  items: Comment[];
  hasMore: boolean;
}

export async function fetchCommentsPage(postId: string, after?: string): Promise<CommentPage> {
  const query = after ? `?after=${encodeURIComponent(after)}` : "";
  const res = await apiRequest(`/api/comments/post/${postId}/page${query}`);
  return (await res.json()) as CommentPage;
}

// Returns the saved comment, with the author's name and avatar filled in by the server
export async function addComment(postId: string, text: string): Promise<Comment> {
  const res = await apiRequest(`/api/posts/${postId}/comments`, jsonInit("POST", { text }));
  return (await res.json()) as Comment;
}

// 204 No Content. Only the comment's author can edit it.
export async function updateComment(id: string, text: string): Promise<void> {
  await apiRequest(`/api/comments/${id}`, jsonInit("PUT", { text }));
}

// 204 No Content. Allowed for the comment's author and for the post's owner.
export async function deleteComment(id: string): Promise<void> {
  await apiRequest(`/api/comments/${id}`, { method: "DELETE" });
}
