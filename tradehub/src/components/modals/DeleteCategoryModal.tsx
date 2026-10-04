// src/components/modals/DeleteCategoryModal.tsx
import { Category } from "@/types/profile";

interface Props {
  category: Category | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteCategoryModal({ category, onClose, onConfirm }: Props) {
  if (!category) return null;

  const productCount = category.products.length;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
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
            <h3 className="text-lg font-bold text-gray-900">Delete Category?</h3>
            <p className="text-sm text-gray-500 mt-1">
              You are about to delete{" "}
              <span className="font-semibold text-gray-800">"{category.name}"</span>
            </p>
          </div>
        </div>

        {/* Warning body */}
        <div className="px-6 pb-5 flex flex-col gap-3">
          {productCount > 0 ? (
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
                  This will permanently delete{" "}
                  <span className="font-bold">
                    {productCount} product{productCount !== 1 ? "s" : ""}
                  </span>{" "}
                  inside this category.
                </p>
                <p className="text-[11px] text-red-600 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">
                This category has no products.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-200 transition-colors"
          >
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
}