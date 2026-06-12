// Central site config — single source of truth for metadata, schema, and copy.
// Keep claims honest: no guarantees, no invented details.

export const site = {
  name: "queryclear",
  // Canonical = www (apex 307 → www in production). Decided 2026-06-03; see Decisions.md.
  url: "https://www.queryclear.com",
  tagline: "Modern SEO for the AI search era.",
  description:
    "queryclear helps service businesses upgrade their websites for modern search — clearer service pages, crawlability, metadata, schema, local signals, and AI-search readiness across Google, ChatGPT, Claude, Perplexity, Gemini, and Bing Copilot.",
  parentOrg: "SparkCreatives Inc.",
  parentOrgUrl: "https://sparkcreativesinc.org",
  // The free Snapshot is the primary action everywhere. (Renamed from "free
  // audit" 2026-06-11 — "audit" is now the paid product.) The href is the
  // no-JS/crawler fallback — hydrated snapshot CTAs open the <SnapshotCta>
  // overlay instead. Root-relative so it works from any route.
  primaryCta: { label: "Get your free AI Search Snapshot", href: "/#audit-cta" },
  secondaryCta: { label: "See what we optimize", href: "#solution" },
  // Public contact. info@ remains a live forwarding alias; hello@ is the
  // public-facing address (deliverability update 2026-06-10).
  email: "hello@queryclear.com",
  answerEngines: [
    "ChatGPT",
    "Claude",
    "Perplexity",
    "Gemini",
    "Google AI Overviews",
    "Bing Copilot",
  ],
  // Public offer ladder (decided 2026-06-11; see Decisions.md). Free Snapshot
  // is the lead magnet; Audit is the paid diagnostic; Upgrade is the main
  // offer; Build is the top tier. "from" prices are floors, not quotes.
  // `need` preselects the lead form's "What do you need?" select when the
  // offer's CTA opens the Snapshot overlay (must match LeadForm's
  // interestOptions — enforced by tests/snapshot-overlay.test.mjs). `null` =
  // the CTA navigates instead of opening the overlay ($497 Audit needs its
  // sales page before the ask).
  offers: [
    {
      name: "Free AI Search Snapshot",
      price: "Free",
      desc: "A quick plain-English review of your website's search clarity, technical foundation, and biggest opportunities.",
      href: "#audit-cta",
      cta: "Request my free Snapshot",
      need: "Free AI Search Snapshot",
    },
    {
      name: "AI Search Audit",
      price: "$497",
      desc: "A deeper scored report: prompt testing, page review, technical findings, local visibility review, and a prioritized fix roadmap.",
      href: "/ai-visibility-audit",
      cta: "See what's in the audit",
      need: null,
    },
    // Tiers 3/4 point at the lead form (the ladder renders directly above it
    // on the homepage). Dedicated /services offer pages are deferred until we
    // have real client content; the form's "interest" field captures which
    // offer pulled them. See Decisions.md 2026-06-11.
    {
      name: "Website Upgrade",
      price: "from $2,500",
      desc: "Done-for-you improvements to the site you have: service pages, metadata, FAQs, schema, crawlability, internal links, and conversion paths.",
      href: "#audit-cta",
      cta: "Upgrade my site",
      need: "Website Upgrade",
    },
    {
      name: "Modern Search Website Build",
      price: "from $6,500",
      desc: "A full website build for businesses that need a clearer, faster, more useful, and more search-ready foundation.",
      href: "#audit-cta",
      cta: "Talk about a build",
      need: "Modern Search Website Build",
    },
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
        desc: "Fill-in-the-blanks JSON-LD for Organization, LocalBusiness, Service, and FAQPage — the structured data search systems read.",
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
        desc: "The page layout that reads cleanly to people and search systems, and gives a visitor an obvious next step.",
      },
      {
        title: "An optional llms.txt template",
        desc: "A ready-to-edit llms.txt support file — an optional extra for AI-oriented tools, not a ranking factor, with notes on when it's worth publishing.",
      },
    ],
    terms:
      "Founding pre-order. The Local AI Visibility Stack ships within 30 days of purchase. Full refund anytime before delivery — just email us. If we miss 30 days, we refund you automatically.",
  },
} as const;
