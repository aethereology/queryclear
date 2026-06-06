import Link from "next/link";
import type { ReactNode } from "react";

// queryclear brand mark: a ring with a neon-lime dot at its edge.
// Ring uses currentColor so it adapts to context (ink on paper, paper on pine).
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`mark-orbit overflow-visible ${className}`}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle className="orbit-dot" cx="16" cy="10" r="2" fill="#b6f03c" />
    </svg>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function MonoLabel({
  index,
  children,
}: {
  index?: string;
  children: ReactNode;
}) {
  return (
    <p className="mono-label flex items-center gap-2">
      {index && <span className="text-lime-deep">[ {index} ]</span>}
      <span>{children}</span>
    </p>
  );
}

type CtaProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  /** Show the trailing arrow (primary only). Off for compact nav buttons. */
  showArrow?: boolean;
};

export function Cta({
  href,
  children,
  variant = "primary",
  className = "",
  showArrow = true,
}: CtaProps) {
  const base =
    "btn-hex group inline-flex items-center justify-center gap-2 border px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider";
  const styles =
    variant === "primary"
      ? "border-lime bg-lime text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime"
      : "border-line bg-transparent text-ink hover:border-lime hover:bg-lime hover:text-pine-2 active:border-lime active:bg-lime active:text-pine-2 focus-visible:border-lime focus-visible:bg-lime focus-visible:text-pine-2";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
      {variant === "primary" && showArrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1"
        >
          →
        </span>
      )}
    </Link>
  );
}
