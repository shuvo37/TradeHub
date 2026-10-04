// src/components/TradeHubApp.tsx
"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import OrderFormModal, { OrderFormData } from "@/components/modals/OrderFormModal";
import { generateUniqueName } from "@/lib/generateUniqueName";
import {
  UserProfile,
  defaultProfile,
  Category,
  Product,
  Post,
  Comment,
} from "@/types/profile";
import Sidebar from "@/components/Sidebar";
import Feed from "@/components/Feed";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ViewProductModal from "@/components/modals/ViewProductModal";
import DeleteCategoryModal from "@/components/modals/DeleteCategoryModal";

export default function TradeHubApp() {
  // --- Global State ---
  const [profile, setProfile] = useLocalStorage<UserProfile>("tradehub_profile", defaultProfile);
  const [categories, setCategories] = useLocalStorage<Category[]>("tradehub_categories", []);
  const [posts, setPosts] = useLocalStorage<Post[]>("tradehub_posts", []);

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

  // --- Migration: Add default like fields to old posts ---
    // --- Migration: Add default like fields to old posts ---
  useEffect(() => {
    const needsMigration = posts.some(p => p.likes === undefined || p.likedByMe === undefined);
    if (needsMigration) {
      setPosts(
        posts.map(p => ({
          ...p,
          likes: p.likes ?? 0,
          likedByMe: p.likedByMe ?? false,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // PRODUCT HANDLERS
  // =========================================
  const handleOpenProductModal = (product: Product | null, categoryId: string) => {
    setEditingProduct(product);
    setTempProduct(product || {});
    setCurrentCategoryIdForProduct(categoryId);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!currentCategoryIdForProduct || !tempProduct.name) return;

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: tempProduct.name || "",
      price: tempProduct.price || "",
      description: tempProduct.description || "",
      image: tempProduct.image || "",
      quantity: tempProduct.quantity ?? "Available",
      discount: tempProduct.discount,
    };

    setCategories(
      categories.map(cat => {
        if (cat.id === currentCategoryIdForProduct) {
          const existingProducts = editingProduct
            ? cat.products.map(p => (p.id === newProduct.id ? newProduct : p))
            : [...cat.products, newProduct];
          return { ...cat, products: existingProducts };
        }
        return cat;
      })
    );

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setTempProduct({});
    setCurrentCategoryIdForProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!currentCategoryIdForProduct || !editingProduct) return;

    setCategories(
      categories.map(cat => {
        if (cat.id === currentCategoryIdForProduct) {
          return { ...cat, products: cat.products.filter(p => p.id !== editingProduct.id) };
        }
        return cat;
      })
    );

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setTempProduct({});
    setCurrentCategoryIdForProduct(null);
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
  // CATEGORY HANDLERS
  // =========================================
  const handleConfirmDeleteCategory = () => {
    if (!deletingCategory) return;
    setCategories(categories.filter(cat => cat.id !== deletingCategory.id));
    if (activeCategoryId === deletingCategory.id) setActiveCategoryId(null);
    setDeletingCategory(null);
  };

  const handleRenameCategory = (categoryId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCategories(
      categories.map(cat => (cat.id === categoryId ? { ...cat, name: trimmed } : cat))
    );
  };

  // =========================================
  // POST HANDLERS
  // =========================================
  const handleCreatePost = (newPost: {
    text: string;
    image?: string;
    orderItem?: {
      name: string;
      price: string;
      description: string;
      image?: string;
      quantity: number | "Available" | "Unavailable";
      discount?: number;

    };
  }) => {
    const post: Post = {
      id: Date.now().toString(),
      text: newPost.text,
      image: newPost.image,
      orderItem: newPost.orderItem,
      comments: [],
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
    };
    setPosts([post, ...posts]);
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleAddComment = (postId: string, text: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      authorName: profile.name,
      authorAvatar: profile.avatar,
      text,
      createdAt: Date.now(),
    };
    setPosts(
      posts.map(p => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  };

  const handleToggleLike = (postId: string) => {
    setPosts(
      posts.map(p => {
        if (p.id !== postId) return p;
        const isLiked = p.likedByMe;
        return {
          ...p,
          likedByMe: !isLiked,
          likes: isLiked ? Math.max(0, (p.likes ?? 0) - 1) : (p.likes ?? 0) + 1,
        };
      })
    );
  };

  
  const handleOrderFromPost = (post: Post) => {
  if (!post.orderItem) return;
  const syntheticProduct: Product = {
    id: `post-${post.id}`,
    name: post.orderItem.name,
    price: post.orderItem.price,
    description: post.orderItem.description,
    image: post.orderItem.image ?? "",
    quantity: post.orderItem.quantity,
    discount: post.orderItem.discount,
  };
  setOrderingProduct(syntheticProduct);
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
        setCategories={setCategories}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        openProductModal={handleOpenProductModal}
        setViewingProduct={setViewingProduct}
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
        onCreatePost={handleCreatePost}
        onDeletePost={handleDeletePost}
        onAddComment={handleAddComment}
        onToggleLike={handleToggleLike}
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