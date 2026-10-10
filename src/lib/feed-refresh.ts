// src/lib/feed-refresh.ts
// A tiny signal between the Home icon in the top bar and the Home feed.
// Clicking Home while you are already on /Home does not remount the page, so the page cannot notice by itself.
// The icon calls requestFeedRefresh(); the Home page listens with onFeedRefresh() and reloads the feed.
// When you click Home from another page nobody is listening, which is fine: Home mounts and loads fresh anyway.

const EVENT = "tradehub:refresh-feed";

export function requestFeedRefresh(): void {
  window.dispatchEvent(new Event(EVENT));
}

// Returns the function that stops listening (use it as the cleanup of an effect)
export function onFeedRefresh(handler: () => void): () => void {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
