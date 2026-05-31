"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AccordionItem = { q: string; a: string };

/** Animated FAQ disclosure list. Keyboard-operable buttons with ARIA. */
export function Accordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();

  return (
    <div className={className}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="card mb-4 overflow-hidden">
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left font-display text-xl text-ink"
              >
                <span>{item.q}</span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="shrink-0 text-lime-deep"
                >
                  ▾
                </motion.span>
              </button>
            </h3>
            {/* Answer stays in the DOM always (crawlable); height animates. */}
            <motion.div
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              aria-hidden={!isOpen}
            >
              <p className="px-6 pb-6 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
