"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, refreshSession } from "@/lib/auth-store";
import type { AuthResponse } from "@/app/auth/auth";
import LogoutButton from "@/app/auth/LogoutButton";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    // After login/register the user is already in memory.
    // After a page reload memory is empty, so restore the session from the refresh cookie.
    const existing = getUser();
    if (existing) {
      setUser(existing);
      return;
    }
    refreshSession().then((u) => (u ? setUser(u) : router.replace("/auth/Login")));
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F3B36] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E3DCC8] bg-[#FBF7EE] p-9 text-center">
        <h1 className="text-2xl font-semibold text-[#16231F]">Welcome, {user.name}!</h1>
        <p className="mt-4 text-sm text-[#4B5D57]">Your unique name (you sign in with this):</p>
        <p className="mt-1 rounded-lg bg-[#F1EADA] py-2 font-mono text-lg text-[#16231F]">
          {user.uniqueName}
        </p>
        <LogoutButton className="mt-7" />
      </div>
    </div>
  );
}