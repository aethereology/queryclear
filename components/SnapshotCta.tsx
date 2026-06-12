"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LeadForm, type InterestOption } from "@/components/LeadForm";

const EASE = [0.22, 1, 0.36, 1] as const;

type SnapshotCtaProps = {
  /** No-JS / crawler fallback destination (a page+anchor where the form lives). */
  href: string;
  children: React.ReactNode;
  /** primary/ghost mirror <Cta>; link renders bare (caller styles via className). */
  variant?: "primary" | "ghost" | "link";
  className?: string;
  /** Show the trailing arrow (primary only). Off for compact nav buttons. */
  showArrow?: boolean;
  /** Preselect the form's "What do you need?" select. "" = "Not sure yet". */
  defaultNeed?: InterestOption | "";
};

// Class strings mirror <Cta> in components/ui.tsx — keep in sync.
const BTN_BASE =
  "btn-hex group inline-flex items-center justify-center gap-2 border px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider";
const BTN_PRIMARY =
  "border-lime bg-lime text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime";
const BTN_GHOST =
  "border-line bg-transparent text-ink hover:border-lime hover:bg-lime hover:text-pine-2 active:border-lime active:bg-lime active:text-pine-2 focus-visible:border-lime focus-visible:bg-lime focus-visible:text-pine-2";

// Hydration detector: false during SSR/first paint, true once on the client
// (the portal target, document.body, only exists then).
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * A snapshot CTA that renders as a real anchor (SEO/no-JS fallback) and, once
 * hydrated, morphs into a full-screen pine panel containing the lead form
 * (motion/react shared-layout `layoutId` animation, portaled to <body>).
 */
export function SnapshotCta({
  href,
  children,
  variant = "primary",
  className = "",
  showArrow = true,
  defaultNeed = "",
}: SnapshotCtaProps) {
  const layoutId = useId();
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevOverflow = useRef("");
  const prevPaddingRight = useRef("");
  const reduce = useReducedMotion();

  function onTriggerClick(e: React.MouseEvent) {
    // Preserve open-in-new-tab/window semantics on the real href.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // Lock scroll BEFORE the panel mounts so the trigger and panel are
    // measured at the same scroll offset (fixed+layout morph stability).
    prevOverflow.current = document.body.style.overflow;
    prevPaddingRight.current = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    // Focus the close button (not the first field — avoids mobile keyboards
    // popping mid-morph). First Tab lands on the name field.
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow.current;
      document.body.style.paddingRight = prevPaddingRight.current;
      trigger?.focus();
    };
  }, [open]);

  function onPanelKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea',
      ),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const triggerClass =
    variant === "link"
      ? className
      : `${BTN_BASE} ${variant === "primary" ? BTN_PRIMARY : BTN_GHOST} ${className}`;

  return (
    <>
      <motion.a
        ref={triggerRef}
        href={href}
        onClick={onTriggerClick}
        layoutId={reduce ? undefined : layoutId}
        className={triggerClass}
      >
        {children}
        {variant === "primary" && showArrow && (
          <span
            aria-hidden="true"
            className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1"
          >
            →
          </span>
        )}
      </motion.a>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                layoutId={reduce ? undefined : layoutId}
                initial={reduce ? { opacity: 0 } : undefined}
                animate={reduce ? { opacity: 1 } : undefined}
                exit={reduce ? { opacity: 0 } : undefined}
                transition={
                  reduce
                    ? { duration: 0.15 }
                    : { layout: { duration: 0.5, ease: EASE } }
                }
                onKeyDown={onPanelKeyDown}
                className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-pine text-paper"
              >
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { delay: 0.28, duration: 0.35, ease: EASE }
                  }
                  className="flex min-h-full flex-col"
                >
                  <div className="pointer-events-none sticky top-0 z-10 flex justify-end p-4 sm:p-6">
                    <button
                      ref={closeBtnRef}
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-dashed border-paper/30 text-paper transition-colors hover:bg-lime hover:text-pine-2 focus-visible:bg-lime focus-visible:text-pine-2"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="square"
                      >
                        <line x1="5" y1="5" x2="15" y2="15" />
                        <line x1="15" y1="5" x2="5" y2="15" />
                      </svg>
                    </button>
                  </div>
                  <div className="mx-auto my-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-2 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-12 md:pb-16 md:pt-2">
                    <div>
                      <p className="mono-label">Free snapshot</p>
                      <h2
                        id={headingId}
                        className="mt-5 text-4xl text-paper sm:text-5xl"
                      >
                        Get your free AI Search Snapshot.
                      </h2>
                      <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                        Tell us about your business and we&apos;ll review your
                        website&apos;s biggest opportunities for modern search:
                        clarity, crawlability, service pages, local signals,
                        and AI-search readiness.
                      </p>
                    </div>
                    <LeadForm defaultNeed={defaultNeed} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
