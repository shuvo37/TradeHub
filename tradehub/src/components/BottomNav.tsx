// src/components/BottomNav.tsx
"use client";

import Link from "next/link";

interface Props {
  onMenuClick: () => void;
  onStoreClick: () => void;
  onProfileClick: () => void;
}

export default function BottomNav({ onMenuClick, onStoreClick, onProfileClick }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {/* Home */}
        <Link
          href="/Home"
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-gray-500 active:bg-gray-50 transition-colors"
          aria-label="Home"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Store */}
        <button
          onClick={onStoreClick}
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-gray-500 active:bg-gray-50 transition-colors"
          aria-label="Store"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[10px] font-medium">Store</span>
        </button>

        {/* Profile */}
        <button
          onClick={onProfileClick}
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-blue-600 active:bg-gray-50 transition-colors"
          aria-label="Profile"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </button>

        {/* Menu */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-gray-500 active:bg-gray-50 transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}