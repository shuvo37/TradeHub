// src/types/profile.ts
export interface UserProfile {
  name: string;
  uniqueName: string;
  avatar: string;
  location: string;
  paymentNumber: string;
  email: string;
  phone: string;
  necessaryInfo: string;
}

export const defaultProfile: UserProfile = {
  name: "TradeHub User",
  uniqueName: "",
  avatar: "",
  location: "",
  paymentNumber: "",
  email: "",
  phone: "",
  necessaryInfo: "",
};

// src/types/profile.ts
export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  quantity: number | "Available" | "Unavailable";
  discount?: number;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

// A post as the backend sends it (PostDto). The attached product is already converted
// to the Product shape above, so the UI uses it exactly like a product from My Store.
export interface Post {
  id: string;
  text: string;
  image: string;          // "" when the post has no image
  createdAt: string;      // ISO date, e.g. "2026-10-05T04:10:00+00:00"
  authorId: string;
  authorName: string;
  authorAvatar: string;   // "" when the author has no avatar
  product: Product | null; // the attached product, or null
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

// A comment as the backend sends it (CommentDto). A post's comments come oldest first.
export interface Comment {
  id: string;
  postId: string;
  text: string;
  createdAt: string;      // ISO date
  authorId: string;
  authorName: string;
  authorAvatar: string;   // "" when the author has no avatar
}
