// src/components/home/HomeTopBar.tsx
"use client";

import type { UserProfile } from "@/types/profile";
import { Avatar, Icon, IconName } from "./ui";

const TABS: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Home" },
  { icon: "users", label: "Friends" },
  { icon: "compass", label: "Discover" },
  { icon: "store", label: "Store" },
];

function IconButton({
  icon,
  label,
  badge,
  className = "",
}: {
  icon: IconName;
  label: string;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
    >
      <Icon name={icon} />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function HomeTopBar({ profile }: { profile: UserProfile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4">
        {/* Left: brand + search */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-extrabold text-white shadow-sm">
            T
          </div>
          <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 sm:block">
            TradeHub
          </span>
          <label className="relative ml-2 hidden lg:block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search people or products"
              className="w-64 rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
        </div>

        {/* Center: main tabs (desktop) */}
        <nav className="hidden h-full md:flex" aria-label="Main">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-current={i === 0 ? "page" : undefined}
              className={`relative flex h-full w-16 items-center justify-center transition-colors lg:w-20 ${
                i === 0
                  ? "text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon name={t.icon} className="h-6 w-6" />
              {i === 0 && (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
              )}
            </button>
          ))}
        </nav>
        <div className="md:hidden" />

        {/* Right: actions */}
        <div className="col-start-3 flex items-center justify-end gap-2">
          <IconButton icon="search" label="Search" className="lg:hidden" />
          <IconButton icon="bag" label="Order requests" badge={2} />
          <IconButton icon="bell" label="Notifications" badge={5} />
          <button
            type="button"
            aria-label="Your profile"
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Avatar name={profile.name} src={profile.avatar} className="h-10 w-10 text-sm" />
          </button>
        </div>
      </div>
    </header>
  );
}

const MOBILE_TABS: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Home" },
  { icon: "users", label: "Friends" },
  { icon: "compass", label: "Discover" },
  { icon: "bag", label: "Orders" },
  { icon: "user", label: "Profile" },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MOBILE_TABS.map((t, i) => (
        <button
          key={t.label}
          type="button"
          aria-current={i === 0 ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
            i === 0 ? "text-blue-600" : "text-slate-500"
          }`}
        >
          <Icon name={t.icon} className="h-6 w-6" />
          {t.label}
        </button>
      ))}
    </nav>
  );
}
