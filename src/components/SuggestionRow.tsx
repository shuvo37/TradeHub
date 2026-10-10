// src/components/SuggestionRow.tsx
"use client";

import Link from "next/link";
import FriendButton from "@/components/FriendButton";
import type { Suggestion } from "@/lib/friends-api";
import { Avatar } from "@/app/Home/ui";

// One person in "People you may know": avatar, name (opens the profile), why they are suggested, and the friend button.
// The button gets its start from the suggestion, so it does not ask the server for the status again.
export default function SuggestionRow({ person }: { person: Suggestion }) {
  const profileHref = `/User/${person.id}`;

  return (
    <li className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Link href={profileHref} className="shrink-0">
          <Avatar name={person.name} src={person.avatar || undefined} className="h-12 w-12 text-lg" />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={profileHref}
            className="block truncate text-sm font-semibold text-slate-900 hover:underline"
          >
            {person.name}
          </Link>
          <p className="truncate font-mono text-[11px] text-slate-400">{person.uniqueName}</p>
          <p className="truncate text-xs text-slate-500">{person.reason}</p>
          {person.location && <p className="truncate text-xs text-slate-400">📍 {person.location}</p>}

          <FriendButton
            userId={person.id}
            initial={{ status: person.friendStatus, requestId: person.requestId }}
            className="mt-2"
          />
        </div>
      </div>
    </li>
  );
}
