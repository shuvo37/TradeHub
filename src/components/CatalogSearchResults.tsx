// src/components/CatalogSearchResults.tsx
import type { CategorySearchItem, ProductSearchItem } from "@/lib/catalog-search-api";
import CategorySearchCard from "@/components/CategorySearchCard";
import ProductSearchCard from "@/components/ProductSearchCard";

interface Props {
  query: string;                    // the text that was searched
  products: ProductSearchItem[];
  categories: CategorySearchItem[]; // only the first page has them
  hasMore: boolean;
  searching: boolean;               // the first page is on its way
  loadingMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onOpenProduct: (item: ProductSearchItem) => void;
}

// What the right side of Discover shows while a product search is active:
// the matching categories first, then the matching products, then a "More" button.
export default function CatalogSearchResults({
  query,
  products,
  categories,
  hasMore,
  searching,
  loadingMore,
  error,
  onLoadMore,
  onOpenProduct,
}: Props) {
  if (searching) return <p className="px-1 text-sm text-slate-500">Searching...</p>;

  const nothingFound = products.length === 0 && categories.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="px-1 text-sm text-red-600">{error}</p>}

      {nothingFound && !error && (
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Nothing found</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            No products or categories match &ldquo;{query}&rdquo;. Try another word.
          </p>
        </div>
      )}

      {categories.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-slate-900">Categories</h2>
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <CategorySearchCard key={category.id} category={category} />
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-slate-900">Products</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {products.map((item) => (
              <ProductSearchCard key={item.product.id} item={item} onOpen={onOpenProduct} />
            ))}
          </ul>
        </section>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mx-auto rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {loadingMore ? "Loading..." : "More"}
        </button>
      )}
    </div>
  );
}
