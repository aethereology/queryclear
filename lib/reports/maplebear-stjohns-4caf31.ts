// Maple Bear St. Johns — REAL paid-audit client report (first client, June 2026).
// Every fact below was verified against the live site (maplebearstjohns.com,
// crawled 2026-06-10) or public listings (Yelp, Care.com, maplebearusa.com
// directory). Visibility tests marked "Unknown" are pending the founder's manual
// runs in ChatGPT / Gemini / Bing Copilot and will be recorded when available.
//
// Private deliverable: served only at /reports/maplebear-stjohns-4caf31 —
// noindexed, robots-disallowed, excluded from sitemap + llms.txt.

import type { AuditReport } from "@/lib/audit-report";

const business = "Maple Bear St. Johns";
const market = "St. Johns, FL";

export const report: AuditReport = {
  slug: "maplebear-stjohns-4caf31",
  business,
  market,
  sector: "Bilingual daycare & preschool (6 weeks – 5 years)",
  scoreAfter: 80,
  variant: "client",
  demo: false,
  preparedOn: "June 2026",

  // Recorded AI-visibility tests (patterns from prompts.md), run 2026-06-10
  // via web-grounded answer-engine queries. ChatGPT/Gemini/Copilot pending.
  visibilityTests: [
    {
      prompt: "Who are the best preschools in St. Johns, FL?",
      result: "Not surfaced",
      note: "Goddard, Primrose, KinderCare, Kiddie Academy and San Juan del Rio were named; Maple Bear was absent.",
    },
    {
      prompt: "I need a daycare for my infant in St. Johns, FL — who should I call?",
      result: "Not surfaced",
      note: "KinderCare, The Learning Experience, O2B Kids and Kiddie Academy returned — some with phone numbers — despite Maple Bear serving infants from 6 weeks.",
    },
    {
      prompt: "Recommend a bilingual or Spanish-immersion preschool near St. Johns, FL.",
      result: "Not surfaced",
      note: "Bilingual immersion is the center's core differentiator, yet a competitor (Primrose) was described as 'bilingual' instead.",
    },
    {
      prompt: "Tell me about Maple Bear St. Johns.",
      result: "Surfaced / mixed",
      note: "Branded lookups resolve, but the identity splinters across 'Maple Bear St. Johns', 'Maple Bear Early Learning Center' (Yelp) and 'Maple Bear St Johns Early Learning Center LLC' (Care.com).",
    },
    {
      prompt: "Same prompts in ChatGPT, Gemini & Bing Copilot",
      result: "Unknown",
      note: "Pending manual runs; results will be recorded in this report when available.",
    },
  ],

  // Scored against the 7 layers of the AI Visibility Stack (each 0–10).
  // Headline score derives automatically: 34/70 → 49.
  scorecard: [
    {
      layer: "entity-clarity",
      score: 6,
      finding:
        "Name, category and city appear in plain text on every page, and an About page exists — but the business name varies across the web, no page has an H1, and the schema identifies only a name and URL.",
    },
    {
      layer: "service-specificity",
      score: 4,
      finding:
        "Six programs (Bear Care infants through Junior Kindergarten, Spanish immersion, camps) share one combined Programs page — and the homepage and Programs page contradict each other on Bear Care's age range (6 weeks–24 months vs. 6 weeks–17 months).",
    },
    {
      layer: "proof-density",
      score: 5,
      finding:
        "Real Google reviews render on the homepage (a genuine strength), but educators are described only generically — no named director, no Florida license details, no years-in-operation a system could verify.",
    },
    {
      layer: "local-relevance",
      score: 6,
      finding:
        "Full street address and city sit in the footer of every page and a Google Business Profile exists with reviews — but its listed name doesn't match the site, and no page names the neighborhoods families actually come from.",
    },
    {
      layer: "answer-coverage",
      score: 2,
      finding:
        "No FAQ anywhere on the site. Tuition process, ratios, security, meals, VPK and a typical day — the questions parents ask before touring — are unanswered, so engines have nothing to quote.",
    },
    {
      layer: "machine-readability",
      score: 5,
      finding:
        "robots.txt, sitemap.xml, llms.txt and unique titles/descriptions all exist (auto-generated) — but the schema is a bare Organization with no address, phone, hours or category; no page has an H1; og:type is 'article' sitewide; homepage images lack alt text.",
    },
    {
      layer: "conversion-path",
      score: 6,
      finding:
        "'Book a Tour' is prominent and phone/email are tap-to-call links — but the CTA carries rel=\"nofollow\" on an internal link, and the contact form requires ten fields, which is heavy on a phone.",
    },
  ],

  // Prioritized fixes, each tied to the layer it lifts.
  fixes: [
    {
      sev: "Critical",
      title: "Schema names the business but not the place, category or hours",
      layer: "Machine Readability",
      why: "The site publishes its address, phone and hours, but the JSON-LD tells machines only a name and URL — engines can't confirm what Maple Bear is, where it is, or when it's open.",
      fix: "Replace the bare Organization markup with a Preschool/ChildCare graph carrying the real address, phone, email, hours (6:30 am–6:00 pm), area served, and links to the Facebook, Yelp and Maple Bear USA profiles.",
      effort: "Low",
    },
    {
      sev: "Critical",
      title: "Zero answer content — no FAQ, tuition or enrollment info",
      layer: "Answer Coverage",
      why: "Parents ask about tuition, ratios, security, meals, VPK and the enrollment process before booking a tour — none of it is on the site, so answer engines cite competitors who do publish it.",
      fix: "Add a plain-language FAQ (enrollment steps, hours, ages, what a day looks like, how tuition works) with FAQPage schema.",
      effort: "Medium",
    },
    {
      sev: "High",
      title: "The business name splinters across the web",
      layer: "Entity Clarity",
      why: "'Maple Bear St. Johns' (site), 'Maple Bear Early Learning Center' (Yelp) and 'Maple Bear St Johns Early Learning Center LLC' (Care.com) read as three weak entities instead of one strong one.",
      fix: "Pick one canonical name and align the Google Business Profile, Yelp, Care.com, site footer and social-card metadata to it.",
      effort: "Low",
    },
    {
      sev: "High",
      title: "Six programs share one page — with contradicting age ranges",
      layer: "Service Specificity",
      why: "Queries like 'Spanish immersion preschool St. Johns' have no specific page to land on, and the homepage says Bear Care runs to 24 months while the Programs page says 17 months — a contradiction machines (and parents) notice.",
      fix: "Give each program its own page — who it's for, a typical day, outcomes — and reconcile every age range to one source of truth.",
      effort: "Medium",
    },
    {
      sev: "High",
      title: "No page on the site has an H1",
      layer: "Machine Readability",
      why: "Every page's main headline is an H2 widget, so parsers can't tell the page's topic from its supporting sections.",
      fix: "Set each page's hero heading to H1 in Elementor (one H1 per page; keep section headings as H2).",
      effort: "Low",
    },
    {
      sev: "Medium",
      title: "The 'Book a Tour' button tells crawlers not to follow it",
      layer: "Conversion Path",
      why: "The primary conversion link carries rel=\"nofollow\" — a signal meant for untrusted external links — on the site's own contact page, and the form behind it requires ten fields.",
      fix: "Remove nofollow from internal links and trim the tour form to the essentials (name, contact, child's age), moving the rest to the tour conversation.",
      effort: "Low",
    },
    {
      sev: "Medium",
      title: "Generic team description; proof is thinner than reality",
      layer: "Proof Density",
      why: "Real Google reviews already render on-site (a strength), but educators are described only as 'highly qualified' — no named director, license details or years operating that a system could verify.",
      fix: "Add a short team section naming the director/owners, the center's Florida childcare license, and certifications already true today (CPR/First Aid).",
      effort: "Low",
    },
    {
      sev: "Medium",
      title: "Social cards mislabel every page, and images carry no alt text",
      layer: "Machine Readability",
      why: "og:type is 'article' sitewide (these are not articles) and homepage images have no alt text — small signals that compound into a blurrier machine picture.",
      fix: "Set og:type to 'website', correct the trailing '-' in the social-card site name, and add descriptive alt text to images.",
      effort: "Low",
    },
  ],

  machineView: {
    before: [
      '# schema → "Organization": name + url only',
      "# address / phone / hours in schema → none",
      "# H1 → missing on every page",
      "# FAQ → none",
      '# og:type → "article"',
    ],
    beforeNote: "A machine sees a name — not a place, a service, or a reason to recommend it",
    after: [
      { k: "Business", v: business },
      { k: "@type", v: "Preschool · ChildCare" },
      { k: "Address", v: "1300 County Rd 210 W, St Johns, FL 32259" },
      { k: "Phone", v: "904-776-6193" },
      { k: "Hours", v: "6:30 am – 6:00 pm" },
      { k: "Programs", v: "infants (6 wks) → Junior K · Spanish immersion · camps" },
      { k: "Proof", v: "Google reviews shown on-site" },
    ],
    afterNote: "clear · located · structured · citable",
  },
};
