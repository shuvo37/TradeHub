// src/components/TradeHubApp.tsx
"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePosts } from "../hooks/usePosts";
import OrderFormModal, { OrderFormData } from "@/components/modals/OrderFormModal";
import { generateUniqueName } from "@/lib/generateUniqueName";
import {
  fetchCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/store-api";
import {
  UserProfile,
  defaultProfile,
  Category,
  Product,
  Post,
} from "@/types/profile";
import Sidebar from "@/components/Sidebar";
import Feed from "@/components/Feed";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ViewProductModal from "@/components/modals/ViewProductModal";
import DeleteCategoryModal from "@/components/modals/DeleteCategoryModal";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Same order the backend uses (by name), so a new/renamed category lands where a reload would put it.
const byName = (a: Category, b: Category) => a.name.localeCompare(b.name);

export default function TradeHubApp() {
  // --- Global State ---
  const [profile, setProfile] = useLocalStorage<UserProfile>("tradehub_profile", defaultProfile);
  const [categories, setCategories] = useState<Category[]>([]); // loaded from the API
  const [storeError, setStoreError] = useState<string | null>(null);
  // My posts, loaded from the API (the hook owns load / create / delete)
  const { posts, myId, error: postsError, createPost, deletePost, toggleLike } = usePosts();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- Modal State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [currentCategoryIdForProduct, setCurrentCategoryIdForProduct] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);

  // --- Load My Store (categories + products) from the backend ---
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => setStoreError(errorMessage(err)));
  }, []);

  // --- Migration + first-time setup for profile ---
  // Backfills new fields on old profiles, renames bio→necessaryInfo,
  // and generates a uniqueName the first time the profile is loaded.
  useEffect(() => {
    const raw = profile as unknown as Record<string, unknown>;

    const missingUniqueName = !profile.uniqueName;
    const missingEmail = raw.email === undefined;
    const missingPhone = raw.phone === undefined;
    const hasOldBio = raw.bio !== undefined && profile.necessaryInfo === undefined;

    if (missingUniqueName || missingEmail || missingPhone || hasOldBio) {
      const migrated: UserProfile = {
        ...profile,
        uniqueName: profile.uniqueName || generateUniqueName(profile.name),
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        necessaryInfo:
          profile.necessaryInfo ?? (typeof raw.bio === "string" ? raw.bio : ""),
      };
      // strip legacy `bio` key so it doesn't linger
      delete (migrated as unknown as Record<string, unknown>).bio;
      setProfile(migrated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  // =========================================
  // PRODUCT HANDLERS  (API first; they throw on failure and ProductFormModal shows the message)
  // =========================================
  const handleOpenProductModal = (product: Product | null, categoryId: string) => {
    setEditingProduct(product);
    setTempProduct(product || {});
    setCurrentCategoryIdForProduct(categoryId);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setTempProduct({});
    setCurrentCategoryIdForProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!currentCategoryIdForProduct) return;
    const categoryId = currentCategoryIdForProduct;

    const saved = editingProduct
      ? await updateProduct(editingProduct.id, tempProduct)
      : await createProduct(categoryId, tempProduct);

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          products: editingProduct
            ? cat.products.map((p) => (p.id === saved.id ? saved : p))
            : [...cat.products, saved],
        };
      })
    );

    closeProductModal();
  };

  const handleDeleteProduct = async () => {
    if (!currentCategoryIdForProduct || !editingProduct) return;
    const categoryId = currentCategoryIdForProduct;
    const productId = editingProduct.id;

    await deleteProduct(productId);

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, products: cat.products.filter((p) => p.id !== productId) }
          : cat
      )
    );

    closeProductModal();
  };

  const handleOpenProductFromView = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenProductModal(product, activeCategoryId!);
  };


  const handleOrderProduct = (product: Product) => {
  setOrderingProduct(product);
};

const handleSubmitOrder = (data: OrderFormData) => {
  // For now: do nothing — just close (seller end not built yet)
  console.log("Order submitted:", data);
  setOrderingProduct(null);
};

  // =========================================
  // CATEGORY HANDLERS  (API first, state only after the server says OK)
  // =========================================
  // Returns true on success so the Sidebar knows whether to close its input.
  const handleAddCategory = async (name: string): Promise<boolean> => {
    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created].sort(byName));
      setActiveCategoryId(created.id);
      setStoreError(null);
      return true;
    } catch (err) {
      setStoreError(errorMessage(err));
      return false;
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await renameCategory(categoryId, trimmed);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, name: trimmed } : cat)).sort(byName)
      );
      setStoreError(null);
    } catch (err) {
      setStoreError(errorMessage(err));
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    const category = deletingCategory;
    setDeletingCategory(null); // close the modal first so a double click can't send two deletes
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
      if (activeCategoryId === category.id) setActiveCategoryId(null);
      setStoreError(null);
    } catch (err) {
      setStoreError(errorMessage(err));
    }
  };

  // =========================================
  // POST HANDLERS  (load / create / delete live in usePosts)
  // =========================================
  // A post carries its real product, so ordering from a post is ordering that product.
  const handleOrderFromPost = (post: Post) => {
    if (post.product) setOrderingProduct(post.product);
  };

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="flex h-[100dvh] w-full bg-gray-50 text-gray-900 overflow-hidden">
      {/* Mobile header (hidden on md+) */}
      <MobileHeader
        onMenuClick={() => setIsDrawerOpen(true)}
        userName={profile.name}
        userAvatar={profile.avatar}
      />

      {/* Sidebar — drawer on mobile, static on tablet/desktop */}
      <Sidebar
        profile={profile}
        setProfile={setProfile}
        categories={categories}
        storeError={storeError}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        openProductModal={handleOpenProductModal}
        setViewingProduct={setViewingProduct}
        onAddCategory={handleAddCategory}
        onRequestDeleteCategory={setDeletingCategory}
        onRenameCategory={handleRenameCategory}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
      />

      {/* Main feed area */}
        <Feed
        profile={profile}
        categories={categories}
        posts={posts}
        currentUserId={myId}
        error={postsError}
        onCreatePost={createPost}
        onDeletePost={deletePost}
        onToggleLike={toggleLike}
        onOrderPost={handleOrderFromPost}
        />

      {/* Mobile bottom nav (hidden on md+) */}
      <BottomNav
        onMenuClick={() => setIsDrawerOpen(true)}
        onStoreClick={() => setIsDrawerOpen(true)}
        onProfileClick={() => setIsDrawerOpen(true)}
      />

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        editingProduct={editingProduct}
        tempProduct={tempProduct}
        setTempProduct={setTempProduct}
      />

        <ViewProductModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={handleOpenProductFromView}
        onOrder={handleOrderProduct}
        />

      <DeleteCategoryModal
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDeleteCategory}
      />

        <OrderFormModal
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
        onSubmit={handleSubmitOrder}
        />

        <OrderFormModal
        key={orderingProduct?.id ?? "no-order"}
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
        onSubmit={handleSubmitOrder}
        />
    </div>
  );
}
