// src/components/CategorySearchCard.tsx
import Link from "next/link";
import type { CategorySearchItem } from "@/lib/catalog-search-api";
import { Avatar } from "@/app/Home/ui";

// One category in the search results. The whole card is a link: it opens the seller's store with this category open.
export default function CategorySearchCard({ category }: { category: CategorySearchItem }) {
  return (
    <li>
      <Link
        href={`/User/${category.sellerId}?category=${category.id}`}
        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Avatar
          name={category.sellerName}
          src={category.sellerAvatar || undefined}
          className="h-11 w-11 text-base"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{category.name}</p>
          <p className="truncate text-xs text-slate-500">by {category.sellerName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {category.productCount} {category.productCount === 1 ? "product" : "products"}
        </span>
      </Link>
    </li>
  );
}
