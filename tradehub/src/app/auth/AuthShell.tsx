import { ReactNode } from "react";
import { fraunces, inter } from "@/lib/fonts";

const categories = [
  { label: "Electronics", rotate: "-rotate-3" },
  { label: "Fashion", rotate: "rotate-2" },
  { label: "Home & Living", rotate: "-rotate-1" },
  { label: "Books", rotate: "rotate-3" },
  { label: "Handmade", rotate: "-rotate-2" },
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-[#0F3B36] lg:flex`}>
      {/* Brand panel */}
      <div className="relative overflow-hidden px-8 py-12 lg:w-[42%] lg:px-14 lg:py-16">
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <span className={`${fraunces.className} text-3xl tracking-tight text-[#FBF7EE]`}>
              TradeHub
            </span>
            <p className={`${fraunces.className} mt-4 max-w-xs text-2xl leading-snug text-[#FBF7EE]/90 lg:text-3xl`}>
              Sell what you have. Find what you need.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#FBF7EE]/60">
              A shared timeline for your neighborhood&apos;s own little shops —
              no middleman, pay the way you already do.
            </p>
          </div>

          {/* Category tag cluster — decorative, hidden below lg to save vertical space */}
          <div className="mt-10 hidden flex-wrap gap-3 lg:flex">
            {categories.map((c) => (
              <span
                key={c.label}
                className={`${c.rotate} rounded border border-[#FBF7EE]/25 bg-[#FBF7EE]/5 px-3 py-1.5 text-xs text-[#FBF7EE]/70`}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* single deliberate glow accent */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#E8A33D]/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E3DCC8] bg-[#FBF7EE] px-7 py-9 shadow-[0_1px_2px_rgba(15,59,54,0.06)] sm:px-9 sm:py-10">
            <h1 className={`${fraunces.className} text-2xl text-[#16231F]`}>{title}</h1>
            <p className="mt-1.5 text-sm text-[#4B5D57]">{subtitle}</p>

            <div className="mt-7">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-[#FBF7EE]/70">{footer}</p>
        </div>
      </div>
    </div>
  );
}
