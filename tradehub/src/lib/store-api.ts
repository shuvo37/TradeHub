// src/lib/store-api.ts
import { apiRequest, jsonInit } from "@/lib/api";
import type { Category, Product } from "@/types/profile";

// Shapes exactly as the backend sends them (camelCase of CategoryDto / ProductDto).
export interface ProductDto {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  quantity: number | null;
  status: "Available" | "Unavailable" | null;
  discount: number;
}

interface CategoryDto {
  id: string;
  name: string;
  products: ProductDto[];
}

// Backend stores stock as two fields; the UI uses one:
//   quantity > 0            -> quantity is set, status is null -> UI shows the number
//   otherwise               -> quantity is null, status is set  -> UI shows "Available"/"Unavailable"
// Exported because a post carries a product too (posts-api uses it).
export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    description: dto.description,
    image: dto.image,
    quantity: dto.quantity ?? dto.status ?? "Available",
    discount: dto.discount > 0 ? dto.discount : undefined,
  };
}

function toCategory(dto: CategoryDto): Category {
  return { id: dto.id, name: dto.name, products: dto.products.map(toProduct) };
}

// ---------- Categories ----------
export async function fetchCategories(): Promise<Category[]> {
  const res = await apiRequest("/api/categories");
  return ((await res.json()) as CategoryDto[]).map(toCategory);
}

// GET /api/users/{id}/categories: another user's store (read-only), same shape as my own.
export async function fetchCategoriesByUser(userId: string): Promise<Category[]> {
  const res = await apiRequest(`/api/users/${userId}/categories`);
  return ((await res.json()) as CategoryDto[]).map(toCategory);
}

export async function createCategory(name: string): Promise<Category> {
  const res = await apiRequest("/api/categories", jsonInit("POST", { name }));
  return toCategory((await res.json()) as CategoryDto);
}

// 204 No Content
export async function renameCategory(id: string, name: string): Promise<void> {
  await apiRequest(`/api/categories/${id}`, jsonInit("PUT", { name }));
}

// 204 No Content; the backend also deletes the category's products
export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/api/categories/${id}`, { method: "DELETE" });
}

// ---------- Products ----------
// UI -> backend. A number sends the count; "Available"/"Unavailable" send the status.
// (A count of 0 sends no status, and the backend stores that as Available.)
// A missing name is left out on purpose: the backend answers "Product name is required".
function toSaveProductDto(p: Partial<Product>) {
  return {
    name: p.name,
    price: p.price,
    description: p.description,
    image: p.image,
    quantity: typeof p.quantity === "number" ? p.quantity : null,
    status: p.quantity === "Available" || p.quantity === "Unavailable" ? p.quantity : null,
    discount: p.discount ?? null,
  };
}

export async function createProduct(
  categoryId: string,
  product: Partial<Product>
): Promise<Product> {
  const res = await apiRequest(
    `/api/categories/${categoryId}/products`,
    jsonInit("POST", toSaveProductDto(product))
  );
  return toProduct((await res.json()) as ProductDto);
}

// PUT answers 204 with no body, so read the product back to get exactly what the server stored.
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  await apiRequest(`/api/products/${id}`, jsonInit("PUT", toSaveProductDto(product)));
  const res = await apiRequest(`/api/products/${id}`);
  return toProduct((await res.json()) as ProductDto);
}

// 204 No Content
export async function deleteProduct(id: string): Promise<void> {
  await apiRequest(`/api/products/${id}`, { method: "DELETE" });
}
