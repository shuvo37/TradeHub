// src/components/OrdersUI.tsx
"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/time";
import type { ReceivedOrders } from "@/hooks/useReceivedOrders";
import type { Order, OrderFilter, OrderPaymentProvider, OrderStatus } from "@/lib/orders-api";

// ============================================================
// HELPERS
// ============================================================
// Dollars as the server calculated them: "$4", "$12.50"
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";

const STATUS_STYLE: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Pending", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  ACCEPTED: { label: "Accepted", badge: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  REJECTED: { label: "Rejected", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// The backend calls the second provider "Nogod"; the screen says "Nagad"
const PROVIDER_STYLE: Record<OrderPaymentProvider, { label: string; bg: string }> = {
  bKash: { label: "bKash", bg: "bg-[#E2136E]" },
  Nogod: { label: "Nagad", bg: "bg-[#EE2A24]" },
};

function ProviderBadge({ provider }: { provider: OrderPaymentProvider | null }) {
  if (!provider) return null;
  const config = PROVIDER_STYLE[provider];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded text-white ${config.bg}`}>
      {config.label}
    </span>
  );
}

function Thumb({ order, className }: { order: Order; className: string }) {
  return order.productImage ? (
    <img
      src={order.productImage}
      alt={order.productName}
      className={`${className} rounded-xl object-cover shrink-0 border border-gray-100`}
    />
  ) : (
    <div
      className={`${className} rounded-xl bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 shrink-0`}
    >
      No image
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

const svgProps = {
  className: "w-4 h-4",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

// ============================================================
// DETAIL VIEW: one order, with Accept / Reject / Delete
// ============================================================
function OrderDetail({
  order: o,
  onBack,
  onDecide,
  onDelete,
}: {
  order: Order;
  onBack: () => void;
  onDecide: (status: "ACCEPTED" | "REJECTED") => Promise<void>; // throws with the backend's message
  onDelete: () => Promise<void>; // throws with the backend's message
}) {
  const [acting, setActing] = useState<"ACCEPTED" | "REJECTED" | "DELETE" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const decide = async (status: "ACCEPTED" | "REJECTED") => {
    setActing(status);
    setError(null);
    try {
      await onDecide(status);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActing(null);
    }
  };

  const remove = async () => {
    setActing("DELETE");
    setError(null);
    try {
      await onDelete(); // on success this screen is closed by the parent
    } catch (err) {
      setError(errorMessage(err));
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">Order details</h1>
          <p className="text-[11px] text-gray-400">
            {timeAgo(o.createdAt)} · Order #{o.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={o.orderStatus} />
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-3">
          <Thumb order={o} className="w-20 h-20" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Product</p>
            <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">{o.productName}</h3>
            {o.categoryName && (
              <p className="text-xs text-gray-500 mt-0.5">
                in <span className="font-medium text-gray-700">{o.categoryName}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {o.quantity} × {money(o.unitPrice)}
              {o.discountPercent > 0 && ` · ${o.discountPercent}% off`}
            </p>
            <p className="text-lg font-bold text-blue-600 mt-1 font-mono">{money(o.totalPrice)}</p>
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
              <svg {...svgProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
            }
            label="Name"
            value={o.buyerName}
          />
          <InfoRow
            icon={
              <svg {...svgProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            label="Pickup location"
            value={o.pickupLocation}
          />
          <InfoRow
            icon={
              <svg {...svgProps}>
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
              o.paymentMethod === "ON_CASH_DELIVERY" ? "bg-gray-100 text-gray-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {o.paymentMethod === "ON_CASH_DELIVERY" ? "Cash on delivery" : "Pay before delivery"}
          </span>
        </div>

        {o.paymentMethod === "PAYMENT_BEFORE_DELIVARY" ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Paid via</span>
              <ProviderBadge provider={o.paymmentProvider} />
            </div>

            {o.paidToNumber && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment number</p>
                <p className="text-sm font-mono text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {o.paidToNumber}
                </p>
              </div>
            )}

            {o.transactionId && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Transaction ID</p>
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
              <p className="text-xs text-gray-400 italic">No transaction ID or screenshot provided.</p>
            )}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-500">Buyer will pay in cash when the product is delivered.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 pb-6">
        {o.orderStatus === "PENDING" ? (
          <div className="flex gap-2">
            <button
              onClick={() => decide("REJECTED")}
              disabled={acting !== null}
              className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              {acting === "REJECTED" ? "Rejecting..." : "Reject"}
            </button>
            <button
              onClick={() => decide("ACCEPTED")}
              disabled={acting !== null}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {acting === "ACCEPTED" ? "Accepting..." : "Accept"}
            </button>
          </div>
        ) : (
          <>
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${
                o.orderStatus === "ACCEPTED"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {o.orderStatus === "ACCEPTED" ? "✓ You accepted this order" : "✕ You rejected this order"}
            </div>
            {/* The server only deletes an order after it is decided, so a pending order has no Delete button */}
            <button
              onClick={() => {
                setError(null);
                setConfirmDelete(true);
              }}
              disabled={acting !== null}
              className="w-full py-2.5 rounded-xl border border-gray-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
            >
              Delete order
            </button>
          </>
        )}
        {error && !confirmDelete && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-base font-bold text-gray-900">Delete this order?</h3>
            <p className="text-sm text-gray-500 mt-1">This action can&apos;t be undone.</p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={acting === "DELETE"}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={acting === "DELETE"}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {acting === "DELETE" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT: the list (tabs, phone search, More) and the detail view
// The data and the actions come from useReceivedOrders (the Orders page owns it,
// so the bag number in the top bar is the same number as the tabs).
// ============================================================
const TABS: { filter: OrderFilter; label: string; count: "all" | "pending" | "accepted" | "rejected" }[] = [
  { filter: "all", label: "All", count: "all" },
  { filter: "PENDING", label: "Pending", count: "pending" },
  { filter: "ACCEPTED", label: "Accepted", count: "accepted" },
  { filter: "REJECTED", label: "Rejected", count: "rejected" },
];

export default function OrdersUI({ orders: data }: { orders: ReceivedOrders }) {
  const [selected, setSelected] = useState<Order | null>(null);

  if (selected) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => setSelected(null)}
        onDecide={async (status) => {
          await data.decide(selected, status);
          setSelected({ ...selected, orderStatus: status });
        }}
        onDelete={async () => {
          await data.remove(selected);
          setSelected(null);
        }}
      />
    );
  }

  const tabLabel = TABS.find((t) => t.filter === data.filter)?.label.toLowerCase() ?? "";

  return (
    <div className="space-y-3">
      {/* Header, search, tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 pt-4">
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          {data.counts && (
            <p className="text-xs text-gray-500 mt-0.5">
              {data.counts.pending} pending · {data.counts.all} total
            </p>
          )}
        </div>

        <div className="px-4 pt-3 pb-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={data.search}
              onChange={(e) => data.changeSearch(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {data.search && (
              <button
                onClick={data.clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center hover:bg-gray-300"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.filter}
              onClick={() => data.changeFilter(t.filter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                data.filter === t.filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{t.label}</span>
              {data.counts && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    data.filter === t.filter ? "bg-white/20" : "bg-white"
                  }`}
                >
                  {data.counts[t.count]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {data.error && <p className="text-sm text-red-600">{data.error}</p>}
      {data.loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!data.loading && !data.error && data.orders.length === 0 && !data.hasMore && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{data.phone ? "No matches" : "No orders here"}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.phone
              ? `No orders with phone matching "${data.phone}"`
              : data.filter === "all"
              ? "Order requests will appear here."
              : `No ${tabLabel} orders.`}
          </p>
        </div>
      )}

      {data.orders.map((o) => (
        <button
          key={o.id}
          onClick={() => setSelected(o)}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex gap-3">
            <Thumb order={o} className="w-14 h-14" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{o.productName}</p>
                <StatusBadge status={o.orderStatus} />
              </div>
              {o.categoryName && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  in <span className="font-medium text-gray-700">{o.categoryName}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Qty {o.quantity} · <span className="font-semibold text-gray-700">{money(o.totalPrice)}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {o.paymentMethod === "ON_CASH_DELIVERY" ? (
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Cash on delivery
                  </span>
                ) : (
                  <ProviderBadge provider={o.paymmentProvider} />
                )}
                <span className="text-[10px] text-gray-400">{timeAgo(o.createdAt)}</span>
              </div>
            </div>
          </div>
        </button>
      ))}

      {data.hasMore && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            onClick={data.loadMore}
            disabled={data.loadingMore}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {data.loadingMore ? "Loading..." : "More"}
          </button>
          {data.moreError && <p className="text-sm text-red-600">{data.moreError}</p>}
        </div>
      )}
    </div>
  );
}
