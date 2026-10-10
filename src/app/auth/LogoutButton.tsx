"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth-store";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await authApi.logout(); // revokes the refresh token in the DB and clears the cookie
    } finally {
      clearAuth();
      router.push("/auth/Login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`rounded-lg border border-[#E3DCC8] px-4 py-2 text-sm font-medium text-[#16231F] transition hover:bg-[#F1EADA] ${className}`}
    >
      Log out
    </button>
  );
}