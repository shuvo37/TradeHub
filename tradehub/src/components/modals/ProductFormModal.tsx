// src/components/modals/ProductFormModal.tsx
import { useRef, useState, useEffect } from "react";
import { Product } from "@/types/profile";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  editingProduct: Product | null;
  tempProduct: Partial<Product>;
  setTempProduct: (p: Partial<Product>) => void;
}

type QuantityMode = "Available" | "Unavailable" | "Numeric";

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProduct,
  tempProduct,
  setTempProduct,
}: Props) {
  const productImageRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initialMode: QuantityMode =
    tempProduct.quantity === "Available"
      ? "Available"
      : tempProduct.quantity === "Unavailable"
      ? "Unavailable"
      : "Numeric";

  const [quantityMode, setQuantityMode] = useState<QuantityMode>(initialMode);
   const [discountInput, setDiscountInput] = useState<string>(
    tempProduct.discount !== undefined ? String(tempProduct.discount) : ""
  );

  // Sync discountInput + quantityMode whenever the modal opens or the product changes
  useEffect(() => {
    if (!isOpen) return;
    setDiscountInput(
      tempProduct.discount !== undefined ? String(tempProduct.discount) : ""
    );
    const mode: QuantityMode =
      tempProduct.quantity === "Available"
        ? "Available"
        : tempProduct.quantity === "Unavailable"
        ? "Unavailable"
        : "Numeric";
    setQuantityMode(mode);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingProduct?.id]);

  if (!isOpen) return null;
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setTempProduct({ ...tempProduct, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleQuantityToggle = (mode: QuantityMode) => {
    setQuantityMode(mode);
    if (mode === "Available") setTempProduct({ ...tempProduct, quantity: "Available" });
    else if (mode === "Unavailable") setTempProduct({ ...tempProduct, quantity: "Unavailable" });
    else setTempProduct({ ...tempProduct, quantity: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto flex flex-col gap-4 p-5 sm:p-6 safe-bottom">
        <div className="flex justify-between items-center sticky top-0 bg-white pb-2 -mt-1">
          <h3 className="text-lg font-bold">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <div className="flex items-center gap-2">
           {editingProduct && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden relative shrink-0"
          onClick={() => productImageRef.current?.click()}
        >
          {tempProduct.image ? (
            <img src={tempProduct.image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-sm font-medium">Click to upload image</p>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={productImageRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <input
          type="text"
          placeholder="Product Name"
          value={tempProduct.name || ""}
          onChange={(e) => setTempProduct({ ...tempProduct, name: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Price (e.g. $50)"
          value={tempProduct.price || ""}
          onChange={(e) => setTempProduct({ ...tempProduct, price: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Availability
          </label>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleQuantityToggle("Available")}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                quantityMode === "Available"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Available
            </button>
            <button
              onClick={() => handleQuantityToggle("Unavailable")}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                quantityMode === "Unavailable"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Unavailable
            </button>
            <button
              onClick={() => handleQuantityToggle("Numeric")}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                quantityMode === "Numeric"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Count
            </button>
          </div>

          {quantityMode === "Numeric" && (
            <input
              type="number"
              placeholder="Enter quantity"
              min="0"
              value={typeof tempProduct.quantity === "number" ? tempProduct.quantity : ""}
              onChange={(e) =>
                setTempProduct({
                  ...tempProduct,
                  quantity: e.target.value ? parseInt(e.target.value) : 0,
                })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>



          <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Discount %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={discountInput}
            onChange={(e) => {
              const raw = e.target.value;
              setDiscountInput(raw);
              if (raw === "") {
                setTempProduct({ ...tempProduct, discount: undefined });
              } else {
                const n = parseInt(raw, 10);
                setTempProduct({
                  ...tempProduct,
                  discount: isNaN(n) ? 0 : Math.min(100, Math.max(0, n)),
                });
              }
            }}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <textarea
          placeholder="Description"
          rows={3}
          value={tempProduct.description || ""}
          onChange={(e) => setTempProduct({ ...tempProduct, description: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

               <div className="flex gap-3 mt-2 sticky bottom-0 bg-white pt-2 safe-bottom">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Product
          </button>
        </div>
      </div>

      {/* Delete confirmation card */}
      {confirmDelete && editingProduct && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90dvh] overflow-y-auto safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with warning icon */}
            <div className="flex flex-col items-center gap-3 text-center px-6 pt-6 pb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You are about to delete{" "}
                  <span className="font-semibold text-gray-800">
                    "{editingProduct.name}"
                  </span>
                </p>
              </div>
            </div>

            {/* Warning body */}
            <div className="px-6 pb-5 flex flex-col gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2.5">
                <svg
                  className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800 leading-relaxed">
                    This product will be permanently removed from your store.
                  </p>
                  <p className="text-[11px] text-red-600 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-200 transition-colors"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}