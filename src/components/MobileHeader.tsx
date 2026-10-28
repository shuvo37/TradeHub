// src/components/MobileHeader.tsx
"use client";

import AccountMenu from "./AccountMenu";
import AiAssistant from "./AiAssistant";

interface Props {
  onMenuClick: () => void;
  userName: string;
  userAvatar: string;
}

export default function MobileHeader({ onMenuClick, userName, userAvatar }: Props) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Hamburger */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand */}
        <h1 className="text-lg font-bold tracking-tight text-blue-600">TradeHub</h1>

        <div className="flex items-center gap-2">
          <AiAssistant />
          {/* Three-dot menu: Profile, My friends, Contact email, Log out */}
          <AccountMenu userName={userName} userAvatar={userAvatar} />
        </div>
      </div>
    </header>
  );
}