// src/hooks/usePosts.ts
"use client";

import { useEffect, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import {
  fetchPostsByUser,
  createPost as createPostApi,
  updatePostText,
  deletePost as deletePostApi,
  likePost as likePostApi,
  unlikePost as unlikePostApi,
  type NewPost,
} from "@/lib/posts-api";
import type { Post } from "@/types/profile";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// The logged-in user's posts: loads them once, and keeps the list in sync with the server.
// Profile and Home both use this, so the load/create/edit/delete/like logic exists in one place.
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureUser()
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setMyId(user.id);
        setPosts(await fetchPostsByUser(user.id));
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // Throws on failure: the Composer shows the message and keeps the draft.
  const createPost = async (input: NewPost) => {
    const created = await createPostApi(input);
    setPosts((prev) => [created, ...prev]); // newest first, same as the server's order
    setError(null);
  };

  // Throws on failure: the post card shows the message and stays in edit mode.
  // The server trims the text, so the list stores the trimmed text too.
  const editPost = async (postId: string, text: string) => {
    await updatePostText(postId, text);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, text: text.trim() } : p)));
    setError(null);
  };

  // Failure has no form to show it in, so it goes to `error` (shown above the list).
  const deletePost = async (postId: string) => {
    try {
      await deletePostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Shows one post as liked / not liked on screen, and moves its count by one.
  // Used for the instant update and again for the undo, so it never counts the same change twice.
  const showLike = (postId: string, liked: boolean) =>
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || p.likedByMe === liked) return p;
        return { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) };
      })
    );

  // The button reacts at once; if the server refuses, the change is undone and the error is shown.
  const toggleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = !post.likedByMe;

    showLike(postId, liked);
    try {
      await (liked ? likePostApi(postId) : unlikePostApi(postId));
      setError(null);
    } catch (err) {
      showLike(postId, !liked); // undo
      setError(errorMessage(err));
    }
  };

  return { posts, myId, error, createPost, editPost, deletePost, toggleLike };
}
