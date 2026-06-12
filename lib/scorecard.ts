// The AI-visibility self-scorecard rubric — single source of truth.
// Mirrors the seven layers of the AI Visibility Stack (see app/ai-visibility-stack)
// and the scoring shape of the sample audit (see app/audit). Reusable by the
// /scorecard tool, the $97 kit's self-scoring scorecard, and internal audits.
//
// HONESTY: this measures self-assessed *readiness*, never rankings or citations.
// Weights sum to exactly 100 so an all-"yes" run scores 100 and all-"no" scores 0.
//
// Pure module — no imports, no React — so it stays unit-testable in node:test.

export type LayerId =
  | "entity-clarity"
  | "service-specificity"
  | "proof-density"
  | "local-relevance"
  | "answer-coverage"
  | "machine-readability"
  | "conversion-path";

export type Answer = "yes" | "partial" | "no";

/** Map of question id → answer. Missing entries count as unanswered (0 points). */
export type Answers = Record<string, Answer>;

export type Layer = {
  id: LayerId;
  n: string;
  name: string;
  blurb: string;
  /** Points this layer contributes to the 100-point total. */
  weight: number;
};

export type Question = {
  id: string;
  layer: LayerId;
  text: string;
  /** Slice of the layer's weight this question carries. */
  points: number;
};

/** "Not sure" maps to half credit so honest owners don't over-score themselves. */
export const ANSWER_MULTIPLIER: Record<Answer, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

export const ANSWER_LABELS: Record<Answer, string> = {
  yes: "Yes",
  partial: "Not sure",
  no: "No",
};

// Layer order matches the AI Visibility Stack: a machine has to identify and
// trust you before it can recommend you, so lower layers come first.
export const layers: Layer[] = [
  {
    id: "entity-clarity",
    n: "01",
    name: "Entity Clarity",
    blurb: "Can a machine tell exactly who you are, what you do, and where?",
    weight: 16,
  },
  {
    id: "service-specificity",
    n: "02",
    name: "Service Specificity",
    blurb: "Is each thing you offer stated plainly enough to match a real question?",
    weight: 14,
  },
  {
    id: "proof-density",
    n: "03",
    name: "Proof Density",
    blurb: "Are there enough credible, specific signals to be treated as trustworthy?",
    weight: 14,
  },
  {
    id: "local-relevance",
    n: "04",
    name: "Local Relevance",
    blurb: "Are you clearly tied to the places you actually serve?",
    weight: 14,
  },
  {
    id: "answer-coverage",
    n: "05",
    name: "Answer Coverage",
    blurb: "Does the site directly answer what buyers ask before choosing?",
    weight: 14,
  },
  {
    id: "machine-readability",
    n: "06",
    name: "Machine Readability",
    blurb: "Can engines actually crawl, parse, and summarize the site?",
    weight: 18,
  },
  {
    id: "conversion-path",
    n: "07",
    name: "Conversion Path",
    blurb: "Once someone lands, is the next step obvious and easy?",
    weight: 10,
  },
];

// Plain-English, self-answerable questions. Per-layer points sum to the layer
// weight; all layers sum to 100. Keep questions honest and concrete.
export const questions: Question[] = [
  // 01 — Entity Clarity (16)
  {
    id: "ec-1",
    layer: "entity-clarity",
    text: "Does your homepage clearly state your business name, what you do, and the area you serve — in plain text (not only a logo or image)?",
    points: 6,
  },
  {
    id: "ec-2",
    layer: "entity-clarity",
    text: "Do you have an About page that explains who you are and who's behind the business?",
    points: 5,
  },
  {
    id: "ec-3",
    layer: "entity-clarity",
    text: "Are your business name, category, and contact details consistent across your website and your Google Business Profile?",
    points: 5,
  },

  // 02 — Service Specificity (14)
  {
    id: "ss-1",
    layer: "service-specificity",
    text: "Does each main service you offer have its own page — not just one combined “Services” list?",
    points: 8,
  },
  {
    id: "ss-2",
    layer: "service-specificity",
    text: "On those pages, do you spell out what each service is, who it's for, and what to expect?",
    points: 6,
  },

  // 03 — Proof Density (14)
  {
    id: "pd-1",
    layer: "proof-density",
    text: "Does your site show real, specific proof — reviews, credentials, certifications, or before/after examples?",
    points: 6,
  },
  {
    id: "pd-2",
    layer: "proof-density",
    text: "Are the people or qualifications behind your work named (licensed staff, years in business, a real team)?",
    points: 4,
  },
  {
    id: "pd-3",
    layer: "proof-density",
    text: "Are reviews or testimonials shown on your own site — not only on third-party platforms?",
    points: 4,
  },

  // 04 — Local Relevance (14)
  {
    id: "lr-1",
    layer: "local-relevance",
    text: "Does your site state the cities, neighborhoods, or service area you cover — in the page text?",
    points: 6,
  },
  {
    id: "lr-2",
    layer: "local-relevance",
    text: "Do you have a verified, complete Google Business Profile that matches your website?",
    points: 5,
  },
  {
    id: "lr-3",
    layer: "local-relevance",
    text: "If you serve multiple areas, do you have genuine location or service-area content (not thin duplicate pages)?",
    points: 3,
  },

  // 05 — Answer Coverage (14)
  {
    id: "ac-1",
    layer: "answer-coverage",
    text: "Does your site answer what buyers ask before choosing — pricing ranges, timing, what to expect, how you're different?",
    points: 8,
  },
  {
    id: "ac-2",
    layer: "answer-coverage",
    text: "Do you have an FAQ section written in plain language?",
    points: 6,
  },

  // 06 — Machine Readability (18)
  {
    id: "mr-1",
    layer: "machine-readability",
    text: "Does your site have structured data (JSON-LD schema) describing your business and services?",
    points: 6,
  },
  {
    id: "mr-2",
    layer: "machine-readability",
    text: "Does your site have a clear, plain-language summary of who you are, what you offer, and where — readable by machines? (An optional llms.txt file is one way to do this.)",
    points: 4,
  },
  {
    id: "mr-3",
    layer: "machine-readability",
    text: "Does each page have its own unique title and meta description?",
    points: 4,
  },
  {
    id: "mr-4",
    layer: "machine-readability",
    text: "Do you have a sitemap.xml and robots.txt, with the site crawlable (not blocking search engines)?",
    points: 4,
  },

  // 07 — Conversion Path (10)
  {
    id: "cp-1",
    layer: "conversion-path",
    text: "Is there an obvious next step (call, book, or contact) visible without scrolling far on your key pages?",
    points: 6,
  },
  {
    id: "cp-2",
    layer: "conversion-path",
    text: "Is your contact or booking form short, accessible, and easy to complete on a phone?",
    points: 4,
  },
];

export type LayerScore = {
  layer: Layer;
  earned: number;
  possible: number;
  /** 0–100 percentage of this layer's points earned. */
  percent: number;
  answered: number;
  total: number;
};

const layerById = new Map(layers.map((l) => [l.id, l]));

function questionsForLayer(layerId: LayerId): Question[] {
  return questions.filter((q) => q.layer === layerId);
}

/** Score a single layer from the current answers. Unanswered questions earn 0. */
export function scoreLayer(answers: Answers, layerId: LayerId): LayerScore {
  const layer = layerById.get(layerId);
  if (!layer) throw new Error(`Unknown layer: ${layerId}`);
  const qs = questionsForLayer(layerId);
  let earned = 0;
  let possible = 0;
  let answered = 0;
  for (const q of qs) {
    possible += q.points;
    const a = answers[q.id];
    if (a) {
      answered += 1;
      earned += q.points * ANSWER_MULTIPLIER[a];
    }
  }
  return {
    layer,
    earned,
    possible,
    percent: possible === 0 ? 0 : Math.round((earned / possible) * 100),
    answered,
    total: qs.length,
  };
}

/** All layer scores, in stack order. */
export function scoreAllLayers(answers: Answers): LayerScore[] {
  return layers.map((l) => scoreLayer(answers, l.id));
}

/** Overall 0–100 readiness score (rounded). Possible total is exactly 100. */
export function scoreTotal(answers: Answers): number {
  const earned = layers.reduce(
    (sum, l) => sum + scoreLayer(answers, l.id).earned,
    0,
  );
  return Math.round(earned);
}

/** Count of questions answered (any value). */
export function answeredCount(answers: Answers): number {
  return questions.reduce((n, q) => (answers[q.id] ? n + 1 : n), 0);
}

export const TOTAL_QUESTIONS = questions.length;

/** Weakest layers by percentage earned, ascending. Stable within ties (stack order). */
export function weakestLayers(answers: Answers, n = 2): LayerScore[] {
  return scoreAllLayers(answers)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.percent - b.s.percent || a.i - b.i)
    .slice(0, n)
    .map((x) => x.s);
}

export type Band = { label: string; note: string };

/** Honest readiness band for a 0–100 score. */
export function band(score: number): Band {
  if (score < 40) {
    return {
      label: "Hard for AI to read",
      note: "Answer engines have little they can confidently use. Several foundational layers need work before you'll surface reliably.",
    };
  }
  if (score < 70) {
    return {
      label: "Partly ready",
      note: "The basics are forming, but gaps low in the stack are holding back everything above them.",
    };
  }
  if (score < 90) {
    return {
      label: "Mostly ready",
      note: "A solid foundation. A few targeted fixes would tighten how clearly engines read and trust you.",
    };
  }
  return {
    label: "Strong",
    note: "Well-structured for AI search. Keep it current — and verify it against your live site with a real audit.",
  };
}

/**
 * Plain-text summary of a completed scorecard, attached to the lead email so a
 * warm lead arrives with context. Kept well under the lead route's 2000-char cap.
 */
export function scoreSummary(answers: Answers): string {
  const total = scoreTotal(answers);
  const all = scoreAllLayers(answers);
  const weakest = weakestLayers(answers, 2)
    .map((s) => `${s.layer.name} (${Math.round(s.earned)}/${s.possible})`)
    .join(", ");
  const perLayer = all
    .map((s) => `${s.layer.name} ${Math.round(s.earned)}/${s.possible}`)
    .join("; ");
  return [
    `[Self-scorecard] Overall AI-visibility readiness: ${total}/100 (${band(total).label}).`,
    `Weakest layers: ${weakest}.`,
    `Per layer: ${perLayer}.`,
    `Self-assessed by the visitor on /scorecard — not a verified audit.`,
  ].join(" ");
}
