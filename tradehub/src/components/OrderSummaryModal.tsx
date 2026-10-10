// src/components/OrderSummaryModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMyOrder, type Order } from "@/lib/orders-api";

interface Props {
  orderId: string;
  onClose: () => void;
}

// Dollars as the server calculated them: "$4", "$12.50"
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// "8 Oct 2026, 3:42 PM" in the viewer's own time zone
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 break-words text-sm text-gray-800">{value}</p>
    </div>
  );
}

// A popup with the summary of ONE order I placed, opened from an "accepted / rejected your order" notification.
// It is read-only and shows what I gave when ordering, the price the server calculated, and the seller's
// decision with the time. It keeps working after the seller deleted the order on their side.
// Closes on the X button, the Close button, a press outside the box, or Escape.
export default function OrderSummaryModal({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyOrder(orderId)
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Escape closes the popup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const prepaid = order?.paymentMethod === "PAYMENT_BEFORE_DELIVARY";

  // Portal to <body>, like PostModal: the top bar can clip a fixed popup placed inside it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        // Only a press on the dark area itself closes it, not a press inside the box
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order summary"
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">Order summary</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          {error && <p className="px-4 py-10 text-center text-sm text-red-600">{error}</p>}
          {!order && !error && <p className="px-4 py-10 text-center text-sm text-gray-400">Loading...</p>}

          {order && (
            <div className="space-y-3 p-4">
              {/* The seller's decision, with the time */}
              <div
                className={`rounded-xl border px-4 py-3 text-center ${
                  order.orderStatus === "ACCEPTED"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : order.orderStatus === "REJECTED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <p className="text-sm font-semibold">
                  {order.orderStatus === "ACCEPTED" && `✓ Accepted by ${order.sellerName}`}
                  {order.orderStatus === "REJECTED" && `✕ Rejected by ${order.sellerName}`}
                  {order.orderStatus === "PENDING" && `Waiting for ${order.sellerName}`}
                </p>
                {order.decidedAt && (
                  <p className="mt-0.5 text-xs">{formatDateTime(order.decidedAt)}</p>
                )}
              </div>

              {/* Product */}
              <div className="flex gap-3 rounded-xl border border-gray-100 p-3">
                {order.productImage ? (
                  <img
                    src={order.productImage}
                    alt={order.productName}
                    className="h-16 w-16 shrink-0 rounded-lg border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                    No image
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-900">{order.productName}</h3>
                  {order.categoryName && (
                    <p className="text-xs text-gray-500">
                      in <span className="font-medium text-gray-700">{order.categoryName}</span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {order.quantity} × {money(order.unitPrice)}
                    {order.discountPercent > 0 && ` · ${order.discountPercent}% off`}
                  </p>
                  <p className="font-mono text-lg font-bold text-blue-600">{money(order.totalPrice)}</p>
                </div>
              </div>

              {/* What I gave when ordering */}
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                <Row label="Pickup location" value={order.pickupLocation} />
                <Row label="Phone" value={order.phone} />
                <Row label="Seller" value={order.sellerName} />
                <Row label="Ordered" value={formatDateTime(order.createdAt)} />
                <Row label="Payment" value={prepaid ? "Pay before delivery" : "Cash on delivery"} />
                {prepaid && order.paymmentProvider && (
                  <Row label="Paid via" value={order.paymmentProvider === "bKash" ? "bKash" : "Nagad"} />
                )}
                {prepaid && order.paidToNumber && <Row label="Payment number" value={order.paidToNumber} />}
                {prepaid && order.transactionId && <Row label="Transaction ID" value={order.transactionId} />}
              </div>

              {prepaid && order.proofImage && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Payment screenshot
                  </p>
                  <img
                    src={order.proofImage}
                    alt="Payment proof"
                    className="max-h-56 w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
