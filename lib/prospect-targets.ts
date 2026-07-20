// Single source of truth for "what's been covered and what's next" in
// automatic prospect sourcing — replaces the prior markdown batch docs, which
// disagreed with each other about the rotation order. Vertical order matches
// the founder's locked scope: med-spa (proven) → dental → chiropractic → law.
// Med-spa cities exclude Jacksonville / Fort Lauderdale / Atlanta-GA, already
// covered by earlier manual `/prospect-city` runs.

export interface SourcingTarget {
  vertical: string;
  city: string;
  searchTerms: string[];
}

const MED_SPA_TERMS = ["med spa", "medical spa"];
const DENTAL_TERMS = ["dentist", "dental office", "dental clinic"];
const CHIROPRACTIC_TERMS = ["chiropractor", "chiropractic clinic"];
const LAW_TERMS = ["law firm", "attorney"];

// Flattened, ordered target list — `prospect-topup` walks through this
// round-robin via a Redis-stored index (pq:rotation:index). Round-robin
// across verticals (rather than exhausting one vertical first) spreads
// coverage evenly instead of over-indexing on med-spa before dental/
// chiropractic/law get any runway.
export const SOURCING_TARGETS: SourcingTarget[] = [
  { vertical: "med-spa", city: "St. Augustine, FL", searchTerms: MED_SPA_TERMS },
  { vertical: "dental", city: "Jacksonville, FL", searchTerms: DENTAL_TERMS },
  { vertical: "chiropractic", city: "Jacksonville, FL", searchTerms: CHIROPRACTIC_TERMS },
  { vertical: "law", city: "Jacksonville, FL", searchTerms: LAW_TERMS },
  { vertical: "med-spa", city: "Orlando, FL", searchTerms: MED_SPA_TERMS },
  { vertical: "dental", city: "St. Augustine, FL", searchTerms: DENTAL_TERMS },
  { vertical: "chiropractic", city: "St. Augustine, FL", searchTerms: CHIROPRACTIC_TERMS },
  { vertical: "law", city: "St. Augustine, FL", searchTerms: LAW_TERMS },
  { vertical: "med-spa", city: "Tampa, FL", searchTerms: MED_SPA_TERMS },
  { vertical: "dental", city: "Orlando, FL", searchTerms: DENTAL_TERMS },
  { vertical: "chiropractic", city: "Orlando, FL", searchTerms: CHIROPRACTIC_TERMS },
  { vertical: "law", city: "Orlando, FL", searchTerms: LAW_TERMS },
  { vertical: "med-spa", city: "Miami, FL", searchTerms: MED_SPA_TERMS },
  { vertical: "med-spa", city: "Boca Raton, FL", searchTerms: MED_SPA_TERMS },
];

export function targetAt(index: number): SourcingTarget {
  return SOURCING_TARGETS[index % SOURCING_TARGETS.length];
}
