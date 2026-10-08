// src/hooks/usePosts.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureUser } from "@/lib/auth-store";
import {
  fetchFeed,
  fetchPostById,
  fetchPostsByUser,
  revivePost as revivePostApi,
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

// Which posts the list holds:
//   "profile" (default): all posts of one user: mine by default, or the posts of `userId` when someone visits that profile.
//   "feed": the news feed: my posts and my friends' posts, newest first, 10 at a time (`userId` is ignored).
// It also keeps the list in sync with the server (create / edit / delete / like).
// `myId` is always the logged-in user, so a post card knows whether the viewer is the author.
// Profile and Home both use this, so the load/create/edit/delete/like logic exists in one place.
export function usePosts(userId?: string, source: "profile" | "feed" = "profile") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // false until the first load has finished (so a page can tell "still loading" from "really empty")
  const [loaded, setLoaded] = useState(false);

  // Feed paging. `cursor` is the `nextCursor` the server sent with the last page (the feed time of its last post:
  // the revive time, or the creation time if never revived). It is kept in a ref so deleting or moving a post
  // in the list never changes it. Only the "More" button reads it.
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  // Counts every (re)load. A response that arrives after a newer load has started is thrown away,
  // so a slow answer can never overwrite a fresher list.
  const loadRef = useRef(0);
  // Goes up on every refresh. A page can put it in the posts' keys so the cards start fresh (new comment counts).
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const id = ++loadRef.current;

    ensureUser()
      .then(async (user) => {
        if (!user) {
          setError("You are not logged in.");
          return;
        }
        setMyId(user.id);

        if (source === "feed") {
          const page = await fetchFeed();
          if (id !== loadRef.current) return;
          setPosts(page.items);
          setHasMore(page.hasMore);
          cursorRef.current = page.nextCursor ?? undefined;
        } else {
          const list = await fetchPostsByUser(userId ?? user.id);
          if (id !== loadRef.current) return;
          setPosts(list);
        }
      })
      .catch((err) => {
        if (id === loadRef.current) setError(errorMessage(err));
      })
      .finally(() => {
        if (id === loadRef.current) setLoaded(true);
      });
  }, [userId, source]);

  // Feed only. Loads the newest page again and replaces the list (the old posts stay on screen until the new ones arrive).
  // On failure the list stays as it was and the message goes to `error`.
  const refresh = useCallback(async () => {
    if (source !== "feed") return;
    const id = ++loadRef.current;

    try {
      const page = await fetchFeed();
      if (id !== loadRef.current) return;
      setPosts(page.items);
      setHasMore(page.hasMore);
      cursorRef.current = page.nextCursor ?? undefined;
      setLoadingMore(false); // a "More" that was still loading belongs to the old list
      setVersion((v) => v + 1);
      setError(null);
    } catch (err) {
      if (id === loadRef.current) setError(errorMessage(err));
    }
  }, [source]);

  // Feed only. The "More" button: the next 10 posts older than the oldest one loaded from the server.
  const loadMore = async () => {
    if (source !== "feed" || loadingMore || !hasMore) return;
    const id = loadRef.current;

    setError(null);
    setLoadingMore(true);
    try {
      const page = await fetchFeed(cursorRef.current);
      if (id !== loadRef.current) return; // a refresh happened meanwhile: this page belongs to the old list
      setPosts((prev) => {
        const shown = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !shown.has(p.id))];
      });
      setHasMore(page.hasMore);
      cursorRef.current = page.nextCursor ?? cursorRef.current;
    } catch (err) {
      if (id === loadRef.current) setError(errorMessage(err));
    } finally {
      if (id === loadRef.current) setLoadingMore(false);
    }
  };

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

  // The "Revive post" menu item. Throws on failure: the post card shows the backend's message
  // (for example "You can revive this post again in 5h 12m").
  // In the feed the revived post then goes to the top of the list, like a new post. We read it again from the server
  // so the card has the real revive time; if that read fails, the card still moves, with its old data.
  // (An edit can revive a post too, but the post stays where it is until the next refresh,
  // so a card does not jump away while its author is reading it.)
  const revivePost = async (postId: string) => {
    await revivePostApi(postId);
    setError(null);
    if (source !== "feed") return;

    let fresh: Post | undefined;
    try {
      fresh = await fetchPostById(postId);
    } catch {
      // keep the card as it is
    }
    setPosts((prev) => {
      const current = prev.find((p) => p.id === postId);
      if (!current) return prev;
      return [fresh ?? current, ...prev.filter((p) => p.id !== postId)];
    });
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

  return {
    posts,
    myId,
    error,
    loaded,
    hasMore,
    loadingMore,
    version,
    createPost,
    editPost,
    revivePost,
    deletePost,
    toggleLike,
    loadMore,
    refresh,
  };
}
