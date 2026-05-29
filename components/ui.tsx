import Link from "next/link";
import type { ReactNode } from "react";

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
};

export function Cta({
  href,
  children,
  variant = "primary",
  className = "",
}: CtaProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200";
  const styles =
    variant === "primary"
      ? "bg-lime text-pine-2 hover:bg-lime-deep"
      : "border border-line text-ink hover:border-ink/40 hover:bg-paper-2";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
