// src/components/Composer.tsx
"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { UserProfile, Category, Product } from "@/types/profile";
import { uploadImage } from "@/lib/api";
import type { NewPost } from "@/lib/posts-api";

interface Props {
  profile: UserProfile;
  categories: Category[];
  onPublish: (post: NewPost) => Promise<void>;
}

export default function Composer({ profile, categories, onPublish }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [attachedProduct, setAttachedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category picker state
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Product picker state
  const [productSearch, setProductSearch] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const allProducts = useMemo(
    () =>
      categories.flatMap(cat =>
        cat.products.map(p => ({ product: p, categoryId: cat.id, categoryName: cat.name }))
      ),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(cat => cat.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const scopedProducts = useMemo(() => {
    return selectedCategoryId
      ? allProducts.filter(p => p.categoryId === selectedCategoryId)
      : allProducts;
  }, [allProducts, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return scopedProducts;
    return scopedProducts.filter(({ product }) => product.name.toLowerCase().includes(q));
  }, [scopedProducts, productSearch]);

  const canPublish =
    (text.trim().length > 0 || !!image || !!attachedProduct) && !imageUploading && !publishing;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showCategoryDropdown]);

  // The photo is uploaded right away; `image` holds the returned URL, which is all the post needs.
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the user pick the same file again after an error
    if (!file) return;

    setError(null);
    setImageUploading(true);
    try {
      setImage(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryDropdown(false);
    setCategorySearch("");
  };

  const handleClearCategory = () => {
    setSelectedCategoryId(null);
    setCategorySearch("");
  };

  const resetPickerState = () => {
    setCategorySearch("");
    setProductSearch("");
    setSelectedCategoryId(null);
    setShowCategoryDropdown(false);
  };

  const handlePublish = async () => {
    if (!canPublish) return;

    setError(null);
    setPublishing(true);
    try {
      await onPublish({
        text: text.trim(),
        image,
        productId: attachedProduct?.id, // the post points at the real product
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return; // keep the draft so nothing is lost
    } finally {
      setPublishing(false);
    }

    setText("");
    setImage(undefined);
    setAttachedProduct(null);
    setIsExpanded(false);
    setShowProductPicker(false);
    resetPickerState();
  };

  const toggleProductPicker = () => {
    if (showProductPicker) resetPickerState();
    setShowProductPicker(!showProductPicker);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredCategories.length > 0) {
      e.preventDefault();
      handleSelectCategory(filteredCategories[0].id);
    }
    if (e.key === "Escape") setShowCategoryDropdown(false);
  };

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      e.preventDefault();
      setAttachedProduct(filteredProducts[0].product);
      setShowProductPicker(false);
      resetPickerState();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-500 font-bold text-sm sm:text-base">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={`What's on your mind, ${profile.name.split(" ")[0]}?`}
            rows={isExpanded ? 3 : 1}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 sm:px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />

          {image && (
            <div className="relative w-full max-h-64 rounded-xl overflow-hidden border border-gray-200">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setImage(undefined)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          {attachedProduct && (
            <div className="relative flex items-center gap-2 sm:gap-3 bg-blue-50 border border-blue-100 rounded-xl p-2 sm:p-3">
              {attachedProduct.image && (
                <img
                  src={attachedProduct.image}
                  alt={attachedProduct.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {attachedProduct.name}
                </p>
                <p className="text-[11px] text-blue-600 font-mono">{attachedProduct.price}</p>
              </div>
              <button
                onClick={() => setAttachedProduct(null)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2"
                aria-label="Remove product"
              >
                ✕
              </button>
            </div>
          )}

          {imageUploading && <p className="text-xs text-gray-500">Uploading image...</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
            <div className="flex gap-1 min-w-0">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Photo</span>
              </button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <button
                onClick={toggleProductPicker}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  showProductPicker
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="hidden sm:inline">Attach Product</span>
                <span className="sm:hidden">Attach</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className={`px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                canPublish
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {publishing ? "Posting..." : "Post"}
            </button>
          </div>

          {/* Product Picker */}
          {showProductPicker && (
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="p-2 border-b border-gray-100" ref={categoryDropdownRef}>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                  1. Filter by Category (optional)
                </label>

                <div className="relative">
                  {selectedCategory ? (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <svg
                        className="w-3.5 h-3.5 text-blue-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span className="text-xs font-medium text-blue-800 flex-1 truncate">
                        {selectedCategory.name}
                      </span>
                      <span className="text-[10px] text-blue-500 shrink-0">
                        ({selectedCategory.products.length})
                      </span>
                      <button
                        onClick={handleClearCategory}
                        className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-[10px] flex items-center justify-center hover:bg-blue-300 shrink-0"
                        aria-label="Clear category"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder="Search categories..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  )}

                  {showCategoryDropdown && !selectedCategory && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto z-30">
                      {filteredCategories.length === 0 ? (
                        <p className="text-xs text-gray-400 italic p-3 text-center">
                          No categories found
                        </p>
                      ) : (
                        filteredCategories.map((cat, index) => (
                          <button
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                              index === 0 && categorySearch.trim()
                                ? "bg-blue-50/60"
                                : "hover:bg-blue-50"
                            }`}
                          >
                            <span className="text-xs font-medium text-gray-800 truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] shrink-0 ml-2">
                              {index === 0 && categorySearch.trim() ? (
                                <span className="text-blue-600 font-semibold">↵ Enter</span>
                              ) : (
                                <span className="text-gray-400">{cat.products.length} items</span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 border-b border-gray-100">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                  2. Search Product
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={handleProductKeyDown}
                    placeholder={
                      selectedCategory
                        ? `Search in ${selectedCategory.name}...`
                        : "Search all products..."
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center hover:bg-gray-300"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-gray-400 italic">
                      {productSearch
                        ? `No products match "${productSearch}"`
                        : selectedCategory
                        ? `No products in "${selectedCategory.name}"`
                        : "No products in your store"}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map(({ product, categoryName }, index) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setAttachedProduct(product);
                        setShowProductPicker(false);
                        resetPickerState();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                        index === 0 && productSearch.trim()
                          ? "bg-blue-50/60"
                          : "hover:bg-blue-50"
                      }`}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-9 h-9 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {categoryName} • {product.price}
                        </p>
                      </div>
                      <span className="text-[10px] shrink-0">
                        {index === 0 && productSearch.trim() ? (
                          <span className="text-blue-600 font-semibold">↵ Enter</span>
                        ) : (
                          <span className="text-blue-600 font-semibold">Attach</span>
                        )}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {filteredProducts.length > 0 && (
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] text-gray-400 text-center">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "result" : "results"}
                    {selectedCategory && ` in "${selectedCategory.name}"`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}