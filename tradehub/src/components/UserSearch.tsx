// src/components/UserSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchUsers, type UserSummary } from "@/lib/search-api";
import FriendButton from "@/components/FriendButton";
import { Avatar, Icon } from "@/app/Home/ui";

interface Props {
  className?: string;  // width of the search box (the dropdown follows it)
  autoFocus?: boolean; // used when the box is opened from the search icon on small screens
  onPick?: () => void; // called after a person is chosen, so the caller can close its search bar
}

// The "search people" box: type a name (or a full unique name like Rahim_x7k), pick a person,
// and their profile opens. It is a self-contained component, so any page can put it anywhere.
export default function UserSearch({ className = "w-64", autoFocus = false, onPick }: Props) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<UserSummary[] | null>(null); // null = nothing searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Search 300 ms after the user stops typing. If the text changes meanwhile, the old
  // request is ignored (`cancelled`), so a slow answer for "ra" can never replace the answer for "rahim".
  useEffect(() => {
    const q = text.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await searchUsers(q);
        if (!cancelled) setResults(found);
      } catch (err) {
        if (!cancelled) {
          setResults(null);
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  // Close the dropdown when the user presses anywhere outside the box
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleChange = (value: string) => {
    setText(value);
    setOpen(true);
    if (!value.trim()) {
      // Nothing to search for: clear everything (the effect above does nothing for empty text)
      setResults(null);
      setError(null);
      setLoading(false);
    }
  };

  const handlePick = () => {
    setOpen(false);
    setText("");
    setResults(null);
    onPick?.();
  };

  const showDropdown = open && text.trim() !== "";

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon name="search" className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search people"
        aria-label="Search people"
        className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />

      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[24rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {error ? (
            <p className="px-4 py-3 text-xs text-red-600">{error}</p>
          ) : results === null ? (
            <p className="px-4 py-3 text-xs text-slate-400">Searching...</p>
          ) : results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-xs text-slate-400">No people found</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((u) => (
                // The key includes the status, so a fresh search starts the button from the fresh status
                <li
                  key={`${u.id}-${u.friendStatus}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50"
                >
                  <Link
                    href={`/User/${u.id}`}
                    onClick={handlePick}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar name={u.name} src={u.avatar} className="h-10 w-10 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {u.name}
                      </span>
                      <span className="block truncate font-mono text-xs text-slate-400">
                        {u.uniqueName}
                      </span>
                      {u.location && (
                        <span className="block truncate text-xs text-slate-500">
                          📍 {u.location}
                        </span>
                      )}
                    </span>
                  </Link>
                  <FriendButton
                    userId={u.id}
                    initial={{ status: u.friendStatus, requestId: u.requestId }}
                    className="shrink-0 items-end"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
