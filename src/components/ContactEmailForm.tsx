// src/components/ContactEmailForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { saveContactEmail } from "@/lib/contact-email-api";

interface Props {
  initialEmail?: string;
  onSaved: (email: string) => void;
  // The other button next to Save: "Log out" in the required screen, "Cancel" in the popup
  secondary: { label: string; onClick: () => void };
}

// The email field + Save, shared by the required screen (ContactEmailGate) and the popup (ContactEmailModal).
// The backend checks the email and answers with a message; that message is shown and the typed text is kept.
export default function ContactEmailForm({ initialEmail = "", onSaved, secondary }: Props) {
  const [value, setValue] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await saveContactEmail(value);
      // The server stores it trimmed and in lower case
      onSaved(value.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={secondary.onClick}
          disabled={saving}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
        >
          {secondary.label}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
