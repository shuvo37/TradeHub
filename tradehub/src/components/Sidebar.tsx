// src/components/Sidebar.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { UserProfile, Category, Product } from "@/types/profile";
import { uploadImage } from "@/lib/api";

interface Props {
  profile: UserProfile;
  onSaveProfile: (p: UserProfile) => Promise<void>; // throws with the backend's message on failure
  categories: Category[];
  storeError: string | null;
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  openProductModal: (product: Product | null, categoryId: string) => void;
  setViewingProduct: (p: Product | null) => void;
  onAddCategory: (name: string) => Promise<boolean>;
  onRequestDeleteCategory: (category: Category) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export default function Sidebar({
  profile,
  onSaveProfile,
  categories,
  storeError,
  activeCategoryId,
  setActiveCategoryId,
  openProductModal,
  setViewingProduct,
  onAddCategory,
  onRequestDeleteCategory,
  onRenameCategory,
  isDrawerOpen,
  onCloseDrawer,
}: Props) {
  // --- Profile State ---
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Category State ---
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- Rename state ---
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // --- Category search ---
  const [categorySearch, setCategorySearch] = useState("");

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(cat => cat.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Show search box whenever there is at least 1 category
  const showSearch = categories.length > 0;

  const emailValid =
    tempProfile.email.trim() === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempProfile.email.trim());

  // Sync temp profile when profile changes externally
  useEffect(() => {
    if (!isEditing) setTempProfile(profile);
  }, [profile, isEditing]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [openMenuId]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) onCloseDrawer();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isDrawerOpen, onCloseDrawer]);

  // --- Profile Handlers ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the user pick the same file again after an error
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadImage(file);
      // functional update: tempProfile may have changed while the upload ran
      setTempProfile(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // API first: close the form only after the server says OK; on an error keep the draft open.
  const handleSaveProfile = async () => {
    if (profileSaving) return;
    setProfileError(null);
    setProfileSaving(true);
    try {
      await onSaveProfile(tempProfile);
      setIsEditing(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setTempProfile(profile);
    setAvatarError(null);
    setProfileError(null);
    setIsEditing(false);
  };

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    const ok = await onAddCategory(name);
    if (!ok) return; // keep the input open so the user can fix the name

    setNewCategoryName("");
    setIsAddingCategory(false);
    setCategorySearch(""); // Clear search so new category is visible
  };

  const toggleCategory = (id: string) => {
    if (renamingCategoryId === id) return;
    setActiveCategoryId(activeCategoryId === id ? null : id);
  };

  const handleMenuToggle = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === catId ? null : catId);
  };

  const handleDeleteClick = (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onRequestDeleteCategory(cat);
  };

  const handleRenameClick = (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingCategoryId(cat.id);
    setRenameValue(cat.name);
  };

  const commitRename = () => {
    if (renamingCategoryId) onRenameCategory(renamingCategoryId, renameValue);
    setRenamingCategoryId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingCategoryId(null);
    setRenameValue("");
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  const renderAvailabilityDot = (quantity: Product["quantity"]) => {
    if (quantity === "Available") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Available
        </span>
      );
    }
    if (quantity === "Unavailable") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Out
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Qty: {quantity}
      </span>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 bottom-0 z-50 md:z-10
          w-[85%] max-w-sm md:w-72 lg:w-80 xl:w-96
          bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${isDrawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 pt-4 md:pt-6 safe-top">
          {/* Mobile-only close button */}
          <div className="md:hidden flex justify-end -mb-2">
            <button
              onClick={onCloseDrawer}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* --- PROFILE SECTION --- */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Profile</h2>
            <button
              onClick={() => {
                setProfileError(null);
                setIsEditing(!isEditing);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-blue-100 to-purple-100 border-4 border-white shadow-lg cursor-pointer group"
              onClick={() => isEditing && !avatarUploading && fileInputRef.current?.click()}
            >
              {tempProfile.avatar ? (
                <img
                  src={tempProfile.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-blue-400 font-bold">
                  {tempProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && !avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold">Upload</span>
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">Uploading...</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            {avatarError && (
              <p className="text-xs text-red-600 text-center">{avatarError}</p>
            )}

            {isEditing ? (
              <input
                type="text"
                value={tempProfile.name}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, name: e.target.value })
                }
                className="w-full text-center font-semibold text-lg bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                {profile.uniqueName && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {profile.uniqueName}
                  </p>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            /* ---- EDIT FORM ---- */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={tempProfile.location}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, location: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Number
                </label>
                <input
                  type="text"
                  value={tempProfile.paymentNumber}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, paymentNumber: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={tempProfile.email}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, email: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  value={tempProfile.phone}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, phone: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Necessary Information
                </label>
                <textarea
                  value={tempProfile.necessaryInfo}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, necessaryInfo: e.target.value })
                  }
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Guide buyers: how to pay, contact, what to expect..."
                />
              </div>
            </div>
          ) : (
            /* ---- READ-ONLY VIEW (hides empty sections) ---- */
            <div className="flex flex-col gap-4">
              {profile.location.trim() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    📍 Location
                  </label>
                  <p className="text-sm text-gray-800">{profile.location}</p>
                </div>
              )}

              {profile.paymentNumber.trim() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    💳 Payment Number
                  </label>
                  <p className="text-sm text-gray-800 font-mono">
                    {profile.paymentNumber}
                  </p>
                </div>
              )}

              {profile.email.trim() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    📧 Email
                  </label>
                  <p className="text-sm text-gray-800">{profile.email}</p>
                </div>
              )}

              {profile.phone.trim() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    📞 Phone
                  </label>
                  <p className="text-sm text-gray-800 font-mono">{profile.phone}</p>
                </div>
              )}

              {profile.necessaryInfo.trim() && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    📝 Necessary Information
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profile.necessaryInfo}
                  </p>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              {!emailValid && (
                <p className="text-xs text-red-600 px-1">
                  Please enter a valid email address.
                </p>
              )}
              {profileError && (
                <p className="text-xs text-red-600 px-1">{profileError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelProfile}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={!emailValid || avatarUploading || profileSaving}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
                    emailValid && !avatarUploading && !profileSaving
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {avatarUploading ? "Uploading..." : profileSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* --- CATEGORIES & PRODUCTS SECTION --- */}
          <div className="pt-6 border-t border-gray-200 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-tight">My Store</h2>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                title="Add Category"
              >
                +
              </button>
            </div>

            {storeError && <p className="text-xs text-red-600">{storeError}</p>}

            {/* Category Search */}
            {showSearch && (
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
                  onChange={(e) => setCategorySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredCategories.length > 0) {
                      e.preventDefault();
                      toggleCategory(filteredCategories[0].id);
                    }
                    if (e.key === "Escape") {
                      setCategorySearch("");
                    }
                  }}
                  placeholder={`Search ${categories.length} categories...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center hover:bg-gray-300"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {isAddingCategory && (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Category name..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="text-sm text-blue-600 font-medium px-2"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingCategory(false)}
                  className="text-sm text-gray-400 px-2"
                >
                  X
                </button>
              </div>
            )}

            {/* Category List (filtered) */}
            <div className="flex flex-col gap-1">
              {filteredCategories.map((cat, index) => (
                <div key={cat.id} className="relative group/cat">
                  {renamingCategoryId === cat.id ? (
                    <div className="flex items-center gap-1 px-1">
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        onBlur={commitRename}
                        className="flex-1 px-2 py-1.5 text-sm bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        onDoubleClick={() => setActiveCategoryId(null)}
                        className={`w-full text-left px-3 py-2 pr-10 rounded-lg text-sm font-medium transition-colors ${
                          activeCategoryId === cat.id
                            ? "bg-blue-50 text-blue-700"
                            : index === 0 && categorySearch.trim()
                              ? "bg-blue-50/60 text-gray-700"
                              : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {cat.name}{" "}
                        {index === 0 && categorySearch.trim() ? (
                          <span className="text-[10px] text-blue-600 font-semibold ml-1">
                            ↵ Enter
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 ml-1">
                            ({cat.products.length})
                          </span>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleMenuToggle(e, cat.id)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all ${
                          openMenuId === cat.id
                            ? "opacity-100 bg-gray-200"
                            : "opacity-0 group-hover/cat:opacity-100"
                        }`}
                        title="More options"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {openMenuId === cat.id && (
                        <div
                          className="absolute right-1 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[130px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleRenameClick(e, cat)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Rename
                          </button>
                          <div className="h-px bg-gray-100 mx-2 my-1" />
                          <button
                            onClick={(e) => handleDeleteClick(e, cat)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Empty states */}
              {categories.length === 0 && !isAddingCategory && (
                <p className="text-xs text-gray-400 italic text-center py-2">
                  No categories yet. Click + to add.
                </p>
              )}
              {categories.length > 0 &&
                filteredCategories.length === 0 &&
                categorySearch && (
                  <p className="text-xs text-gray-400 italic text-center py-3">
                    No categories match "{categorySearch}"
                  </p>
                )}
            </div>

            {/* Product Gallery */}
            {activeCategory && (
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {activeCategory.name} Products
                  </h3>
                  <button
                    onClick={() => openProductModal(null, activeCategory.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {activeCategory.products.map(product => (
                    <div
                      key={product.id}
                      onClick={() => setViewingProduct(product)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer border border-gray-200"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
                          View
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {product.name}
                        </p>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-white/90 text-[10px] font-mono">
                            {product.price}
                          </p>
                          {renderAvailabilityDot(product.quantity)}
                        </div>
                        {product.discount && product.discount > 0 ? (
                          <span className="inline-flex items-center text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded mt-0.5">
                            {product.discount}% off
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {activeCategory.products.length === 0 && (
                    <p className="col-span-2 text-xs text-gray-400 italic text-center py-4">
                      No products in this category.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}