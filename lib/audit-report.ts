// Audit report data model — single source of truth for the shape of a queryclear
// AI-search readiness report. Productizes what we deliver by hand: every audit is
// a typed data object, rendered by <AuditReport> (components/AuditReport.tsx) on
// the public sample (/audit) and on private per-client reports (/reports/[slug]).
//
// Reuses the seven layers from lib/scorecard.ts so the AI Visibility Stack stays a
// single source of truth (layer ids, numbers, names).
//
// HONESTY: scores measure *readiness*, never rankings or citations. Only ever
// populate a report from real, verified client details (see seed_data.md). The one
// committed example (lib/reports/index.ts) is flagged fictional.
//
// Pure module — no React imports — so the helpers stay unit-testable in node:test.

import { layers, type LayerId } from "@/lib/scorecard";

export type Severity = "Critical" | "High" | "Medium";
export type Effort = "Low" | "Medium" | "High";

/** A recorded AI-visibility test: the prompt asked, whether the business surfaced. */
export type VisibilityTest = {
  prompt: string;
  /** Short verdict, e.g. "Not surfaced", "Vague / wrong", "Unknown". */
  result: string;
  note: string;
};

/** One scored layer of the AI Visibility Stack (0–10). n/name derive from scorecard.ts. */
export type LayerFinding = {
  layer: LayerId;
  /** 0–10. */
  score: number;
  finding: string;
};

/** A prioritized fix, tied to the layer it lifts. */
export type Fix = {
  sev: Severity;
  title: string;
  /** Human label of the layer this lifts (kept as free text for report nuance). */
  layer: string;
  why: string;
  fix: string;
  effort: Effort;
};

/** Before→after "what the machine reads" panel. ✗/✓ prefixes are added in markup. */
export type MachineView = {
  /** Plain mono lines for the "before" panel, e.g. "# llms.txt → 404". */
  before: string[];
  /** The single "before" conclusion line (rendered with a ✗). */
  beforeNote: string;
  /** Key/value pairs for the structured "after" panel. */
  after: { k: string; v: string }[];
  /** The single "after" conclusion line (rendered with a ✓). */
  afterNote: string;
};

export type AuditReport = {
  /** URL + registry key. For real clients, use an unguessable slug. */
  slug: string;
  business: string;
  /** Metro / market / service area. */
  market: string;
  /** Sector line shown under the business name, e.g. "Medical aesthetics". */
  sector?: string;
  /** Estimated 0–100 readiness after the recommended fixes (auditor-set). */
  scoreAfter: number;
  visibilityTests: VisibilityTest[];
  /** One entry per layer, in stack order. Score 0–10. */
  scorecard: LayerFinding[];
  fixes: Fix[];
  machineView: MachineView;
  /** Human date string, passed in (Date.now is unavailable at module load). */
  preparedOn?: string;
  /** "sample" = public marketing CTA; "client" = paid-client next-steps close. */
  variant?: "sample" | "client";
  /** When true, show the clearly-labeled fictional-demo banner. */
  demo?: boolean;
};

const layerMetaById = new Map(layers.map((l) => [l.id, l]));

/** The stack metadata (n, name, blurb, weight) for a layer id. */
export function layerMeta(id: LayerId) {
  const meta = layerMetaById.get(id);
  if (!meta) throw new Error(`Unknown layer: ${id}`);
  return meta;
}

/**
 * Current 0–100 readiness derived from the 0–10 layer scores, so a report can't
 * show a headline number inconsistent with its own scorecard. Equal-weighted
 * across however many layers the report scores (normally all seven).
 * Example: Goldleaf demo sums to 23/70 → 33.
 */
export function scoreFromLayers(scorecard: LayerFinding[]): number {
  if (scorecard.length === 0) return 0;
  const sum = scorecard.reduce((acc, f) => acc + f.score, 0);
  return Math.round((sum / (scorecard.length * 10)) * 100);
}

const SEV_RANK: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2 };

/** Sort rank for a severity (Critical first). */
export function sevRank(sev: Severity): number {
  return SEV_RANK[sev];
}

/** Fixes sorted biggest-impact-first (Critical → High → Medium), stable within ties. */
export function sortedFixes(fixes: Fix[]): Fix[] {
  return fixes
    .map((f, i) => ({ f, i }))
    .sort((a, b) => sevRank(a.f.sev) - sevRank(b.f.sev) || a.i - b.i)
    .map((x) => x.f);
}
