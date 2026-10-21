// src/components/SessionMessage.tsx
"use client";

import Link from "next/link";
import { NOT_LOGGED_IN } from "@/lib/auth-store";

// The red message on a page that could not load (the pages show it alone on an empty screen).
// When the reason is a lost session (the refresh cookie expired or was revoked), a button leads to the login page,
// so the user is never stuck on a dead screen.
export default function SessionMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 text-center">
      <p className="text-red-600">{message}</p>
      {message === NOT_LOGGED_IN && (
        <Link
          href="/auth/Login"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Go to login
        </Link>
      )}
    </div>
  );
}
