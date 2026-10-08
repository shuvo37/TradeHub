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
  revivedAt: string | null;
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

// One page of the news feed: my posts and my friends' posts, newest first (the backend decides the page size: 10).
// A revived post counts from its revive time, so the order is not the same as the createdAt order.
// `nextCursor` is where the next page starts. Send it back as `before` exactly as it came (do not reformat it);
// leave `before` out for the first page. `nextCursor` is null when the page is empty.
export interface FeedPage {
  items: Post[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function fetchFeed(before?: string): Promise<FeedPage> {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const res = await apiRequest(`/api/posts/feed${query}`);
  const page = (await res.json()) as { items: PostDto[]; hasMore: boolean; nextCursor: string | null };
  return { items: page.items.map(toPost), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

// One post by id (any logged-in user may read it). Answers 404 "Post not found" if it was deleted.
export async function fetchPostById(id: string): Promise<Post> {
  const res = await apiRequest(`/api/posts/${id}`);
  return toPost((await res.json()) as PostDto);
}

export async function createPost(input: NewPost): Promise<Post> {
  const res = await apiRequest("/api/posts", jsonInit("POST", input));
  return toPost((await res.json()) as PostDto);
}

// 204 No Content. Only the text can change; the image and the attached product stay as they are.
// The backend answers "A post needs text, an image, or a product" if nothing would be left.
export async function updatePostText(id: string, text: string): Promise<void> {
  await apiRequest(`/api/posts/${id}`, jsonInit("PUT", { text }));
}

// 204 No Content. Moves my post back to the top of the feed. A post can be revived once in 24 hours
// (editing shares the same wait). Too early answers 400 with the time left, for example
// "You can revive this post again in 5h 12m" (apiRequest turns that message into an Error).
export async function revivePost(id: string): Promise<void> {
  await apiRequest(`/api/posts/${id}/revive`, { method: "PUT" });
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
