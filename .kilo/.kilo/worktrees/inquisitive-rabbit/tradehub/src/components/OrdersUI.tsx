// src/components/OrdersUI.tsx
"use client";

import { useMemo, useState } from "react";

// ============================================================
// TYPES
// ============================================================
type PaymentProvider = "bkash" | "nagad";
type OrderStatus = "pending" | "accepted" | "rejected";

interface OrderRequest {
  id: string;
  productId: string;
  productName: string;
  categoryName: string; // NEW
  productPrice: string;
  productImage?: string;
  quantity: number;
  totalPrice: string;
  pickupLocation: string;
  phone: string;
  paymentMethod: "cod" | "prepaid";
  paymentProvider?: PaymentProvider;
  paidToNumber?: string;
  transactionId?: string;
  proofImage?: string;
  status: OrderStatus;
  createdAt: number;
}

// ============================================================
// DUMMY DATA
// ============================================================
const DUMMY_ORDERS: OrderRequest[] = [
  {
    id: "o1",
    productId: "p1",
    productName: "The Alchemist",
    categoryName: "Books",
    productPrice: "$2",
    productImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200",
    quantity: 2,
    totalPrice: "$4",
    pickupLocation: "House 12, Road 5, Dhanmondi, Dhaka",
    phone: "01712345678",
    paymentMethod: "prepaid",
    paymentProvider: "bkash",
     paidToNumber: "01712345678",
    transactionId: "TXN8H2K9L4M",
    proofImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    status: "pending",
    createdAt: Date.now() - 1000 * 60 * 12, // 12 min ago (newest)
  },
  {
    id: "o2",
    productId: "p2",
    productName: "Wireless Mouse",
    categoryName: "Electronics",
    productPrice: "$15",
    quantity: 1,
    totalPrice: "$15",
    pickupLocation: "Flat 3B, Green Tower, Uttara, Dhaka",
    phone: "01811987654",
    paymentMethod: "cod",
    status: "pending",
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 h ago
  },
  {
    id: "o3",
    productId: "p1",
    productName: "The Alchemist",
    categoryName: "Books",
    productPrice: "$2",
    productImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200",
    quantity: 5,
    totalPrice: "$10",
    pickupLocation: "Sector 7, Road 12, Bashundhara, Dhaka",
    phone: "01913555666",
    paymentMethod: "prepaid",
    paymentProvider: "nagad",
     paidToNumber: "01712345678",
    transactionId: "NGD77PLQ22",
    status: "accepted",
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // 26 h ago
  },
  {
    id: "o4",
    productId: "p3",
    productName: "Notebook Set",
    categoryName: "Stationery",
    productPrice: "$5",
    quantity: 3,
    totalPrice: "$15",
    pickupLocation: "Mirpur 10, Dhaka",
    phone: "01712345678", // same as o1 → lets you test search
    paymentMethod: "cod",
    status: "rejected",
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 48 h ago (oldest)
  },
];

// ============================================================
// HELPERS
// ============================================================
function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const label = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${map[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "pending"
            ? "bg-amber-500"
            : status === "accepted"
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />
      {label[status]}
    </span>
  );
}

function ProviderBadge({ provider }: { provider?: PaymentProvider }) {
  if (!provider) return null;
  const config = {
    bkash: { label: "bKash", bg: "bg-[#E2136E]", text: "text-white" },
    nagad: { label: "Nagad", bg: "bg-[#EE2A24]", text: "text-white" },
  }[provider];
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
type Filter = "all" | "pending" | "accepted" | "rejected";

export default function OrdersUI() {
  const [orders, setOrders] = useState<OrderRequest[]>(DUMMY_ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selected = orders.find(o => o.id === selectedId) || null;

  // Filter + search + sort (newest first)
  const filtered = useMemo(() => {
    let list = orders;

    // status filter
    if (filter !== "all") list = list.filter(o => o.status === filter);

    // phone search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(o => o.phone.toLowerCase().includes(q));
    }

    // sort newest → oldest
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, filter, search]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      accepted: orders.filter(o => o.status === "accepted").length,
      rejected: orders.filter(o => o.status === "rejected").length,
    }),
    [orders]
  );

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
    setConfirmDeleteId(null);
  };

  // ============================================================
  // DETAIL VIEW
  // ============================================================
  if (selected) {
    const o = selected;
    return (
      <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSelectedId(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
              aria-label="Back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">
                Order details
              </h1>
              <p className="text-[11px] text-gray-400">
                {timeAgo(o.createdAt)} · Order #{o.id}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            {/* Product card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-3 p-3">
                {o.productImage ? (
                  <img
                    src={o.productImage}
                    alt={o.productName}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Product
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                    {o.productName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    in <span className="font-medium text-gray-700">{o.categoryName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {o.quantity} × {o.productPrice}
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-1 font-mono">
                    {o.totalPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Buyer info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Buyer information</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                  label="Pickup location"
                  value={o.pickupLocation}
                />
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                  label="Phone"
                  value={o.phone}
                />
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Payment</h2>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    o.paymentMethod === "cod"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {o.paymentMethod === "cod" ? "Cash on delivery" : "Pay before delivery"}
                </span>
              </div>

              {o.paymentMethod === "prepaid" && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Paid via</span>
                    <ProviderBadge provider={o.paymentProvider} />
                  </div>

                    {o.paidToNumber && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Payment number
                      </p>
                      <p className="text-sm font-mono text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {o.paidToNumber}
                      </p>
                    </div>
                  )}



                  {o.transactionId && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Transaction ID
                      </p>
                      <p className="text-sm font-mono text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {o.transactionId}
                      </p>
                    </div>
                  )}

                  {o.proofImage && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Payment screenshot
                      </p>
                      <img
                        src={o.proofImage}
                        alt="Payment proof"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    </div>
                  )}

                  {!o.transactionId && !o.proofImage && (
                    <p className="text-xs text-gray-400 italic">
                      No transaction ID or screenshot provided.
                    </p>
                  )}
                </div>
              )}

              {o.paymentMethod === "cod" && (
                <div className="p-4">
                  <p className="text-sm text-gray-500">
                    Buyer will pay in cash when the product is delivered.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pb-6">
              {o.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(o.id, "rejected")}
                    className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(o.id, "accepted")}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Accept
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${
                    o.status === "accepted"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {o.status === "accepted"
                    ? "✓ You accepted this order"
                    : "✕ You rejected this order"}
                </div>
              )}

              <button
                onClick={() => setConfirmDeleteId(o.id)}
                className="w-full py-2.5 rounded-xl border border-gray-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50"
              >
                Delete order
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirm */}
        {confirmDeleteId === o.id && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
              <h3 className="text-base font-bold text-gray-900">Delete this order?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This action can't be undone.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrder(o.id)}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // LIST VIEW
  // ============================================================
  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {counts.pending} pending · {counts.all} total
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center hover:bg-gray-300"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(["all", "pending", "accepted", "rejected"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="capitalize">{f}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === f ? "bg-white/20" : "bg-white"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">
                {search ? "No matches" : "No orders here"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {search
                  ? `No orders with phone matching "${search}"`
                  : filter === "all"
                  ? "Order requests will appear here."
                  : `No ${filter} orders.`}
              </p>
            </div>
          ) : (
            filtered.map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex gap-3">
                  {o.productImage ? (
                    <img
                      src={o.productImage}
                      alt={o.productName}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                      No image
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {o.productName}
                      </p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      in <span className="font-medium text-gray-700">{o.categoryName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Qty {o.quantity} · <span className="font-semibold text-gray-700">{o.totalPrice}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {o.paymentMethod === "cod" ? (
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Cash on delivery
                        </span>
                      ) : (
                        <ProviderBadge provider={o.paymentProvider} />
                      )}
                      <span className="text-[10px] text-gray-400">{timeAgo(o.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Small sub-component
// ============================================================
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}