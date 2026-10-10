// src/hooks/useDiscoverPosts.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import {
  fetchDiscoverPosts,
  likePost as likePostApi,
  unlikePost as unlikePostApi,
} from "@/lib/posts-api";
import type { Post } from "@/types/profile";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Discover "For you": posts from people outside my friends list, best score first, 10 at a time.
// "More" adds the next 10 below the ones on screen. Only liking is handled here: these are never my own posts,
// so there is nothing to edit, revive or delete.
// `myId` is the logged-in user (the post card needs it to know the viewer is not the author).
export function useDiscoverPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // false until the first load has finished (so the page can tell "still loading" from "really empty")
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Where the next page starts: the nextSkip the server sent with the last page (a ref: it never changes what is drawn)
  const skipRef = useRef(0);

  useEffect(() => {
    ensureUser() // after a page reload this restores the session first, so the token exists
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setMyId(user.id);
        const page = await fetchDiscoverPosts(0);
        setPosts(page.items);
        setHasMore(page.hasMore);
        skipRef.current = page.nextSkip;
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoaded(true));
  }, []);

  // The "More" button: the next 10 posts of the ranked list. A post that is already on screen is not added twice.
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setError(null);
    setLoadingMore(true);
    try {
      const page = await fetchDiscoverPosts(skipRef.current);
      setPosts((prev) => {
        const shown = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !shown.has(p.id))];
      });
      setHasMore(page.hasMore);
      skipRef.current = page.nextSkip;
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
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

  return { posts, myId, error, loaded, hasMore, loadingMore, toggleLike, loadMore };
}
