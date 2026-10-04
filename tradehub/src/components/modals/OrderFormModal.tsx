// src/components/modals/OrderFormModal.tsx
"use client";

import { useRef, useState } from "react";
import { Product } from "@/types/profile";

export type PaymentProvider = "bkash" | "nagad";

export interface OrderFormData {
  productId: string;
  productName: string;
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
  discountPercent?: number;
}

interface Props {
  product: Product | null;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
}

// ---------- Provider logos (inline SVG) ----------
function BkashLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#E2136E" />
      <path
        d="M14 12h11c4.4 0 7 2.3 7 6 0 2.4-1.2 4.1-3.4 5 2.9.8 4.6 2.9 4.6 5.9 0 4.3-3 6.9-7.9 6.9H14V12zm6 4.6v5.3h4.4c1.9 0 3-1 3-2.7 0-1.6-1.1-2.6-3-2.6H20zm0 9.6v5.9h5c2.1 0 3.4-1.1 3.4-3 0-1.8-1.3-2.9-3.4-2.9h-5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function NagadLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#EE2A24" />
      <path
        d="M32 14v20h-5.4V22.6L18.3 34H13V14h5.4v11.2L26.6 14H32z"
        fill="#FFFFFF"
      />
      <circle cx="35" cy="18" r="3" fill="#F9C542" />
    </svg>
  );
}

export default function OrderFormModal({ product, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [quantity, setQuantity] = useState(1);

  // step 2 fields
  const [pickupLocation, setPickupLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "prepaid">("cod");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [paidToNumber, setPaidToNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofImage, setProofImage] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!product) return null;

  // Extract numeric part from price string (e.g. "$50" → 50, "50" → 50, "৳50" → 50)
  const numericPrice = (() => {
    const match = String(product.price).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  })();

  const currencySymbol = String(product.price).replace(/[\d.\s]/g, "") || "$";
    const discountPercent = product.discount ?? 0;
  const hasDiscount = discountPercent > 0;
  const discountedUnitNumeric = hasDiscount
    ? numericPrice * (1 - discountPercent / 100)
    : numericPrice;
  const totalNumeric = discountedUnitNumeric * quantity;

    const fmt = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  };
  const totalPriceDisplay = `${currencySymbol}${fmt(totalNumeric)}`;

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProofImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit =
    pickupLocation.trim() !== "" &&
    phone.trim() !== "" &&
    (paymentMethod === "cod" ||
      (paymentProvider !== null &&
        (transactionId.trim() !== "" || proofImage !== undefined)));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      productId: product.id,
      productName: product.name,
      productPrice: String(product.price),
      productImage: product.image || undefined,
      quantity,
      totalPrice: totalPriceDisplay,
      pickupLocation: pickupLocation.trim(),
      phone: phone.trim(),
      paymentMethod,
      paymentProvider: paymentMethod === "prepaid" ? paymentProvider ?? undefined : undefined,
      paidToNumber:
        paymentMethod === "prepaid" ? paidToNumber.trim() || undefined : undefined,
      transactionId:
        paymentMethod === "prepaid" ? transactionId.trim() || undefined : undefined,
      proofImage: paymentMethod === "prepaid" ? proofImage : undefined,
      discountPercent: hasDiscount ? discountPercent : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
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
            )}
            <h2 className="text-base font-bold text-gray-900">
              {step === 1 ? "Order — Quantity" : "Order — Details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Product context */}
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                No image
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-sm font-bold ${
                    hasDiscount
                      ? "text-gray-400 line-through"
                      : "text-blue-600"
                  }`}
                >
                  {product.price}
                </span>
                {hasDiscount && (
                  <span className="inline-flex items-center text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                    {discountPercent}% off
                  </span>
                )}
              </div>
            </div>
          </div>
          {step === 1 ? (
            /* ---- STEP 1: Quantity ---- */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg border border-gray-200 text-lg font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10);
                    setQuantity(isNaN(n) ? 1 : Math.max(1, n));
                  }}
                  className="w-20 h-10 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-lg border border-gray-200 text-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            /* ---- STEP 2: Details ---- */
            <div className="space-y-4">
              {/* Recap */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-600">
                  {quantity} ×{" "}
                  {hasDiscount ? (
                    <>
                      <span className="line-through text-gray-400">
                        {product.price}
                      </span>{" "}
                      <span className="text-gray-800 font-medium">
                        {currencySymbol}
                        {fmt(discountedUnitNumeric)}
                      </span>
                    </>
                  ) : (
                    product.price
                  )}
                </span>
                <span className="font-bold text-gray-900">{totalPriceDisplay}</span>
              </div>

              {/* Total price (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total price
                </label>
                <input
                  type="text"
                  value={totalPriceDisplay}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div>

              {/* Pickup location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="Where should it be delivered?"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      paymentMethod === "cod"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-900">Cash on delivery</span>
                    {paymentMethod === "cod" && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("prepaid")}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      paymentMethod === "prepaid"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-900">Pay before delivery</span>
                    {paymentMethod === "prepaid" && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Prepaid fields */}
              {paymentMethod === "prepaid" && (
                <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  {/* Provider selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentProvider("bkash")}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                          paymentProvider === "bkash"
                            ? "border-[#E2136E] bg-white ring-2 ring-[#E2136E]/20"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <BkashLogo className="w-7 h-7 rounded-md shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">bKash</span>
                        {paymentProvider === "bkash" && (
                          <svg
                            className="w-4 h-4 text-[#E2136E] ml-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentProvider("nagad")}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                          paymentProvider === "nagad"
                            ? "border-[#EE2A24] bg-white ring-2 ring-[#EE2A24]/20"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <NagadLogo className="w-7 h-7 rounded-md shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">Nagad</span>
                        {paymentProvider === "nagad" && (
                          <svg
                            className="w-4 h-4 text-[#EE2A24] ml-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>


                               {/* Paid to number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment number
                    </label>
                    <input
                      type="text"
                      value={paidToNumber}
                      onChange={e => setPaidToNumber(e.target.value)}
                      placeholder="Copy number"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="e.g. TXN123456"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="text-center text-xs text-gray-400">— or —</div>

                  {/* Screenshot */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment screenshot
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFile(e.target.files?.[0])}
                    />
                    {proofImage ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={proofImage}
                          alt="Proof"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProofImage(undefined);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
                      >
                        Upload screenshot
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Select bKash or Nagad, then provide at least one: transaction ID or screenshot.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                canSubmit
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Submit order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}