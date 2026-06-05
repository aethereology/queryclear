// Central site config — single source of truth for metadata, schema, and copy.
// Keep claims honest: no guarantees, no invented details.

export const site = {
  name: "queryclear",
  // Canonical = www (apex 307 → www in production). Decided 2026-06-03; see Decisions.md.
  url: "https://www.queryclear.com",
  tagline: "Get found in AI answers.",
  description:
    "queryclear makes your website easier for search engines and AI answer engines like ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews to crawl, understand, trust, and cite.",
  parentOrg: "Aethelo",
  parentOrgUrl: "https://aethelo.sparkcreativesinc.org",
  // The free audit is the primary action everywhere.
  primaryCta: { label: "Book a free AI search audit", href: "#audit-cta" },
  secondaryCta: { label: "See what we optimize", href: "#solution" },
  email: "info@queryclear.com",
  answerEngines: [
    "ChatGPT",
    "Claude",
    "Perplexity",
    "Gemini",
    "Google AI Overviews",
    "Bing Copilot",
  ],
} as const;
