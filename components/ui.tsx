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
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200 active:scale-[0.97]";
  const styles =
    variant === "primary"
      ? "bg-lime text-pine-2 hover:bg-lime-deep"
      : "border border-line text-ink hover:border-ink/40 hover:bg-paper-2";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
      {variant === "primary" && showArrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      )}
    </Link>
  );
}
