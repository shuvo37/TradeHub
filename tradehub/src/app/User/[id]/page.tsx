// src/app/User/[id]/page.tsx
"use client";

import { use } from "react";
import TradeHubApp from "@/components/TradeHubApp";

// /User/<id>: someone else's profile, read-only. It is the same page as /Profile,
// just told whose profile to show. The key makes React start fresh when the id changes.
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TradeHubApp key={id} userId={id} />;
}
