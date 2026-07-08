"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Signature control: crossfades the same content between the human-facing view
 * and the machine-readable view. Real, keyboard-operable tablist with ARIA.
 * Both panels stay mounted so the machine-readable demo is present in the
 * server-rendered HTML — the "machine view" is visible to machines.
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

  const tab = (key: "human" | "machine", label: string) => {
    const active = view === key;
    return (
      <button
        type="button"
        role="tab"
        id={`${id}-${key}`}
        aria-selected={active}
        aria-controls={`${id}-panel-${key}`}
        onClick={() => setView(key)}
        className={`border border-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
          active ? "bg-pine text-paper" : "text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    );
  };

  const panel = (key: "human" | "machine", content: ReactNode) => {
    const active = view === key;
    return (
      <motion.div
        role="tabpanel"
        id={`${id}-panel-${key}`}
        aria-labelledby={`${id}-${key}`}
        aria-hidden={!active}
        initial={false}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : -8 }}
        transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={active ? undefined : "pointer-events-none"}
        style={{ gridArea: "1 / 1" }}
      >
        {content}
      </motion.div>
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

      <div className="relative mt-3 grid min-h-[7rem]">
        {panel("human", human)}
        {panel("machine", machine)}
      </div>
    </div>
  );
}
