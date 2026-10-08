// src/lib/orders-api.ts
import { apiRequest, jsonInit } from "@/lib/api";

// The backend's own enum names (they keep the old spelling on purpose)
export type OrderPaymentMethod = "ON_CASH_DELIVERY" | "PAYMENT_BEFORE_DELIVARY";
export type OrderPaymentProvider = "bKash" | "Nogod";
export type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// What the server would charge (OrderQuoteDto). The form shows these numbers: the browser never calculates a price.
export interface OrderQuote {
  productId: string;
  productName: string;
  unitPrice: number;        // one item, before the discount (dollars)
  discountPercent: number;  // 0 when there is no discount
  quantity: number;
  totalPrice: number;       // whole dollars, rounded down by the server
}

// An order as the backend sends it (OrderDto)
export interface Order {
  id: string;
  productId: string | null;  // null if the seller deleted the product later
  productName: string;
  productImage: string;      // "" when none
  categoryName: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  totalPrice: number;
  pickupLocation: string;
  phone: string;
  paymentMethod: OrderPaymentMethod;
  paymmentProvider: OrderPaymentProvider | null; // only for "pay before delivery"
  paidToNumber: string;
  transactionId: string;     // "" when none
  proofImage: string;        // "" when none
  orderStatus: OrderStatus;
  createdAt: string;         // ISO date
  decidedAt: string | null;  // ISO date: when the seller accepted or rejected; null while PENDING
}

// What the buyer sends (OrderSaveDto). There is no price: the server calculates it.
export interface NewOrder {
  productId: string;
  quantity: number;
  pickupLocation: string;
  phone: string;
  paymentMethod: OrderPaymentMethod;
  paymmentProvider?: OrderPaymentProvider;
  paidToNumber?: string;
  transactionId?: string;
  proofImage?: string;       // the Cloudinary URL of the payment screenshot
}

// GET /api/orders/quote?productId=&quantity=
// Same checks as placing the order: a wrong product, your own product, no stock, no valid price all come back as Error(message).
export async function fetchOrderQuote(productId: string, quantity: number): Promise<OrderQuote> {
  const query = `?productId=${encodeURIComponent(productId)}&quantity=${quantity}`;
  const res = await apiRequest(`/api/orders/quote${query}`);
  return (await res.json()) as OrderQuote;
}

// POST /api/orders: returns the saved order. The stock is already reduced when this returns.
export async function createOrder(order: NewOrder): Promise<Order> {
  const res = await apiRequest("/api/orders", jsonInit("POST", order));
  return (await res.json()) as Order;
}

// GET /api/orders/{id}: one order I placed (the summary card opened from the bell).
// Still works after the seller deleted the order on their side: the buyer keeps it as proof.
// Someone else's order and a missing order both answer 404 "Order not found".
export async function fetchMyOrder(id: string): Promise<Order> {
  const res = await apiRequest(`/api/orders/${id}`);
  return (await res.json()) as Order;
}

// ---------------------------------------------------------------------------
// Seller side: the orders I received
// ---------------------------------------------------------------------------

// The tabs of the orders screen: everything, or one status
export type OrderFilter = "all" | OrderStatus;

// One page of received orders (OrderPageDto), newest first, 10 per page
export interface OrdersPage {
  items: Order[];
  hasMore: boolean;
  nextCursor: string | null; // send it back unchanged as `before` to get the next page
}

// Numbers for the tabs; `pending` is also the red number on the bag icon (OrderCountsDto)
export interface OrderCounts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
}

// GET /api/orders/received?status=&phone=&before=
// status: leave out for all orders. phone: part of a phone number (the server does "contains").
// before: the nextCursor of the previous page, leave out for the first page.
// URLSearchParams URL-encodes the values, so the cursor travels exactly as it was received.
export async function fetchReceivedOrders(options: {
  status?: OrderStatus;
  phone?: string;
  before?: string;
} = {}): Promise<OrdersPage> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.phone) params.set("phone", options.phone);
  if (options.before) params.set("before", options.before);
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const res = await apiRequest(`/api/orders/received${query}`);
  return (await res.json()) as OrdersPage;
}

// GET /api/orders/received/counts: ignores the phone search
export async function fetchOrderCounts(): Promise<OrderCounts> {
  const res = await apiRequest("/api/orders/received/counts");
  return (await res.json()) as OrderCounts;
}

// PUT /api/orders/{id}/status: 204 No Content. Seller only, and only while the order is PENDING.
// Rejecting also gives the stock back (the server does that).
export async function updateOrderStatus(id: string, status: "ACCEPTED" | "REJECTED"): Promise<void> {
  await apiRequest(`/api/orders/${id}/status`, jsonInit("PUT", { orderStatus: status }));
}

// DELETE /api/orders/{id}: 204 No Content. Seller only, and only after the order is accepted or rejected.
export async function deleteReceivedOrder(id: string): Promise<void> {
  await apiRequest(`/api/orders/${id}`, { method: "DELETE" });
}
