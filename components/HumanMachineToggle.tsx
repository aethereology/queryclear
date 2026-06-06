"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Signature control: crossfades the same content between the human-facing view
 * and the machine-readable view. Real, keyboard-operable tablist with ARIA.
 */
export function HumanMachineToggle({
  human,
  machine,
}: {
  human: ReactNode;
  machine: ReactNode;
}) {
  const [view, setView] = useState<"human" | "machine">("human");
  const reduce = useReducedMotion();
  const id = useId();
  const panelId = `${id}-panel`;

  const tab = (key: "human" | "machine", label: string) => {
    const active = view === key;
    return (
      <button
        type="button"
        role="tab"
        id={`${id}-${key}`}
        aria-selected={active}
        aria-controls={panelId}
        onClick={() => setView(key)}
        className={`border border-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
          active ? "bg-pine text-paper" : "text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="View mode"
        className="inline-flex border border-dashed border-line bg-paper p-1"
      >
        {tab("human", "Human view")}
        {tab("machine", "Machine view")}
      </div>

      <div id={panelId} role="tabpanel" className="relative mt-3 min-h-[7rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === "human" ? human : machine}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
