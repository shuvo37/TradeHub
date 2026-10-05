// src/lib/comments-api.ts
import { apiRequest, jsonInit } from "@/lib/api";
import type { Comment } from "@/types/profile";

// The backend's CommentDto and the UI's Comment have the same shape, so nothing is converted.

// Oldest first (the backend already sorts them)
export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await apiRequest(`/api/comments/post/${postId}/allComment`);
  return (await res.json()) as Comment[];
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
