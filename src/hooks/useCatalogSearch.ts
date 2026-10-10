// src/hooks/useCatalogSearch.ts
"use client";

import { useCallback, useRef, useState } from "react";
import {
  saveSearchHistory,
  searchCatalog,
  type CategorySearchItem,
  type ProductSearchItem,
} from "@/lib/catalog-search-api";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// The Discover product search: one search at a time, 10 products per page, "More" adds the next 10 below.
// `query` is the text of the search on screen, or null when no search is active (Discover then shows the posts).
// `search(text)` starts a new search; `clear()` ends it.
export function useCatalogSearch() {
  const [query, setQuery] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSearchItem[]>([]);
  const [categories, setCategories] = useState<CategorySearchItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false); // the first page of a search is on its way
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where the next page starts: the nextSkip the server sent with the last page (a ref: it never changes what is drawn)
  const skipRef = useRef(0);
  // Counts every search (and every clear). An answer that arrives after a newer search has started is thrown away,
  // so a slow answer for "ip" can never replace the answer for "iphone".
  const runRef = useRef(0);

  const search = useCallback(async (text: string) => {
    const term = text.trim();
    const run = ++runRef.current;
    setQuery(term);
    setSearching(true);
    setLoadingMore(false); // a "More" that was still loading belongs to the old search
    setError(null);
    try {
      const page = await searchCatalog(term, 0);
      if (run !== runRef.current) return;
      setProducts(page.products);
      setCategories(page.categories);
      setHasMore(page.hasMore);
      skipRef.current = page.nextSkip;
      // Only a search that found something is remembered, so the suggestions never offer an empty search.
      // If saving fails nothing is lost, so the error is ignored.
      if (page.products.length > 0 || page.categories.length > 0) {
        saveSearchHistory(term).catch(() => {});
      }
    } catch (err) {
      if (run !== runRef.current) return;
      setProducts([]);
      setCategories([]);
      setHasMore(false);
      setError(errorMessage(err));
    } finally {
      if (run === runRef.current) setSearching(false);
    }
  }, []);

  // The "More" button: the next 10 products. A product that is already on screen is not added twice.
  const loadMore = useCallback(async () => {
    if (query === null || searching || loadingMore || !hasMore) return;
    const run = runRef.current;

    setError(null);
    setLoadingMore(true);
    try {
      const page = await searchCatalog(query, skipRef.current);
      if (run !== runRef.current) return;
      setProducts((prev) => {
        const shown = new Set(prev.map((p) => p.product.id));
        return [...prev, ...page.products.filter((p) => !shown.has(p.product.id))];
      });
      setHasMore(page.hasMore);
      skipRef.current = page.nextSkip;
    } catch (err) {
      if (run === runRef.current) setError(errorMessage(err));
    } finally {
      if (run === runRef.current) setLoadingMore(false);
    }
  }, [query, searching, loadingMore, hasMore]);

  // End the search: Discover goes back to the posts
  const clear = useCallback(() => {
    runRef.current++; // an answer still on its way is thrown away
    skipRef.current = 0;
    setQuery(null);
    setProducts([]);
    setCategories([]);
    setHasMore(false);
    setSearching(false);
    setLoadingMore(false);
    setError(null);
  }, []);

  return { query, products, categories, hasMore, searching, loadingMore, error, search, loadMore, clear };
}
