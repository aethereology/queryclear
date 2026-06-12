"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

/**
 * Server-renders the real value, then (as progressive enhancement) replays a
 * 0 → `to` count-up when scrolled into view. The static HTML must always
 * contain the true number: no-JS readers and crawlers see the real figure,
 * never a transient 0. Honest-data only: use for the sample-audit score and
 * factual figures, never invented results.
 *
 * Driven by a MotionValue (not React state) so it animates smoothly and
 * avoids set-state-in-effect.
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
  // Start at the real value so SSR markup is truthful; the animation below
  // dips to 0 and counts back up only after hydration + in-view.
  const count = useMotionValue(to);
  const text = useTransform(count, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(count, [0, to], {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration, count]);

  return (
    <motion.span ref={ref} className={`tnum ${className ?? ""}`}>
      {text}
    </motion.span>
  );
}
