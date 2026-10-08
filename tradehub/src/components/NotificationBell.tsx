// src/components/NotificationBell.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ensureUser } from "@/lib/auth-store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  type AppNotification,
} from "../lib/notifications-api";
import { timeAgo } from "@/lib/time";
import { Avatar, Icon } from "@/app/Home/ui";
import PostModal from "./PostModal";

const POLL_MS = 30_000; // how often the red number is refreshed

// What each kind of notification says, and where clicking it goes.
// A line with no href opens a popup instead of changing the page (see PostCommented below).
function describe(n: AppNotification): { text: string; href?: string } {
  switch (n.type) {
    case "FriendRequestReceived":
      return { text: "sent you a friend request", href: "/Friends" };
    case "FriendRequestAccepted":
      return { text: "accepted your friend request", href: `/User/${n.actorId}` };
    case "PostCommented":
      return { text: "commented on your post" };
  }
}

// The bell in the top bar: a red number of unread notifications, and a dropdown list.
// Opening the bell marks everything as read (the red number goes away at once, like on social media).
export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null); // null = loading
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // The post shown in the popup after a "commented on your post" line is clicked
  const [popupPostId, setPopupPostId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // The poll below must not bring the number back while the list is open (everything is read then)
  const openRef = useRef(false);

  // Ask for the unread number now, then every 30 seconds. A bell that can't load just shows no number.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      ensureUser()
        .then(async (user) => {
          if (!user) return;
          const n = await fetchUnreadCount();
          if (!cancelled && !openRef.current) setCount(n);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  // Close on a press outside the bell, or on Escape
  useEffect(() => {
    if (!open) return;
    const onPress = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPress);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const toggle = async () => {
    if (open) {
      close();
      return;
    }
    openRef.current = true;
    setOpen(true);
    setItems(null);
    setError(null);
    try {
      // Load the list first, so the unread lines are still highlighted when shown...
      setItems(await fetchNotifications());
      // ...then mark everything read. The number goes away only after the server says OK.
      await markAllNotificationsRead();
      setCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          open ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <Icon name="bell" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto">
            {error && <p className="px-4 py-6 text-center text-sm text-red-600">{error}</p>}
            {!items && !error && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading...</p>
            )}
            {items && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            )}

            {items && items.length > 0 && (
              <ul>
                {items.map((n) => {
                  const { text, href } = describe(n);
                  const rowClass = `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    n.isRead ? "" : "bg-blue-50/70"
                  }`;
                  const content = (
                    <>
                      <Avatar name={n.actorName} src={n.actorAvatar} className="h-11 w-11 text-base" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">{n.actorName}</span> {text}
                        </p>
                        <p className={`text-xs ${n.isRead ? "text-slate-400" : "font-medium text-blue-600"}`}>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />
                      )}
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link href={href} onClick={close} className={rowClass}>
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={!n.postId}
                          onClick={() => {
                            close();
                            setPopupPostId(n.postId);
                          }}
                          className={rowClass}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {popupPostId && <PostModal postId={popupPostId} onClose={() => setPopupPostId(null)} />}
    </div>
  );
}
