"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const emptySubscribe = () => () => {};

function useHydratedReducedMotion() {
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return hydrated && reduced;
}

/** Single element that fades + rises into view once. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useHydratedReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Parent that staggers its <StaggerItem> children into view once. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useHydratedReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useHydratedReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Headline lines that slide up from behind a mask. Pass each line as an entry. */
export function ClipReveal({
  lines,
  className,
}: {
  lines: ReactNode[];
  className?: string;
}) {
  const reduce = useHydratedReducedMotion();
  if (reduce) {
    return (
      <span className={className}>
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </span>
    );
  }
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            variants={{
              hidden: { y: "105%" },
              show: { y: 0, transition: { duration: 0.7, ease: EASE } },
            }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** A lime hairline that draws across (scaleX 0→1) when scrolled into view. */
export function LineDraw({ className }: { className?: string }) {
  const reduce = useHydratedReducedMotion();
  return (
    <span
      className={`relative block h-px w-full bg-line ${className ?? ""}`}
      aria-hidden="true"
    >
      <motion.span
        className="absolute inset-y-0 left-0 block w-full bg-lime"
        style={{ originX: 0 }}
        initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={reduce ? { duration: 0 } : { duration: 1, ease: EASE }}
      />
    </span>
  );
}
