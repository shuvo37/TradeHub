// src/components/home/HomeSideRails.tsx
// The left shortcuts on Home: my profile and my friends list.
import Link from "next/link";
import type { UserProfile } from "@/types/profile";
import { Avatar, Icon } from "./ui";

const card = "rounded-2xl border border-slate-100 bg-white shadow-sm";

// Change this if your profile page lives on another route.
const PROFILE_HREF = "/Profile";
// My friends list (not the friend requests page, which is /Friends).
const FRIENDS_HREF = "/FriendList";

export function LeftRail({ profile }: { profile: UserProfile }) {
  return (
    <aside className="sticky top-[4.5rem] hidden h-fit w-72 shrink-0 lg:block">
      <nav className={`${card} flex flex-col p-2`} aria-label="Shortcuts">
        <Link
          href={PROFILE_HREF}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Avatar name={profile.name} src={profile.avatar} className="h-9 w-9 text-sm" />
          <span className="truncate text-sm font-semibold text-slate-900">{profile.name}</span>
        </Link>

        <Link
          href={FRIENDS_HREF}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon name="users" className="h-[18px] w-[18px]" />
          </span>
          <span className="text-sm font-medium text-slate-800">Friends</span>
        </Link>

        {/*<button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Icon name="bag" className="h-[18px] w-[18px]" />
          </span>
          <span className="text-sm font-medium text-slate-800">Order requests</span>
        </button>*/}
      </nav>
    </aside>
  );
}
