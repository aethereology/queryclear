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
  // The free AI Search Audit is the primary action everywhere — an instant,
  // read-only automated audit at /free-audit (replaced the manual "Snapshot"
  // lead magnet 2026-06-17; see Decisions.md). This is a real page navigation,
  // not an overlay trigger.
  primaryCta: { label: "Run a free AI Search Audit", href: "/free-audit" },
  secondaryCta: { label: "See what we optimize", href: "#solution" },
  // The lead form is now only the higher-intent "edit / rebuild my website"
  // inquiry. The two service offers (Upgrade/Build) open it via <SnapshotCta>;
  // this root-relative anchor is the no-JS/crawler fallback for that overlay.
  inquiryAnchor: "/#audit-cta",
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
  // Public offer ladder (free audit replaced the manual Snapshot 2026-06-17;
  // see Decisions.md). Free Audit is the instant lead magnet; Audit is the
  // paid diagnostic; Upgrade is the main offer; Build is the top tier. "from"
  // prices are floors, not quotes. `need` preselects the lead form's "What do
  // you need?" select when the offer's CTA opens the inquiry overlay (must
  // match LeadForm's interestOptions — enforced by
  // tests/snapshot-overlay.test.mjs). `null` = the CTA navigates to a real
  // route instead of opening the overlay (Free Audit → /free-audit; $497 Audit
  // → its sales page).
  offers: [
    {
      name: "Free AI Search Audit",
      price: "Free",
      desc: "An instant, read-only audit of your site's search clarity, technical foundation, and where AI answer engines can't yet find you.",
      href: "/free-audit",
      cta: "Run a free audit",
      need: null,
    },
    {
      name: "AI Search Audit",
      price: "$497",
      desc: "A scored report, walked through with you live: prompt testing, page review, technical findings, and a prioritized roadmap. The $497 is credited in full toward a Website Upgrade if you go ahead.",
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
      desc: "Done-for-you improvements to the site you have: service pages, metadata, FAQs, schema, crawlability, internal links, and conversion paths. Includes the Local AI Visibility Stack (playbook + templates) free.",
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
  // The $497 AI Search Audit as a purchasable product (self-serve Stripe Checkout
  // on /ai-visibility-audit). Marketing copy lives in `offers[1]`; this is the
  // billing config. Human-delivered service — checkout captures the buyer's site.
  auditProduct: {
    name: "AI Search Audit",
    path: "/ai-visibility-audit",
    priceUsd: 497,
    priceLabel: "$497",
    currency: "usd",
    unitAmount: 49700, // cents, for Stripe
  },
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
  // Recurring offer for the local/service track (added 2026-06-23; see
  // Decisions.md). queryclear's first SUBSCRIPTION product — a human-delivered
  // monthly retainer that keeps a site's modern-search readiness from drifting
  // after an upgrade. Distinct from the agentic B2B `operator`: this is
  // human-delivered, local, and self-serve. Self-serve Stripe Checkout in
  // `subscription` mode (see app/api/checkout/route.ts). Honest framing only:
  // we report what we measure; we never guarantee rankings or AI citations.
  carePlan: {
    name: "AI Search Care Plan",
    path: "/care-plan",
    priceUsd: 997,
    priceLabel: "$997/month",
    currency: "usd",
    unitAmount: 99700, // cents, for Stripe
    interval: "month",
    // What a month of the plan includes. Concrete and fulfillable — no outcome
    // promises. Rendered on /care-plan.
    includes: [
      {
        title: "A monthly re-audit",
        desc: "We re-score your site across the seven readiness layers each month, so you can see exactly what moved and what's next.",
      },
      {
        title: "Up to two updates a month",
        desc: "Small content or schema changes applied to your live site as search and AI systems shift — handled for you, no queue.",
      },
      {
        title: "A measured score + citation watch",
        desc: "We track your readiness score and how AI answer engines describe your business, and report what we actually find — no guesswork.",
      },
      {
        title: "A real person on call",
        desc: "Reply to any report and a person answers — priority over one-off requests, with no extra ticket system.",
      },
    ],
    terms:
      "$997/month, billed monthly. Cancel anytime — no contract and no cancellation fee. We report what we measure; we do not guarantee rankings or AI citations.",
  },
  // Second track (added 2026-06-15; see Decisions.md). queryclear's recurring
  // "operator" offering for B2B SaaS teams: an agent that does the modern-search
  // work continuously while a human approves every action. The product is in
  // EARLY ACCESS — sold as a founder-led design-partner program, delivered with a
  // human in the loop while the autonomous loop hardens. Honest framing only: the
  // agent proposes and a person approves (Review mode); it does not edit live sites
  // unattended. No public monthly price yet — early access / talk to us.
  operator: {
    name: "AI Search Operator",
    // One-liner reused on the homepage two-track band, the page hero, and nav.
    tagline:
      "An agent that does the modern-search work continuously — and you approve every move.",
    status: "Early access",
    forWho: "B2B SaaS teams",
    path: "/ai-search-operator",
    // The operator ask is its own embedded form (NOT the Snapshot overlay, whose
    // copy is Snapshot-specific). Preselects this interest in the lead form.
    interest: "AI Search Operator (early access)",
    cta: { label: "Request early access", href: "/ai-search-operator#early-access" },
  },
} as const;
