// src/lib/catalog-search-api.ts
// Searching products and categories (the Discover search box). People search is in search-api.ts.
import { apiRequest, jsonInit } from "@/lib/api";
import { toProduct, type ProductDto } from "@/lib/store-api";
import type { Product } from "@/types/profile";

// Shapes exactly as the backend sends them (camelCase of ProductSearchItemDto / CategorySearchItemDto / SearchResultDto).
interface ProductSearchItemDto {
  product: ProductDto;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string; // "" when the seller has no avatar
}

// One product in the results: the product (same shape as in My Store) plus the category it sits in and who sells it.
export interface ProductSearchItem {
  product: Product;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
}

// One category in the results: a seller's category whose name matches.
export interface CategorySearchItem {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  productCount: number;
}

// One page of results. Products come best first, 10 per page, from a ranked list of at most 50, so the page is found by
// counting: `nextSkip` is how many products the client has so far. Send it back as `skip` exactly as it came.
// `categories` (up to 5) are only in the first page (skip = 0); the next pages send an empty list.
export interface CatalogSearchPage {
  products: ProductSearchItem[];
  categories: CategorySearchItem[];
  hasMore: boolean;
  nextSkip: number;
}

// GET /api/search?q=...&skip=...
// Products and categories of OTHER sellers that match the text, best first. Text shorter than 2 letters answers 400
// ("Search text must be at least 2 letters." - apiRequest turns that message into an Error).
export async function searchCatalog(q: string, skip = 0): Promise<CatalogSearchPage> {
  const res = await apiRequest(`/api/search?q=${encodeURIComponent(q)}&skip=${skip}`);
  const page = (await res.json()) as {
    products: ProductSearchItemDto[];
    categories: CategorySearchItem[];
    hasMore: boolean;
    nextSkip: number;
  };
  return {
    products: page.products.map((p) => ({ ...p, product: toProduct(p.product) })),
    categories: page.categories,
    hasMore: page.hasMore,
    nextSkip: page.nextSkip,
  };
}

// GET /api/search/suggestions?q=...
// The lines under the search box: up to 8 plain texts. With q empty they are my latest searches; otherwise
// texts that start with q (my own searches first, then other people's, then product and category names).
export async function fetchSearchSuggestions(q: string): Promise<string[]> {
  const res = await apiRequest(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
  return (await res.json()) as string[];
}

// POST /api/search/history: 204 No Content. Remembers what I searched (call it once per search, not on every key).
export async function saveSearchHistory(term: string): Promise<void> {
  await apiRequest("/api/search/history", jsonInit("POST", { term }));
}
