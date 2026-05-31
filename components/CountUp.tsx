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
 * Counts up from 0 to `to` when scrolled into view. Honest-data only:
 * use for the sample-audit score and factual figures, never invented results.
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
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(to);
      return;
    }
    const controls = animate(count, to, {
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
