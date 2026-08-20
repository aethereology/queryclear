import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const WORDMARK_PATHS = [
  "M 408.944,61.728 H 395.92 V 78.272 C 387.648,65.952 374.624,59.44 358.08,59.44 c -28.688,0 -50.688,21.824 -50.688,50.688 0,28.16 22.176,50.16 51.04,50.16 16.016,0 29.04,-6.512 37.488,-18.832 v 50.336 h 13.024 z m -50.336,9.68 c 21.824,0 38.192,16.72 38.192,39.072 0,21.12 -16.896,37.84 -38.192,37.84 -21.648,0 -38.016,-16.368 -38.016,-38.192 0,-22.176 16.192,-38.72 38.016,-38.72 z",
  "m 513.06371,61.728 h -13.024 v 49.456 c 0,11.792 -1.76,19.184 -5.808,25.168 -5.456,7.744 -14.08,11.968 -24.288,11.968 -10.736,0 -19.712,-4.4 -24.112,-12.144 -2.992,-4.928 -4.576,-12.672 -4.576,-22.528 v -51.92 h -13.024 v 51.92 c 0,14.432 2.288,24.112 7.568,31.328 7.216,10.032 18.832,15.312 33.264,15.312 14.96,0 24.464,-5.28 30.976,-17.248 V 158 h 13.024 z",
  "m 626.68767,114.176 c 0,-13.2 -1.76,-21.296 -6.512,-29.744 -8.624,-15.488 -25.344,-24.992 -43.824,-24.992 -27.984,0 -49.808,22 -49.808,49.984 0,28.512 22.352,50.864 50.864,50.864 20.944,0 39.776,-13.552 46.816,-33.968 h -13.552 c -5.456,13.2 -19.008,22 -33.616,22 -19.888,0 -36.432,-15.136 -37.488,-34.144 z m -86.768,-11.792 c 3.52,-18.48 18.128,-30.976 36.432,-30.976 18.656,0 32.736,11.616 37.312,30.976 z",
  "m 639.63961,158 h 13.024 v -56.144 c -0.176,-17.424 9.504,-28.16 27.28,-29.568 V 59.44 c -13.904,0.704 -22.176,5.456 -27.28,16.016 V 61.728 h -13.024 z",
  "m 705.21573,191.792 h 13.904 l 55.616,-130.064 h -13.904 l -32.56,76.736 -30.448,-76.736 h -14.256 l 37.312,93.104 z",
  "m 858.79154,129.664 c -10.032,13.376 -19.184,18.656 -33.088,18.656 -21.472,0 -38.544,-16.896 -38.544,-38.368 0,-21.648 16.72,-38.544 38.192,-38.544 14.256,0 26.048,6.864 33.44,19.536 h 14.608 c -7.744,-19.36 -26.224,-31.504 -47.872,-31.504 -28.864,0 -51.568,22.176 -51.568,50.16 0,28.688 22.88,50.688 52.448,50.688 11.968,0 23.056,-3.696 32.032,-10.912 6.16,-4.928 9.856,-9.68 15.136,-19.712 z",
  "m 885.99938,158 h 13.024 V 27.936 h -13.024 z",
  "m 1012.6475,114.176 c 0,-13.2 -1.76,-21.296 -6.512,-29.744 -8.62399,-15.488 -25.34399,-24.992 -43.82399,-24.992 -27.984,0 -49.808,22 -49.808,49.984 0,28.512 22.352,50.864 50.864,50.864 20.944,0 39.77599,-13.552 46.81599,-33.968 h -13.55199 c -5.456,13.2 -19.008,22 -33.616,22 -19.888,0 -36.432,-15.136 -37.488,-34.144 z m -86.76799,-11.792 c 3.52,-18.48 18.128,-30.976 36.432,-30.976 18.656,0 32.736,11.616 37.312,30.976 z",
  "m 1123.8074,61.728 h -13.024 V 78.8 c -9.68,-13.376 -21.296,-19.36 -38.016,-19.36 -28.864,0 -50.688,21.824 -50.688,50.688 0,28.864 22,50.16 51.744,50.16 16.368,0 26.576,-5.28 36.96,-19.184 V 158 h 13.024 z m -50.688,9.68 c 21.296,0 37.664,16.544 37.664,38.016 0,22 -16.192,38.896 -36.96,38.896 -21.824,0 -38.544,-17.072 -38.544,-39.072 0,-20.944 16.896,-37.84 37.84,-37.84 z",
  "m 1140.9834,158 h 13.024 v -56.144 c -0.176,-17.424 9.504,-28.16 27.28,-29.568 V 59.44 c -13.904,0.704 -22.176,5.456 -27.28,16.016 V 61.728 h -13.024 z",
] as const;

function MarkArtwork({ ink = "currentColor" }: { ink?: string }) {
  return (
    <>
      <path d="M196 64H157A67 67 0 1 0 157 142H196A103 103 0 1 1 196 64Z" fill={ink} />
      <path d="M155 142H195L174 164L215 209H179L133 165Z" fill={ink} />
      <path d="M162 83H200V121H162Z" fill="#abdb24" />
    </>
  );
}

// queryclear brand mark: the open Q / query-field symbol with a lime cursor.
// The Q uses currentColor so it adapts to light and dark brand surfaces.
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      className={`queryclear-mark overflow-visible ${className}`}
      aria-hidden="true"
    >
      <MarkArtwork />
    </svg>
  );
}

export function Logo({
  className = "",
  ink = "currentColor",
  style,
}: {
  className?: string;
  ink?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 1135 220"
      className={className}
      style={style}
      role="img"
      aria-label="queryclear"
    >
      <MarkArtwork ink={ink} />
      <g transform="matrix(0.94 0 0 1 18 0)" fill={ink}>
        {WORDMARK_PATHS.map((path) => <path key={path} d={path} />)}
      </g>
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
