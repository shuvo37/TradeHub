import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
};

export function TextField({ label, optional, id, ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#16231F]">
        {label}
        {optional && <span className="ml-1 font-normal text-[#4B5D57]/60">(optional)</span>}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-[#E3DCC8] bg-white px-3.5 py-2.5 text-sm text-[#16231F] placeholder:text-[#4B5D57]/50 outline-none transition focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25"
        {...props}
      />
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  optional?: boolean;
};

export function TextAreaField({ label, optional, id, ...props }: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#16231F]">
        {label}
        {optional && <span className="ml-1 font-normal text-[#4B5D57]/60">(optional)</span>}
      </label>
      <textarea
        id={id}
        rows={3}
        className="w-full resize-none rounded-lg border border-[#E3DCC8] bg-white px-3.5 py-2.5 text-sm text-[#16231F] placeholder:text-[#4B5D57]/50 outline-none transition focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25"
        {...props}
      />
    </div>
  );
}
