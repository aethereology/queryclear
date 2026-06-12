"use client";

import { motion, useReducedMotion } from "motion/react";

const nodes = [
  { id: "site", x: 52, y: 84, label: "SITE", tone: "lime" },
  { id: "services", x: 166, y: 42, label: "SERVICES", tone: "paper" },
  { id: "local", x: 164, y: 126, label: "LOCAL", tone: "paper" },
  { id: "schema", x: 286, y: 84, label: "SCHEMA", tone: "lime" },
  { id: "answers", x: 404, y: 84, label: "ANSWERS", tone: "paper" },
] as const;

const traces = [
  "M72 84 H106 V42 H144",
  "M72 84 H106 V126 H142",
  "M188 42 H232 V84 H264",
  "M188 126 H232 V84 H264",
  "M308 84 H382",
] as const;

export function HeroCircuit() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="machine-panel relative mb-4 overflow-hidden p-0">
      <div className="grid-texture absolute inset-0 opacity-20" />
      <div className="relative flex items-center justify-between border-b border-dashed border-white/15 px-4 py-2">
        <span className="mono-label text-paper/55">signal map</span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-lime">
          crawl path active
        </span>
      </div>
      <svg
        viewBox="0 0 456 168"
        role="img"
        aria-label="A circuit map showing website signals flowing through services, local details, schema, and answers."
        className="relative block h-auto w-full"
      >
        <rect x="0" y="0" width="456" height="168" fill="transparent" />
        <g stroke="rgba(255,255,255,0.12)" strokeWidth="1">
          {Array.from({ length: 12 }).map((_, index) => (
            <path key={`v-${index}`} d={`M${index * 40 + 8} 0 V168`} />
          ))}
          {Array.from({ length: 5 }).map((_, index) => (
            <path key={`h-${index}`} d={`M0 ${index * 36 + 12} H456`} />
          ))}
        </g>

        {traces.map((path, index) => (
          <g key={path}>
            <motion.path
              d={path}
              fill="none"
              stroke="rgba(182,240,60,0.22)"
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth="2"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={reduceMotion ? undefined : { pathLength: 1 }}
              transition={{ duration: 0.75, delay: index * 0.08 }}
            />
            {!reduceMotion && (
              <motion.path
                d={path}
                fill="none"
                stroke="rgba(182,240,60,0.9)"
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth="3"
                strokeDasharray="20 120"
                initial={{ strokeDashoffset: 140 }}
                animate={{ strokeDashoffset: -140 }}
                transition={{
                  duration: 2.3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.24,
                }}
              />
            )}
          </g>
        ))}

        {nodes.map((node, index) => (
          <motion.g
            key={node.id}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
          >
            <rect
              x={node.x - 22}
              y={node.y - 18}
              width="44"
              height="36"
              fill={node.tone === "lime" ? "rgba(182,240,60,0.16)" : "rgba(247,244,238,0.08)"}
              stroke={node.tone === "lime" ? "rgba(182,240,60,0.85)" : "rgba(247,244,238,0.32)"}
              strokeWidth="1.5"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill={node.tone === "lime" ? "#b6f03c" : "#e9d9a6"}
            />
            <text
              x={node.x}
              y={node.y + 31}
              textAnchor="middle"
              className="fill-[rgba(247,244,238,0.58)] font-mono text-[9px] tracking-[0.18em]"
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
