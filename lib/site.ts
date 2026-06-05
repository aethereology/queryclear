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
  // T14 demand-test offer. The product is NOT built yet — this is a refundable
  // pre-order to measure demand (GATE-MODEL). Keep every claim honest.
  stackKit: {
    name: "The Local AI Visibility Stack",
    path: "/stack-kit",
    priceUsd: 97,
    priceLabel: "$97",
    currency: "usd",
    unitAmount: 9700, // cents, for Stripe
    shipDays: 30,
    // What's described on the page (built only if it sells).
    contents: [
      {
        title: "The 7-layer playbook",
        desc: "Step-by-step, plain-English — one section per layer of the AI Visibility Stack, from Entity Clarity to Conversion Path.",
      },
      {
        title: "Copy-paste schema templates",
        desc: "Fill-in-the-blanks JSON-LD for Organization, LocalBusiness, Service, and FAQPage — the structured data AI engines read.",
      },
      {
        title: "An llms.txt template",
        desc: "A ready-to-edit llms.txt for your business, plus exactly where to put it so answer engines can find it.",
      },
      {
        title: "The AI-visibility prompt set",
        desc: "The exact prompts to ask ChatGPT, Claude, Perplexity, and Gemini so you can see how they describe your business today.",
      },
      {
        title: "A self-scoring scorecard",
        desc: "The same 100-point rubric we use, so you can grade your own site across all seven layers.",
      },
      {
        title: "A service-page structure template",
        desc: "The page layout that reads cleanly to AI systems and gives a visitor an obvious next step.",
      },
    ],
    terms:
      "Founding pre-order. The Local AI Visibility Stack ships within 30 days of purchase. Full refund anytime before delivery — just email us. If we miss 30 days, we refund you automatically.",
  },
} as const;
