"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#16231F]">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className="w-full rounded-lg border border-[#E3DCC8] bg-white px-3.5 py-2.5 pr-11 text-sm text-[#16231F] placeholder:text-[#4B5D57]/50 outline-none transition focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25"
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#4B5D57] hover:text-[#16231F]"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.3 3.5M6.2 6.6C4.4 7.9 3 9.9 2 12c1 2.5 5 7 10 7 1.3 0 2.6-.3 3.7-.8" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
