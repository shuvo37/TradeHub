// src/app/Orders/page.tsx
"use client";

import { useProfile } from "@/hooks/useProfile";
import { useReceivedOrders } from "@/hooks/useReceivedOrders";
import OrdersUI from "@/components/OrdersUI";
import { HomeTopBar, MobileTabBar } from "@/app/Home/HomeTopBar";

// The orders other people placed on my products (I am the seller). Opened by the bag icon in the top bar.
export default function OrdersPage() {
  const { profile: me, error: profileError } = useProfile(); // the top bar shows my avatar
  const orders = useReceivedOrders();

  if (!me) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 text-sm">
        {profileError && <p className="text-red-600">{profileError}</p>}
      </div>
    );
  }

  // This page already knows how many orders are pending, so the bars use that number instead of loading their own
  const pending = orders.counts?.pending ?? 0;

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900">
      <HomeTopBar profile={me} active="orders" orderCount={pending} />

      <main className="mx-auto max-w-2xl px-3 pb-24 pt-6 sm:px-4 md:pb-8">
        <OrdersUI orders={orders} />
      </main>

      <MobileTabBar active="orders" orderCount={pending} />
    </div>
  );
}
