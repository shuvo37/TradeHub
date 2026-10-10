// src/components/home/HomeSideRails.tsx
// Symbolic only, except the profile link.
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

const REQUESTS = [
  { name: "Nusrat Jahan", meta: "4 mutual friends" },
  { name: "Tanvir Hasan", meta: "2 mutual friends" },
];

const SUGGESTIONS = [
  { name: "Rafi Ahmed", id: "Rafi Ahmed_K7Q" },
  { name: "Sadia Islam", id: "Sadia Islam_2MX" },
  { name: "Imran Hossain", id: "Imran Hossain_9TB" },
];

export function RightRail() {
  return (
    <aside className="sticky top-[4.5rem] hidden h-fit w-80 shrink-0 flex-col gap-3 xl:flex">
      <section className={`${card} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Friend requests{" "}
            <span className="ml-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
              {REQUESTS.length}
            </span>
          </h3>
          <button type="button" className="text-xs font-medium text-blue-600 hover:underline">
            See all
          </button>
        </div>
        <ul className="flex flex-col gap-4">
          {REQUESTS.map(r => (
            <li key={r.name} className="flex gap-3">
              <Avatar name={r.name} className="h-11 w-11 text-base" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                <p className="text-[11px] text-slate-400">{r.meta}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                    Confirm
                  </button>
                  <button type="button" className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} p-4`}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">People you may know</h3>
        <ul className="flex flex-col gap-3">
          {SUGGESTIONS.map(s => (
            <li key={s.id} className="flex items-center gap-3">
              <Avatar name={s.name} className="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                <p className="truncate font-mono text-[11px] text-slate-400">{s.id}</p>
              </div>
              <button type="button" className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                Add
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
