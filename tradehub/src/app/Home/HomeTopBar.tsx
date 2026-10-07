// src/components/home/HomeTopBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { UserProfile } from "@/types/profile";
import UserSearch from "@/components/UserSearch";
import NotificationBell from "../../components/NotificationBell";
import { useLogout } from "@/hooks/useLogout";
import { useRequestCount } from "@/hooks/useFriendRequests";
import { Avatar, Icon, IconName } from "./ui";

// href = the tab really navigates; tabs without one are still dummy
const TABS: { icon: IconName; label: string; href?: string }[] = [
  { icon: "home", label: "Home", href: "/Home" },
  { icon: "users", label: "Friends", href: "/Friends" },
  { icon: "compass", label: "Discover" },
  { icon: "store", label: "Store" },
];

// Red number on the Friends icon: how many new friend requests I have not looked at yet ("99+" when there are lots)
function RequestBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconButton({
  icon,
  label,
  badge,
  className = "",
  onClick,
}: {
  icon: IconName;
  label: string;
  badge?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
// `requestCount` is the number of new (not yet seen) friend requests. A page that already knows it (the Friends page
// passes 0) gives it; every other page leaves it out and the bar loads the number itself.
export function HomeTopBar({
  profile,
  active = "home",
  requestCount,
}: {
  profile: UserProfile;
  active?: "home" | "friends" | "profile" | null; // null: none of them (for example, while visiting someone else's profile)
  requestCount?: number;
}) {
  const loadedCount = useRequestCount(requestCount !== undefined);
  const waitingRequests = requestCount ?? loadedCount;
  // Below the lg width the search box doesn't fit in the bar, so the search icon opens it on its own row
  const [searchOpen, setSearchOpen] = useState(false);
  const logout = useLogout();

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
          <div className="ml-2 hidden lg:block">
            <UserSearch className="w-64" />
          </div>
        </div>

        {/* Center: main tabs (desktop) */}
        <nav className="hidden h-full md:flex" aria-label="Main">
          {TABS.map((t) => {
            const isActive =
              (t.label === "Home" && active === "home") ||
              (t.label === "Friends" && active === "friends");
            const className = `relative flex h-full w-16 items-center justify-center transition-colors lg:w-20 ${
              isActive
                ? "text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`;
            const content = (
              <>
                <Icon name={t.icon} className="h-6 w-6" />
                {t.label === "Friends" && (
                  <RequestBadge count={waitingRequests} className="left-1/2 top-2 ml-1" />
                )}
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
          <IconButton
            icon="search"
            label="Search"
            className="lg:hidden"
            onClick={() => setSearchOpen((open) => !open)}
          />
          <IconButton icon="bag" label="Order requests" badge={2} />
          <NotificationBell />
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
          <IconButton icon="logout" label="Log out" onClick={logout} />
        </div>
      </div>

      {/* Search bar for screens narrower than lg (opened by the search icon) */}
      {searchOpen && (
        <div className="border-t border-slate-200/70 px-3 py-2 sm:px-4 lg:hidden">
          <UserSearch className="w-full" autoFocus onPick={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}

const MOBILE_TABS: { icon: IconName; label: string; href?: string }[] = [
  { icon: "home", label: "Home", href: "/Home" },
  { icon: "users", label: "Friends", href: "/Friends" },
  { icon: "compass", label: "Discover" },
  { icon: "bag", label: "Orders" },
  { icon: "user", label: "Profile", href: "/Profile" },
];

// Which tab label belongs to each page
const MOBILE_ACTIVE_LABEL = { home: "Home", friends: "Friends", profile: "Profile" } as const;

export function MobileTabBar({
  active = "home",
  requestCount,
}: {
  active?: "home" | "friends" | "profile" | null;
  requestCount?: number; // same rule as in HomeTopBar
}) {
  const loadedCount = useRequestCount(requestCount !== undefined);
  const waitingRequests = requestCount ?? loadedCount;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MOBILE_TABS.map((t) => {
        const isActive = active !== null && t.label === MOBILE_ACTIVE_LABEL[active];
        const className = `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
          isActive ? "text-blue-600" : "text-slate-500"
        }`;
        const content = (
          <>
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
            {t.label === "Friends" && (
              <RequestBadge count={waitingRequests} className="left-1/2 top-1 ml-1" />
            )}
          </>
        );
        return t.href ? (
          <Link
            key={t.label}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
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
