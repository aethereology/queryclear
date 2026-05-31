# Craft & Motion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the existing queryclear site's craft with a new display font, richer type scale, polished cards, and a disciplined Framer Motion animation system (5 scroll patterns + 8 micro-interactions) — keeping palette, copy, and GEO/SEO infra unchanged.

**Architecture:** Pages stay server components. All animation lives in small, single-responsibility **client islands** under `components/`. A central `prefers-reduced-motion` check (Framer Motion's `useReducedMotion`) makes every animated component render its final state instantly when motion is reduced.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, `motion` (Framer Motion's current package), `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-05-31-craft-motion-upgrade-design.md`

---

## Testing approach (read first)

This repo has no test runner and the project brief says not to overbuild. We do **not** add a unit-test framework (YAGNI for a marketing-site craft pass). Each task is verified by:

1. **`npm run lint`** — clean (no new errors/warnings).
2. **`npm run build`** — succeeds (Next.js typechecks during build).
3. **Manual checks** stated per task (run `npm run dev`, view `http://localhost:3000`):
   - Responsive at 375 / 768 / 1024 / 1440 px (no horizontal scroll).
   - Toggle macOS/Windows "reduce motion" (or DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`) and confirm the animated element shows its final state with no motion.
   - Keyboard: Tab to the element, confirm visible focus and operability.

Commit after each task. End every commit message with the Co-Authored-By trailer.

---

## File structure

**New files (client islands):**
- `components/motion.tsx` — `Reveal`, `Stagger`, `StaggerItem`, `ClipReveal`, `LineDraw`.
- `components/TypingPanel.tsx` — hero machine-readout typing.
- `components/CountUp.tsx` — count-up numerals (honest numbers only).
- `components/HumanMachineToggle.tsx` — human/machine crossfade tabs.
- `components/Accordion.tsx` — animated FAQ disclosure.

**Modified:**
- `package.json` — add `motion`.
- `app/layout.tsx` — Bricolage Grotesque display font.
- `app/globals.css` — type scale, card polish, mark orbit, focus halo, reveal fallback.
- `components/ui.tsx` — `Cta` arrow+press; `Mark` orbit class.
- `components/Header.tsx` — link underline; mark orbit.
- `components/LeadForm.tsx` — focus halo; refined submit states.
- `app/page.tsx` — apply reveals, TypingPanel, toggle, line-draw, clip headers, Accordion.
- `app/audit/page.tsx` — CountUp score + reveals.

---

## Task 1: Install `motion` and swap the display font

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css:20` (the `--font-display` token)

- [ ] **Step 1: Install the motion library**

Run:
```bash
npm install motion
```
Expected: `motion` added to `dependencies` in `package.json`; no errors.

- [ ] **Step 2: Replace Fraunces with Bricolage Grotesque in `app/layout.tsx`**

Change the font import block. Replace:
```tsx
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});
```
with:
```tsx
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

Then update the `<html>` className. Replace:
```tsx
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
```
with:
```tsx
      className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
```

- [ ] **Step 3: Point the `--font-display` token at the new font in `app/globals.css`**

Replace line 20:
```css
  --font-display: var(--font-fraunces), Georgia, serif;
```
with:
```css
  --font-display: var(--font-bricolage), "Segoe UI", system-ui, sans-serif;
```

- [ ] **Step 4: Verify**

Run: `npm run lint` → clean. Then `npm run build` → succeeds.
Manual: `npm run dev`, open `http://localhost:3000`, confirm all headings now render in Bricolage Grotesque (geometric grotesque, not the old serif).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/layout.tsx app/globals.css
git commit -m "$(printf 'Swap display font to Bricolage Grotesque; add motion\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 2: Type scale, card polish, and CSS support classes

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add a fluid type scale to the base layer**

In `app/globals.css`, inside `@layer base`, replace the `h1, h2, h3` rule:
```css
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    font-weight: 540;
    letter-spacing: -0.02em;
    line-height: 1.02;
  }
```
with:
```css
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.04;
    text-wrap: balance;
  }
  h1 {
    font-size: clamp(2.6rem, 5.2vw, 4.2rem);
    line-height: 1.0;
  }
  h2 {
    font-size: clamp(2rem, 3.6vw, 3rem);
  }
  /* tabular figures for any numeric data */
  .tnum {
    font-variant-numeric: tabular-nums;
  }
```

- [ ] **Step 2: Refine the card component (squarer, single crisp lift, lime marker)**

In `@layer components`, replace the `.card` and `.card:hover` rules:
```css
  .card {
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-card);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }
  .card:hover {
    transform: translateY(-3px);
    border-color: #17180933;
    box-shadow: 0 14px 30px -18px #17180955;
  }
```
with:
```css
  .card {
    position: relative;
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    border-radius: 10px;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease),
      border-color 0.25s var(--ease);
  }
  .card:hover {
    transform: translateY(-4px);
    border-color: #17180933;
    box-shadow: 0 16px 34px -22px #17180955;
  }
  /* small lime marker that appears on hover — replaces "encircling" decoration */
  .card-marker::before {
    content: "";
    position: absolute;
    left: 1.25rem;
    top: 1.25rem;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--color-lime);
    transform: scale(0);
    transition: transform 0.25s var(--ease);
  }
  .card-marker:hover::before {
    transform: scale(1);
  }
```

- [ ] **Step 3: Add the shared easing token**

In the `@theme` block, after `--radius-card: 14px;` add:
```css
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
```
Note: the `--radius-card` token stays at 14px for the machine-panel; `.card` now hardcodes 10px per the design.

- [ ] **Step 4: Add link-underline, focus halo, and brand-mark orbit classes**

At the end of `@layer components`, add:
```css
  /* animated nav/inline link underline */
  .ulink {
    position: relative;
  }
  .ulink::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    height: 2px;
    width: 100%;
    background: var(--color-lime);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s var(--ease);
  }
  .ulink:hover::after,
  .ulink:focus-visible::after {
    transform: scaleX(1);
  }

  /* soft focus halo for form inputs (in addition to border color) */
  .input-halo:focus {
    border-color: var(--color-pine);
    box-shadow: 0 0 0 3px #12352a1f;
  }

  /* brand mark: lime dot orbits the ring on hover (CSS-only, motion-safe) */
  .mark-orbit .orbit-dot {
    transform-box: fill-box;
    transform-origin: -6px center;
    transition: transform 0.6s var(--ease);
  }
  .mark-orbit:hover .orbit-dot {
    transform: rotate(360deg);
  }
```

- [ ] **Step 5: Add a no-JS / reduced-motion reveal fallback and extend the reduced-motion block**

Replace the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of the file:
```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .fade-up {
    animation: none;
    opacity: 1;
  }
  .card {
    transition: none;
  }
}
```
with:
```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .fade-up {
    animation: none;
    opacity: 1;
  }
  .card,
  .ulink::after,
  .mark-orbit .orbit-dot {
    transition: none;
  }
  .mark-orbit:hover .orbit-dot {
    transform: none;
  }
}
```

- [ ] **Step 6: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual: `npm run dev`; the hero headline is noticeably larger on desktop and scales down cleanly at 375px; cards have a tighter 10px radius.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "$(printf 'Add fluid type scale, polished cards, and motion CSS utilities\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 3: Motion primitives module

**Files:**
- Create: `components/motion.tsx`

- [ ] **Step 1: Create `components/motion.tsx`**

```tsx
"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const reduce = useReducedMotion();
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
  const reduce = useReducedMotion();
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
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Headline lines that slide up from behind a mask. Pass each line as a child. */
export function ClipReveal({
  lines,
  className,
}: {
  lines: ReactNode[];
  className?: string;
}) {
  const reduce = useReducedMotion();
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
  const reduce = useReducedMotion();
  return (
    <span
      className={`relative block h-px w-full bg-line ${className ?? ""}`}
      aria-hidden="true"
    >
      <motion.span
        className="absolute inset-y-0 left-0 block bg-lime"
        style={{ originX: 0 }}
        initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={reduce ? { duration: 0 } : { duration: 1, ease: EASE }}
      />
    </span>
  );
}
```

Note: `LineDraw`'s inner span must be 100% wide for `scaleX` to read as a draw — it inherits the parent's full width via `absolute inset-y-0 left-0` plus `w-full` on a wrapper. To guarantee width, the parent wrapper sets the track height; the lime span sits on top. (Used as a full-width divider in Task 11.)

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds (component is unused so far; build confirms it typechecks).

- [ ] **Step 3: Commit**

```bash
git add components/motion.tsx
git commit -m "$(printf 'Add Framer Motion scroll primitives (Reveal, Stagger, ClipReveal, LineDraw)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 4: TypingPanel (hero machine readout)

**Files:**
- Create: `components/TypingPanel.tsx`

- [ ] **Step 1: Create `components/TypingPanel.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/TypingPanel.tsx
git commit -m "$(printf 'Add TypingPanel hero machine-readout component\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 5: CountUp (honest numbers only)

**Files:**
- Create: `components/CountUp.tsx`

- [ ] **Step 1: Create `components/CountUp.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Counts up from 0 to `to` when scrolled into view. Honest-data only:
 * use for the sample-audit score and factual figures, never invented results.
 */
export function CountUp({
  to,
  suffix = "",
  duration = 1,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {val}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/CountUp.tsx
git commit -m "$(printf 'Add CountUp component for honest numeric figures\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 6: HumanMachineToggle (signature element)

**Files:**
- Create: `components/HumanMachineToggle.tsx`

- [ ] **Step 1: Create `components/HumanMachineToggle.tsx`**

```tsx
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
        className={`rounded-full px-4 py-2 font-mono text-xs transition-colors ${
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
        className="inline-flex rounded-full border border-line bg-paper p-1"
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/HumanMachineToggle.tsx
git commit -m "$(printf 'Add HumanMachineToggle signature crossfade component\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 7: Accordion (animated FAQ)

**Files:**
- Create: `components/Accordion.tsx`

- [ ] **Step 1: Create `components/Accordion.tsx`**

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/Accordion.tsx
git commit -m "$(printf 'Add animated Accordion component for FAQ\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 8: Cta arrow+press and Mark orbit (ui.tsx)

**Files:**
- Modify: `components/ui.tsx`

- [ ] **Step 1: Add the orbit hook class + dot class to `Mark`**

In `components/ui.tsx`, replace the `Mark` function body's `<svg>` so the wrapper class and dot class support the CSS orbit (CSS added in Task 2). Replace:
```tsx
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="10" r="2" fill="#b6f03c" />
    </svg>
```
with:
```tsx
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`mark-orbit overflow-visible ${className}`}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle className="orbit-dot" cx="16" cy="10" r="2" fill="#b6f03c" />
    </svg>
```

- [ ] **Step 2: Add arrow + press to the primary `Cta`**

In `components/ui.tsx`, update the `Cta` component. Replace:
```tsx
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
```
with:
```tsx
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200 active:scale-[0.97]";
  const styles =
    variant === "primary"
      ? "bg-lime text-pine-2 hover:bg-lime-deep"
      : "border border-line text-ink hover:border-ink/40 hover:bg-paper-2";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
      {variant === "primary" && (
        <span
          aria-hidden="true"
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      )}
    </Link>
  );
```
Note: `active:scale-[0.97]` is a CSS transform that respects reduced-motion poorly only if animated; here it is an instant state change on press (acceptable). The arrow slide uses `transition-transform`; users with reduced motion still see the arrow, just without the nudge — acceptable and non-essential.

- [ ] **Step 3: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual: hover any primary CTA — arrow nudges right; press — button scales slightly. Hover the logo mark in the header — the lime dot orbits once.

- [ ] **Step 4: Commit**

```bash
git add components/ui.tsx
git commit -m "$(printf 'Add CTA arrow+press and brand-mark orbit\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 9: Header link underline

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: Add the `ulink` class to desktop nav links**

In `components/Header.tsx`, in the desktop `<nav>` map, replace the link className:
```tsx
              className="text-sm text-muted transition-colors hover:text-ink"
```
with:
```tsx
              className="ulink text-sm text-muted transition-colors hover:text-ink"
```

- [ ] **Step 2: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual: hover a desktop nav item — a lime underline wipes in from the left. Tab to it — underline also shows on focus.

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "$(printf 'Add animated underline to header nav links\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 10: LeadForm focus halo + refined submit states

**Files:**
- Modify: `components/LeadForm.tsx`

- [ ] **Step 1: Add the focus halo class to inputs and textarea**

In `components/LeadForm.tsx`, append `input-halo` to the className on both the `<input>` and the `<textarea>`. The input currently ends with `focus:border-pine`; change both occurrences of:
```tsx
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-pine"
```
to:
```tsx
            className="input-halo w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors"
```
(There are two such elements — the `<input>` and the `<textarea>`. Update both.)

- [ ] **Step 2: Add a spinner and success check to the submit button**

Replace the submit `<button>`:
```tsx
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-pine-2 transition-colors hover:bg-lime-deep disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Book my free AI search audit"}
      </button>
```
with:
```tsx
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-pine-2 transition-colors hover:bg-lime-deep disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2"
            />
            Sending…
          </>
        ) : (
          "Book my free AI search audit"
        )}
      </button>
```
Note: the `success` state already renders a separate confirmation card (existing code), so no checkmark is needed on the button itself — the spinner covers the `submitting` state. `animate-spin` is a continuous loader (allowed by the UX rules for loading indicators).

- [ ] **Step 3: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual: focus any field — pine border + soft halo. Submit the form (it will hit `/api/lead`; with no key configured it may error, which still exercises the spinner before the error state).

- [ ] **Step 4: Commit**

```bash
git add components/LeadForm.tsx
git commit -m "$(printf 'Add input focus halo and submit spinner to lead form\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 11: Apply motion to the home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/page.tsx`, after the existing imports, add:
```tsx
import { Reveal, Stagger, StaggerItem, ClipReveal, LineDraw } from "@/components/motion";
import { TypingPanel } from "@/components/TypingPanel";
import { HumanMachineToggle } from "@/components/HumanMachineToggle";
import { Accordion } from "@/components/Accordion";
```

- [ ] **Step 2: Replace the hero machine panel with TypingPanel**

In the hero section, replace the entire `<div className="machine-panel"> ... </div>` block (the static readout) with:
```tsx
                <TypingPanel
                  lines={[
                    <span key="c" className="text-paper/40"># llms.txt</span>,
                    <span key="b">
                      <span className="k">Business</span>:{" "}
                      <span className="s">Brightleaf Plumbing Co.</span>
                    </span>,
                    <span key="se">
                      <span className="k">Serves</span>:{" "}
                      <span className="s">Riverton metro — 24/7 emergency</span>
                    </span>,
                    <span key="o">
                      <span className="k">Offers</span>:{" "}
                      <span className="s">drain cleaning, water heaters, leaks</span>
                    </span>,
                    <span key="ok" className="mt-3 block text-lime">
                      ✓ clear · structured · citable
                    </span>,
                  ]}
                />
```
Keep the surrounding `<div className="fade-up" ...>` wrapper and the `// what the AI reads about you` label above it.

- [ ] **Step 3: Add the Human ⇄ Machine toggle to the Solution section**

In the Solution `<Section id="solution" ...>`, replace the right-hand column block (the `<div>` containing the two-up "Human view" card and `machine-panel`) with:
```tsx
            <div>
              <HumanMachineToggle
                human={
                  <div className="card p-5">
                    <p className="mono-label mb-2">Human view</p>
                    <p className="font-display text-2xl leading-tight">
                      Fast, leak-free water — same-day in Riverton.
                    </p>
                  </div>
                }
                machine={
                  <div className="machine-panel">
                    <div><span className="k">name</span>: <span className="s">Brightleaf</span></div>
                    <div><span className="k">service</span>: <span className="s">plumbing</span></div>
                    <div><span className="k">area</span>: <span className="s">Riverton</span></div>
                    <div><span className="k">hours</span>: <span className="s">24/7</span></div>
                    <div className="mt-2 text-lime">↳ citable</div>
                  </div>
                }
              />
            </div>
```

- [ ] **Step 4: Wrap the "What we build" grid in Stagger and add the card marker**

In `<Section id="build" ...>`, change the grid container and items. Replace:
```tsx
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeBuild.map((c) => (
              <div key={c.t} className="card flex flex-col p-6">
                <h3 className="text-xl">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
              </div>
            ))}
            <div className="card flex flex-col justify-between bg-pine p-6 text-paper">
```
with:
```tsx
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeBuild.map((c) => (
              <StaggerItem key={c.t} className="card card-marker flex flex-col p-6 pl-9">
                <h3 className="text-xl">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
              </StaggerItem>
            ))}
            <StaggerItem className="card flex flex-col justify-between bg-pine p-6 text-paper">
```
Then find the matching closing of that last card and the grid. Replace:
```tsx
              <div className="mt-4">
                <Cta href={site.primaryCta.href}>Start with a free audit</Cta>
              </div>
            </div>
          </div>
```
with:
```tsx
              <div className="mt-4">
                <Cta href={site.primaryCta.href}>Start with a free audit</Cta>
              </div>
            </StaggerItem>
          </Stagger>
```

- [ ] **Step 5: Replace the "How it works" `<ol>` with a Stagger and add a LineDraw divider**

In `<Section id="how" ...>`, replace:
```tsx
          <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-5">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col bg-paper p-6">
                <span className="font-mono text-sm text-lime-deep">{s.n}</span>
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
```
with:
```tsx
          <div className="mt-8">
            <LineDraw />
          </div>
          <Stagger className="mt-6 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line md:grid-cols-5">
            {steps.map((s) => (
              <StaggerItem key={s.n} className="flex flex-col bg-paper p-6">
                <span className="font-mono text-sm text-lime-deep tnum">{s.n}</span>
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
```
Note: `<Stagger>` renders a `<div>`, so the list is no longer an `<ol>`. This is acceptable for a visual step strip; the headings preserve meaning. If strict list semantics are desired later, that's a separate change.

- [ ] **Step 6: Replace the FAQ `<details>` grid with the Accordion**

In `<Section id="faq" ...>`, replace:
```tsx
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <details key={f.q} className="card p-6">
                <summary className="cursor-pointer list-none font-display text-xl">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
```
with:
```tsx
          <Accordion
            className="mt-10"
            items={faqs.map((f) => ({ q: f.q, a: f.a }))}
          />
```
Note: the existing `faqSchema` JSON-LD is built from the same `faqs` array and stays unchanged — FAQ structured data is preserved.

- [ ] **Step 7: Add ClipReveal to two major section headings**

In `<Section id="problem" ...>`, replace:
```tsx
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            Your customers are asking AI. Is it recommending you?
          </h2>
```
with:
```tsx
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            <ClipReveal
              lines={["Your customers are asking AI.", "Is it recommending you?"]}
            />
          </h2>
```
And in the CTA section near the bottom (`<section id="audit-cta" ...>`), replace:
```tsx
              <h2 className="mt-5 text-4xl text-paper sm:text-5xl">
                Book a free AI search audit.
              </h2>
```
with:
```tsx
              <h2 className="mt-5 text-4xl text-paper sm:text-5xl">
                <ClipReveal lines={["Book a free", "AI search audit."]} />
              </h2>
```

- [ ] **Step 8: Wrap the Deliverables list in a Stagger**

In `<Section id="deliverables" ...>`, replace:
```tsx
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d} className="flex items-center gap-3 border-b border-line pb-3 text-sm">
                  <span className="font-mono text-lime-deep">✓</span>
                  {d}
                </li>
              ))}
            </ul>
```
with:
```tsx
            <Stagger className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <StaggerItem key={d}>
                  <span className="flex items-center gap-3 border-b border-line pb-3 text-sm">
                    <span className="font-mono text-lime-deep">✓</span>
                    {d}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
```

- [ ] **Step 9: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual at `http://localhost:3000`:
- Hero panel types out line-by-line on load/scroll-in.
- Solution section: clicking "Human view" / "Machine view" crossfades; keyboard Tab + Enter works; `aria-selected` toggles.
- "What we build" cards stagger in; hovering shows the lime marker dot.
- "How it works": lime line draws across, steps stagger.
- FAQ: clicking a question eases it open, chevron rotates.
- Section headings (Problem, bottom CTA) reveal line-by-line.
- Emulate `prefers-reduced-motion: reduce` → everything shows final state, no motion.
- 375px: no horizontal scroll; toggle and accordion usable.

- [ ] **Step 10: Commit**

```bash
git add app/page.tsx
git commit -m "$(printf 'Apply motion system to home page\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 12: Apply motion to the audit page

**Files:**
- Modify: `app/audit/page.tsx`

- [ ] **Step 1: Add imports**

After the existing imports in `app/audit/page.tsx`, add:
```tsx
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { CountUp } from "@/components/CountUp";
```

- [ ] **Step 2: Animate the score ring number with CountUp**

In `ScoreRing`, replace:
```tsx
        <span className="font-display text-3xl leading-none">{score}</span>
```
with:
```tsx
        <span className="font-display text-3xl leading-none">
          <CountUp to={score} />
        </span>
```

- [ ] **Step 3: Make the "estimated after fixes" figure a CountUp**

In the header block, replace:
```tsx
                <p className="text-muted">Estimated after fixes: <span className="font-medium text-ink">82</span></p>
```
with:
```tsx
                <p className="text-muted">Estimated after fixes: <span className="font-medium text-ink"><CountUp to={82} /></span></p>
```

- [ ] **Step 4: Stagger the findings list**

In the Findings section, replace:
```tsx
            <div className="mt-8 grid gap-4">
              {findings.map((f) => (
                <div key={f.t} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
```
with:
```tsx
            <Stagger className="mt-8 grid gap-4">
              {findings.map((f) => (
                <StaggerItem key={f.t} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
```
Then replace the matching closing of the findings map/grid:
```tsx
                </div>
              ))}
            </div>
```
(the one that closes the findings `.map`) with:
```tsx
                </StaggerItem>
              ))}
            </Stagger>
```
Note: the inner content of each finding card is unchanged — only the wrapper element name changes from `div` to `StaggerItem`.

- [ ] **Step 5: Wrap the "Before → after" panels in Reveal**

In the before/after section, wrap each of the two `<div>` columns inside the `grid` with `<Reveal>`. Replace:
```tsx
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mono-label mb-2">Before — nothing to cite</p>
```
with:
```tsx
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Reveal>
                <p className="mono-label mb-2">Before — nothing to cite</p>
```
and close that first column — replace:
```tsx
                  <div className="mt-2 text-red-300">✗ AI can&apos;t confidently describe you</div>
                </div>
              </div>
              <div>
                <p className="mono-label mb-2">After — clear &amp; structured</p>
```
with:
```tsx
                  <div className="mt-2 text-red-300">✗ AI can&apos;t confidently describe you</div>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mono-label mb-2">After — clear &amp; structured</p>
```
and close the second column — replace:
```tsx
                  <div className="mt-2 text-lime">✓ clear · structured · citable</div>
                </div>
              </div>
            </div>
```
with:
```tsx
                  <div className="mt-2 text-lime">✓ clear · structured · citable</div>
                </div>
              </Reveal>
            </div>
```

- [ ] **Step 6: Verify**

Run: `npm run lint` → clean. `npm run build` → succeeds.
Manual at `http://localhost:3000/audit`:
- Score ring counts up to 34; "after fixes" counts up to 82.
- Findings stagger in on scroll; before/after panels reveal.
- Emulate reduced-motion → numbers show final values immediately, no motion.
- 375px: no horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add app/audit/page.tsx
git commit -m "$(printf 'Apply count-up and reveals to sample audit page\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 13: Final validation pass

**Files:** none (verification only)

- [ ] **Step 1: Lint and build clean**

Run: `npm run lint` → no errors/warnings. Then `npm run build` → succeeds with no type errors.

- [ ] **Step 2: Full reduced-motion sweep**

In Chrome DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload home and `/audit`. Confirm: no reveals/typing/count-up motion; all content visible and final; toggle and accordion still switch instantly.

- [ ] **Step 3: Keyboard & a11y sweep**

Tab through home + audit. Confirm: visible focus rings everywhere; nav underline on focus; Human/Machine tabs operable with Enter/Space and announce `aria-selected`; FAQ buttons toggle with `aria-expanded`; lead form labels/focus intact.

- [ ] **Step 4: Responsive sweep**

At 375 / 768 / 1024 / 1440 px on home + audit: no horizontal scroll; hero type scales cleanly; grids reflow; sticky header and mobile nav still work.

- [ ] **Step 5: Honesty check**

Confirm no fabricated numbers were introduced. The only count-ups are: audit score (34), after-fixes estimate (82) — both on the clearly-labeled fictional sample — and no "results/average lift" stats exist anywhere.

- [ ] **Step 6: GEO/SEO integrity check**

Confirm unchanged & valid: `/llms.txt`, `/sitemap.xml`, `/robots.txt` still return; JSON-LD (Organization, WebSite, Service, FAQPage) still present in page source; FAQ schema still matches the rendered FAQ items.

- [ ] **Step 7: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "$(printf 'Final validation fixes for craft & motion upgrade\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```
If no fixes were needed, skip this commit.

---

## Self-review notes (author)

- **Spec coverage:** Typography (T1), type scale + cards (T2), all 5 scroll patterns — stagger (T11/T12), clip-reveal (T11), typing (T4/T11), count-up (T5/T12), line-draw (T3/T11); all 8 micro-interactions — CTA (T8), card marker (T2/T11), link underline (T2/T9), accordion (T7/T11), toggle (T6/T11), submit states (T10), mark orbit (T2/T8), field focus (T2/T10). Accessibility/perf (T13). Honesty constraint (T5 doc + T13 check). ✔ all covered.
- **Placeholder scan:** none — every code step shows complete code.
- **Type consistency:** `Reveal`/`Stagger`/`StaggerItem`/`ClipReveal`/`LineDraw` (motion.tsx) used consistently; `TypingPanel({lines})`, `CountUp({to,suffix?})`, `HumanMachineToggle({human,machine})`, `Accordion({items})` signatures match all call sites.
