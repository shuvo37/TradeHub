// src/components/MobileHeader.tsx
"use client";

import { useState } from "react";
import { useLogout } from "../hooks/useLogout";

interface Props {
  onMenuClick: () => void;
  userName: string;
  userAvatar: string;
}

export default function MobileHeader({ onMenuClick, userName, userAvatar }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const logout = useLogout();

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

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            onBlur={() => setTimeout(() => setShowMenu(false), 150)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="More options"
          >
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-500 text-xs font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-800 truncate">{userName}</span>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}