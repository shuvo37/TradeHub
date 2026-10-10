// src/components/ProductSearchCard.tsx
import Link from "next/link";
import type { ProductSearchItem } from "@/lib/catalog-search-api";
import { Avatar } from "@/app/Home/ui";

// Same rule as the backend: a counted quantity of 0, or "Unavailable" when no quantity is kept, means out of stock
const isOutOfStock = (item: ProductSearchItem) =>
  item.product.quantity === "Unavailable" || item.product.quantity === 0;

// One product in the search results: tap the card to open the product, tap the seller's name to open their profile.
// (The seller link sits outside the card button, because a link inside a button is not allowed.)
export default function ProductSearchCard({
  item,
  onOpen,
}: {
  item: ProductSearchItem;
  onOpen: (item: ProductSearchItem) => void;
}) {
  const { product } = item;
  const discount = product.discount ?? 0;
  const out = isOutOfStock(item);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="block w-full text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="h-36 w-full bg-slate-100">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {discount > 0 ? (
              <>
                <span className="text-sm text-slate-400 line-through">{product.price}</span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  {discount}% off
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-blue-600">{product.price}</span>
            )}
            {out && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                Out of stock
              </span>
            )}
          </div>

          <p className="truncate text-xs text-slate-500">in {item.categoryName}</p>
        </div>
      </button>

      <Link
        href={`/User/${item.sellerId}`}
        className="mt-auto flex items-center gap-2 border-t border-slate-100 px-3 py-2 hover:bg-slate-50"
      >
        <Avatar name={item.sellerName} src={item.sellerAvatar || undefined} className="h-6 w-6 text-[11px]" />
        <span className="truncate text-xs font-medium text-slate-700">{item.sellerName}</span>
      </Link>
    </li>
  );
}

// The seller block shown inside the product popup (ViewProductModal's `extra` slot):
// who sells it, which category it is in, and a link to that seller's store with the category already open.
export function ProductSellerInfo({ item }: { item: ProductSearchItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <Link href={`/User/${item.sellerId}`} className="shrink-0">
        <Avatar name={item.sellerName} src={item.sellerAvatar || undefined} className="h-10 w-10 text-sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sold by</p>
        <Link
          href={`/User/${item.sellerId}`}
          className="block truncate text-sm font-semibold text-slate-900 hover:underline"
        >
          {item.sellerName}
        </Link>
        <p className="truncate text-xs text-slate-500">in {item.categoryName}</p>
      </div>
      <Link
        href={`/User/${item.sellerId}?category=${item.categoryId}`}
        className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
      >
        View store
      </Link>
    </div>
  );
}
