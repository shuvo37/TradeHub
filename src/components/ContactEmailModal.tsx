// src/components/ContactEmailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchContactEmail, type ContactEmailState } from "@/lib/contact-email-api";
import { notifyContactEmailChanged } from "@/lib/contact-email-events";
import ContactEmailFlow from "./ContactEmailFlow";

// The popup opened by "Contact email" in the account menu: shows the saved email and whether it is confirmed,
// and lets me change it (a new email gets a new code).
// Closes on the X button, a press outside the box, or Escape.
export default function ContactEmailModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<ContactEmailState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchContactEmail()
      .then((s) => {
        if (!cancelled) setState(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal to <body>, like the other popups: the top bar can clip a fixed popup placed inside it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Contact email"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">Contact email</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {error && <p className="py-6 text-center text-sm text-red-600">{error}</p>}
          {!state && !error && <p className="py-6 text-center text-sm text-slate-400">Loading...</p>}
          {state && <ContactEmailFlow initial={state} onEmailChanged={notifyContactEmailChanged} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
