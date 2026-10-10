// src/lib/posts-api.ts
import { apiRequest, jsonInit } from "@/lib/api";
import { toProduct, type ProductDto } from "@/lib/store-api";
import type { Post } from "@/types/profile";

// Shape exactly as the backend sends it (camelCase of PostDto).
interface PostDto {
  id: string;
  text: string;
  image: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  product: ProductDto | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

// What the Composer hands over when publishing (matches the backend's CreatePostDto).
export interface NewPost {
  text: string;
  image?: string;      // an uploaded image URL
  productId?: string;  // the id of one of my own products
}

// Everything is the same except the product, which goes through the same converter as My Store.
function toPost(dto: PostDto): Post {
  return { ...dto, product: dto.product ? toProduct(dto.product) : null };
}

// Newest first (the backend already sorts them)
export async function fetchPostsByUser(userId: string): Promise<Post[]> {
  const res = await apiRequest(`/api/posts/user/${userId}/allPost`);
  return ((await res.json()) as PostDto[]).map(toPost);
}

export async function createPost(input: NewPost): Promise<Post> {
  const res = await apiRequest("/api/posts", jsonInit("POST", input));
  return toPost((await res.json()) as PostDto);
}

// 204 No Content; the backend also deletes the post's comments
export async function deletePost(id: string): Promise<void> {
  await apiRequest(`/api/posts/${id}`, { method: "DELETE" });
}

// 204 No Content. Safe to repeat: liking a post you already liked changes nothing.
export async function likePost(id: string): Promise<void> {
  await apiRequest(`/api/posts/${id}/like`, { method: "PUT" });
}

// 204 No Content. Safe to repeat: unliking a post you never liked changes nothing.
export async function unlikePost(id: string): Promise<void> {
  await apiRequest(`/api/posts/${id}/like`, { method: "DELETE" });
}
