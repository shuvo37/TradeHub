// src/components/AccountMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLogout } from "@/hooks/useLogout";
import { Avatar, Icon, type IconName } from "@/app/Home/ui";
import ContactEmailModal from "./ContactEmailModal";

const itemClass =
  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-100";

function MenuIcon({ name }: { name: IconName }) {
  return <Icon name={name} className="h-[18px] w-[18px] shrink-0 text-slate-500" />;
}

// The three-dot button in the top bar and its menu: Profile, My friends, Contact email, Log out.
// Closes on a press outside, Escape, or after choosing an item.
// userName / userAvatar are optional: when given, the menu starts with a row showing who I am.
export default function AccountMenu({ userName, userAvatar }: { userName?: string; userAvatar?: string }) {
  const [open, setOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Menu"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          open ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <Icon name="dots" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {userName && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Avatar name={userName} src={userAvatar} className="h-8 w-8 text-xs" />
              <span className="truncate text-xs font-semibold text-slate-800">{userName}</span>
            </div>
          )}

          <Link href="/Profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <MenuIcon name="user" />
            Profile
          </Link>
          <Link href="/FriendList" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <MenuIcon name="users" />
            My friends
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setEmailOpen(true);
            }}
            className={itemClass}
          >
            <MenuIcon name="mail" />
            Contact email
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`${itemClass} text-red-600 hover:bg-red-50`}
          >
            <Icon name="logout" className="h-[18px] w-[18px] shrink-0" />
            Log out
          </button>
        </div>
      )}

      {emailOpen && <ContactEmailModal onClose={() => setEmailOpen(false)} />}
    </div>
  );
}
