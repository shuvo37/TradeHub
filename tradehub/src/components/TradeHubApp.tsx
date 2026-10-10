// src/components/TradeHubApp.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePosts } from "@/hooks/usePosts";
import OrderFormModal from "@/components/modals/OrderFormModal";
import {
  fetchCategories,
  fetchCategoriesByUser,
  createCategory,
  renameCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/store-api";
import { Category, Product, Post } from "@/types/profile";
import Sidebar from "@/components/Sidebar";
import Feed from "@/components/Feed";
import FriendButton from "@/components/FriendButton";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ViewProductModal from "@/components/modals/ViewProductModal";
import DeleteCategoryModal from "@/components/modals/DeleteCategoryModal";
import { HomeTopBar } from "@/app/Home/HomeTopBar";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

// Same order the backend uses (by name), so a new/renamed category lands where a reload would put it.
const byName = (a: Category, b: Category) => a.name.localeCompare(b.name);

// One page for both cases:
//   <TradeHubApp />               -> my own profile (/Profile): everything can be edited
//   <TradeHubApp userId="..." />  -> someone else's profile (/User/[id]): the same page, read-only
export default function TradeHubApp({ userId }: { userId?: string }) {
  const router = useRouter();
  const readOnly = userId !== undefined; // visiting someone else

  // --- Global State ---
  // `me` is the logged-in user (always loaded: the top bar shows my avatar, and my own page edits it).
  const { profile: me, error: meError, saveProfile } = useProfile();
  // `viewed` is the user whose page this is when visiting; it stays null on my own page.
  const { profile: viewed, error: viewedError } = useUserProfile(userId);
  // The profile this page shows
  const profile = readOnly ? viewed : me;
  const profileError = meError ?? viewedError;
  const [categories, setCategories] = useState<Category[]>([]); // loaded from the API
  const [storeError, setStoreError] = useState<string | null>(null);
  // My posts, loaded from the API (the hook owns load / create / edit / delete / like)
  const {
    posts,
    myId,
    error: postsError,
    createPost,
    editPost,
    revivePost,
    deletePost,
    toggleLike,
  } = usePosts(userId);

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

  // --- Load the store (categories + products) from the backend: mine, or the visited user's ---
  useEffect(() => {
    (userId ? fetchCategoriesByUser(userId) : fetchCategories())
      .then(setCategories)
      .catch((err) => setStoreError(errorMessage(err)));
  }, [userId]);

  // /User/<my own id> is just my own page, so send me to /Profile where I can edit
  useEffect(() => {
    if (userId && myId === userId) router.replace("/Profile");
  }, [userId, myId, router]);

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
  // POST HANDLERS  (load / create / edit / delete / like live in usePosts)
  // =========================================
  // A post carries its real product, so ordering from a post is ordering that product.
  const handleOrderFromPost = (post: Post) => {
    if (post.product) setOrderingProduct(post.product);
  };

  // What only the owner can do. A visitor gets none of these, so the Sidebar shows no edit controls.
  const ownerActions = readOnly
    ? {}
    : {
        onSaveProfile: saveProfile,
        openProductModal: handleOpenProductModal,
        onAddCategory: handleAddCategory,
        onRequestDeleteCategory: setDeletingCategory,
        onRenameCategory: handleRenameCategory,
      };

  // =========================================
  // RENDER
  // =========================================
  if (!me || !profile) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gray-50 text-sm">
        {profileError ? (
          <p className="text-red-600">{profileError}</p>
        ) : (
          <p className="text-gray-400">Loading...</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-gray-50 text-gray-900 overflow-hidden">
      {/* Top navbar for tablet and desktop (phones use the mobile header and bottom nav below) */}
      <div className="hidden md:block">
        <HomeTopBar profile={me} active={readOnly ? null : "profile"} />
      </div>

      {/* Sidebar + feed row: takes the height left under the navbar */}
      <div className="flex min-h-0 w-full flex-1">
      {/* Mobile header (hidden on md+) */}
      <MobileHeader
        onMenuClick={() => setIsDrawerOpen(true)}
        userName={me.name}
        userAvatar={me.avatar}
      />

      {/* Sidebar — drawer on mobile, static on tablet/desktop */}
      <Sidebar
        profile={profile}
        readOnly={readOnly}
        friendAction={userId ? <FriendButton userId={userId} /> : undefined}
        {...ownerActions}
        categories={categories}
        storeError={storeError}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        setViewingProduct={setViewingProduct}
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
        onEditPost={editPost}
        onRevivePost={revivePost}
        onDeletePost={deletePost}
        onToggleLike={toggleLike}
        onOrderPost={handleOrderFromPost}
        readOnly={readOnly}
        />
      </div>

      {/* Mobile bottom nav (hidden on md+) */}
      <BottomNav
        onMenuClick={() => setIsDrawerOpen(true)}
        onStoreClick={() => setIsDrawerOpen(true)}
        onProfileClick={() => setIsDrawerOpen(true)}
      />

      {/* Modals. The editing ones exist only on my own page. */}
      {!readOnly && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          editingProduct={editingProduct}
          tempProduct={tempProduct}
          setTempProduct={setTempProduct}
        />
      )}

        <ViewProductModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={readOnly ? undefined : handleOpenProductFromView}
        onOrder={handleOrderProduct}
        />

      {!readOnly && (
        <DeleteCategoryModal
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleConfirmDeleteCategory}
        />
      )}

        <OrderFormModal
        key={orderingProduct?.id ?? "no-order"}
        product={orderingProduct}
        onClose={() => setOrderingProduct(null)}
        />
    </div>
  );
}
