"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * The "what the AI reads" panel. Lines reveal one-by-one when scrolled into
 * view, like a readout being typed. Under reduced-motion, all lines show at once.
 */
export function TypingPanel({
  lines,
  className,
}: {
  lines: ReactNode[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={`machine-panel ${className ?? ""}`}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`machine-panel ${className ?? ""}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.22, delayChildren: 0.15 } },
      }}
    >
      {lines.map((line, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.25 } },
          }}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}
