// Single source of truth for "what's been covered and what's next" in
// automatic prospect sourcing — replaces the prior markdown batch docs, which
// disagreed with each other about the rotation order. Vertical order matches
// the founder's locked scope: med-spa (proven) → dental → chiropractic → law.
//
// Built as a CROSS PRODUCT rather than a hand-written list (2026-07-26). The
// old hand-list had 14 entries, which at the 1-run/day of the time was two
// weeks of runway — but the send cap is now 45/day and topup starts several
// runs a day, which exhausted it in under a week. Past the end the rotation
// wraps and re-scrapes cities already in `pq:seen`, so curation drops nearly
// everything and each run costs a dollar to enqueue roughly nobody. Metros are
// ordered biggest-first because yield scales with them: the Jacksonville dental
// run returned 120 places (54 kept) while small-market St. Augustine med-spa
// returned 23 (7 kept) for the same price.

export interface SourcingTarget {
  vertical: string;
  city: string;
  searchTerms: string[];
}

const TERMS: Record<string, string[]> = {
  "med-spa": ["med spa", "medical spa"],
  dental: ["dentist", "dental office", "dental clinic"],
  chiropractic: ["chiropractor", "chiropractic clinic"],
  law: ["law firm", "attorney"],
};

// Round-robin order within each city, matching the founder's locked scope.
const VERTICALS = ["med-spa", "dental", "chiropractic", "law"] as const;

// FL + GA metros, roughly descending by business density. We stay inside the
// founder's local/service footprint — no national expansion without a decision.
const CITIES = [
  "Miami, FL",
  "Tampa, FL",
  "Orlando, FL",
  "Atlanta, GA",
  "Jacksonville, FL",
  "Fort Lauderdale, FL",
  "St. Petersburg, FL",
  "West Palm Beach, FL",
  "Hollywood, FL",
  "Coral Springs, FL",
  "Clearwater, FL",
  "Cape Coral, FL",
  "Fort Myers, FL",
  "Sarasota, FL",
  "Naples, FL",
  "Boca Raton, FL",
  "Delray Beach, FL",
  "Port St. Lucie, FL",
  "Melbourne, FL",
  "Kissimmee, FL",
  "Lakeland, FL",
  "Bradenton, FL",
  "Daytona Beach, FL",
  "Gainesville, FL",
  "Ocala, FL",
  "Tallahassee, FL",
  "Pensacola, FL",
  "St. Augustine, FL",
  "Savannah, GA",
  "Marietta, GA",
  "Alpharetta, GA",
  "Roswell, GA",
  "Athens, GA",
  "Augusta, GA",
  "Columbus, GA",
  "Macon, GA",
];

// (vertical, city) pairs already swept by earlier manual `/prospect-city` runs
// or by the live auto-sourcing loop. Re-running these costs money and returns
// almost nothing, since `pq:seen` dedups every business we already hold.
const ALREADY_COVERED = new Set([
  "med-spa|Jacksonville, FL",
  "med-spa|Fort Lauderdale, FL",
  "med-spa|Atlanta, GA",
  "med-spa|St. Augustine, FL",
  "dental|Jacksonville, FL",
]);

// Flattened, ordered target list — `prospect-topup` walks it round-robin via a
// Redis-stored index (pq:rotation:index). All four verticals in one metro run
// back-to-back, then on to the next metro.
export const SOURCING_TARGETS: SourcingTarget[] = CITIES.flatMap((city) =>
  VERTICALS.filter((v) => !ALREADY_COVERED.has(`${v}|${city}`)).map((vertical) => ({
    vertical,
    city,
    searchTerms: TERMS[vertical],
  })),
);

export function targetAt(index: number): SourcingTarget {
  return SOURCING_TARGETS[index % SOURCING_TARGETS.length];
}

/** How many distinct sweeps exist before the rotation repeats a city. */
export const ROTATION_LENGTH = SOURCING_TARGETS.length;

/** One topup may start at most this many scrapes, however deep the hole. */
export const MAX_RUNS_PER_TOPUP = 4;

export interface TopupPlan {
  shouldRun: boolean;
  /** How far below the target the queue is (0 when at or above it). */
  deficit: number;
  /** Scrapes to start now — 0 when shouldRun is false. */
  runsWanted: number;
}

/**
 * Decide how many scrapes today's topup should start. Pure, so the sizing rule
 * is testable without Redis or Apify.
 *
 * The rule that matters: thresholds scale with the SEND CAP. A fixed watermark
 * (the old hardcoded 30) silently stops matching reality the moment the cap
 * moves, which is exactly how the queue ran dry at 45/day.
 */
export function planTopupRuns(input: {
  depth: number;
  watermark: number;
  targetDepth: number;
  estYieldPerRun: number;
}): TopupPlan {
  const { depth, watermark, targetDepth } = input;
  const estYield = Math.max(1, input.estYieldPerRun);

  if (depth >= watermark) return { shouldRun: false, deficit: Math.max(0, targetDepth - depth), runsWanted: 0 };

  const deficit = Math.max(0, targetDepth - depth);
  const runsWanted = Math.min(MAX_RUNS_PER_TOPUP, Math.max(1, Math.ceil(deficit / estYield)));
  return { shouldRun: true, deficit, runsWanted };
}
