// src/components/CatalogSearchBar.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSearchSuggestions } from "@/lib/catalog-search-api";
import { Icon } from "@/app/Home/ui";

interface Props {
  value: string;                    // the text in the box (the page owns it, so "Clear" can empty it)
  onChange: (value: string) => void;
  onSubmit: (term: string) => void; // Enter, the Search button, or a click on a suggestion
  className?: string;
}

// The Discover "search products" box with autocomplete.
//   - Box empty and focused: my latest searches.
//   - Typing: lines that start with what I typed (250 ms after I stop typing), from the server.
// Pressing Enter or clicking a line runs the search; the search itself (and remembering it) is the page's job.
export default function CatalogSearchBar({ value, onChange, onSubmit, className = "" }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Counts the requests for lines. An answer that arrives after a newer request has started is thrown away,
  // so a slow answer for "tr" can never replace the answer for "tri".
  const requestRef = useRef(0);

  // Asks the server for the lines under the box ("" = my latest searches). A failure just means no lines.
  const load = useCallback((text: string) => {
    const id = ++requestRef.current;
    fetchSearchSuggestions(text)
      .then((list) => {
        if (id === requestRef.current) setItems(list);
      })
      .catch(() => {
        if (id === requestRef.current) setItems([]);
      });
  }, []);

  // Typing: ask 250 ms after the last key. (An empty box is handled by the change and focus handlers below.)
  useEffect(() => {
    const q = value.trim();
    if (!q) return;
    const timer = setTimeout(() => load(q), 250);
    return () => clearTimeout(timer);
  }, [value, load]);

  // Close the lines when the user presses anywhere outside the box
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleChange = (text: string) => {
    onChange(text);
    setOpen(true);
    if (!text.trim()) load(""); // the box was emptied: show my latest searches again
  };

  const handleFocus = () => {
    setOpen(true);
    if (!value.trim()) load("");
  };

  const submit = (term: string) => {
    const text = term.trim();
    if (!text) return; // nothing typed: nothing to search
    setOpen(false);
    onChange(text);
    onSubmit(text);
  };

  const showLines = open && items.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            maxLength={60}
            autoComplete="off"
            placeholder="Search products and categories"
            aria-label="Search products and categories"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {showLines && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {!value.trim() && (
            <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Recent searches
            </p>
          )}
          <ul className="max-h-72 overflow-y-auto py-1" aria-label="Suggestions">
            {items.map((text) => (
              <li key={text}>
                <button
                  type="button"
                  onClick={() => submit(text)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                >
                  <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
