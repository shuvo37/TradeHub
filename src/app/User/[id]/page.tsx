// src/app/User/[id]/page.tsx
"use client";

import { use } from "react";
import TradeHubApp from "@/components/TradeHubApp";

// /User/<id>: someone else's profile, read-only. It is the same page as /Profile,
// just told whose profile to show. /User/<id>?category=<categoryId> opens that category of the store
// (the links in the Discover search use it). The key makes React start fresh when the id or the category changes.
export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { id } = use(params);
  const { category } = use(searchParams);
  const categoryId = typeof category === "string" && category !== "" ? category : undefined;
  return <TradeHubApp key={`${id}:${categoryId ?? ""}`} userId={id} initialCategoryId={categoryId} />;
}
