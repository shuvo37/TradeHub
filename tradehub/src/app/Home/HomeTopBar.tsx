// src/components/home/HomeTopBar.tsx
"use client";

import Link from "next/link";
import type { UserProfile } from "@/types/profile";
import { Avatar, Icon, IconName } from "./ui";

// href = the tab really navigates; tabs without one are still dummy
const TABS: { icon: IconName; label: string; href?: string }[] = [
  { icon: "home", label: "Home", href: "/Home" },
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

// `active` says which page the bar is on, so the right tab (or the avatar) is highlighted.
export function HomeTopBar({
  profile,
  active = "home",
}: {
  profile: UserProfile;
  active?: "home" | "profile";
}) {
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
          {TABS.map((t) => {
            const isActive = t.label === "Home" && active === "home";
            const className = `relative flex h-full w-16 items-center justify-center transition-colors lg:w-20 ${
              isActive
                ? "text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`;
            const content = (
              <>
                <Icon name={t.icon} className="h-6 w-6" />
                {isActive && (
                  <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </>
            );
            return t.href ? (
              <Link
                key={t.label}
                href={t.href}
                title={t.label}
                aria-label={t.label}
                aria-current={isActive ? "page" : undefined}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <button
                key={t.label}
                type="button"
                title={t.label}
                aria-label={t.label}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </nav>
        <div className="md:hidden" />

        {/* Right: actions */}
        <div className="col-start-3 flex items-center justify-end gap-2">
          <IconButton icon="search" label="Search" className="lg:hidden" />
          <IconButton icon="bag" label="Order requests" badge={2} />
          <IconButton icon="bell" label="Notifications" badge={5} />
          <Link
            href="/Profile"
            title="Your profile"
            aria-label="Your profile"
            aria-current={active === "profile" ? "page" : undefined}
            className={`rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              active === "profile" ? "ring-2 ring-blue-600 ring-offset-2" : ""
            }`}
          >
            <Avatar name={profile.name} src={profile.avatar} className="h-10 w-10 text-sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

const MOBILE_TABS: { icon: IconName; label: string; href?: string }[] = [
  { icon: "home", label: "Home", href: "/Home" },
  { icon: "users", label: "Friends" },
  { icon: "compass", label: "Discover" },
  { icon: "bag", label: "Orders" },
  { icon: "user", label: "Profile", href: "/Profile" },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MOBILE_TABS.map((t, i) => {
        const className = `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
          i === 0 ? "text-blue-600" : "text-slate-500"
        }`;
        const content = (
          <>
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
          </>
        );
        return t.href ? (
          <Link
            key={t.label}
            href={t.href}
            aria-current={i === 0 ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <button key={t.label} type="button" className={className}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}
