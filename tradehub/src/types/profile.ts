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

// --- NEW: Posts & Comments ---
export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: number;
}

export interface OrderItem {
  name: string;
  price: string;
  description: string;
  image?: string;
  quantity: number | "Available" | "Unavailable";
  discount?: number;

}

// src/types/profile.ts
export interface Post {
  id: string;
  text: string;
  image?: string;
  orderItem?: OrderItem;
  comments: Comment[];
  createdAt: number;
  likes: number;          // <-- NEW
  likedByMe: boolean;     // <-- NEW
}
