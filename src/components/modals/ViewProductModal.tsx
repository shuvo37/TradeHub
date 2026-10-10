// src/components/modals/ViewProductModal.tsx
import { Product } from "@/types/profile";

interface Props {
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product, e: React.MouseEvent) => void; // only the owner passes this; visitors get no Edit button
  onOrder: (product: Product) => void;
  extra?: React.ReactNode; // optional block under the description (the search results show who sells the product)
}

export default function ViewProductModal({ product, onClose, onEdit, onOrder, extra }: Props) {
  if (!product) return null;

  const discount = product.discount ?? 0;
  const hasDiscount = discount > 0;

  const renderQuantityBadge = (qty: number | "Available" | "Unavailable") => {
    if (qty === "Available") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Available
        </span>
      );
    }
    if (qty === "Unavailable") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 px-2 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Unavailable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Qty: {qty}
      </span>
    );
  };

  const isOrderable = product.quantity !== "Unavailable";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-56 sm:h-64 bg-gray-100 shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-lg sm:text-xl font-bold">{product.name}</h3>
                       <div className="flex flex-col items-end gap-1 shrink-0">
              {hasDiscount ? (
                <>
                  <span className="text-base sm:text-lg font-semibold text-gray-400 line-through">
                    {product.price}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    {discount}% off
                  </span>
                </>
              ) : (
                <span className="text-base sm:text-lg font-semibold text-blue-600">
                  {product.price}
                </span>
              )}
              {renderQuantityBadge(product.quantity)}
            </div>
            </div>

          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description || "No description provided."}
          </p>

          {extra}

          <div className="flex gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100">
            {onEdit && (
              <button
                onClick={(e) => {
                  onClose();
                  onEdit(product, e);
                }}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
            )}

              <button
                    disabled={!isOrderable}
                    onClick={() => {
                      if (!isOrderable) return;
                      onClose();
                      onOrder(product);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isOrderable
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isOrderable ? "Order" : "Out of Stock"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}