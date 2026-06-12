// Goldleaf Aesthetics — the fictional med-spa demo shown publicly at /audit.
// Data extracted verbatim from the original hand-built app/audit/page.tsx so the
// public sample renders identically through the <AuditReport> template.
//
// FICTIONAL. Not a real client (see seed_data.md). Used only to show the format.

import type { AuditReport } from "@/lib/audit-report";

const business = "Goldleaf Aesthetics & Med Spa";
const market = "Westhaven";

export const goldleafDemo: AuditReport = {
  slug: "goldleaf-demo",
  business,
  market,
  sector: "Medical aesthetics",
  scoreAfter: 86,
  variant: "sample",
  demo: true,

  // AI-visibility test prompts (patterns from prompts.md), recorded results.
  visibilityTests: [
    { prompt: `Who are the best med spas in ${market}?`, result: "Not surfaced", note: "Three competitors named; Goldleaf absent." },
    { prompt: `Where can I get Botox near ${market}?`, result: "Not surfaced", note: "Directory and chain results returned." },
    { prompt: `Recommend a trustworthy med spa for fillers in ${market}.`, result: "Not surfaced", note: "No specific local providers named." },
    { prompt: `Tell me about ${business}.`, result: "Vague / wrong", note: "AI invents treatments; can't confirm location or services." },
    { prompt: `Does Goldleaf offer laser hair removal?`, result: "Unknown", note: "No machine-readable service list to cite." },
    { prompt: `Who are the providers at Goldleaf, and are they licensed?`, result: "Unknown", note: "No credentials or medical oversight stated anywhere." },
  ],

  // Scored against the 7 layers of the AI Visibility Stack (each 0–10).
  scorecard: [
    { layer: "entity-clarity", score: 4, finding: "Name and category are on the homepage, but there's no Organization/LocalBusiness schema and no machine-readable business summary." },
    { layer: "service-specificity", score: 3, finding: "Treatments are lumped on one page; injectables aren't split into Botox vs. fillers, so engines can't match specific queries." },
    { layer: "proof-density", score: 2, finding: "No provider credentials, medical oversight, or structured reviews a system can trust — critical for medical aesthetics." },
    { layer: "local-relevance", score: 4, finding: "The city appears only in the footer; no service-area language and no alignment with a Google Business Profile." },
    { layer: "answer-coverage", score: 3, finding: "No FAQ on the questions buyers actually ask — pricing ranges, downtime, safety, what to expect." },
    { layer: "machine-readability", score: 1, finding: "No JSON-LD schema, no machine-readable business summary, and thin metadata — answer engines have almost nothing to parse." },
    { layer: "conversion-path", score: 6, finding: "A 'Book now' button exists but is buried; an AI-referred visitor has no obvious consultation path." },
  ],

  // Prioritized fixes, each tied to the layer it lifts.
  fixes: [
    { sev: "Critical", title: "No structured data (schema)", layer: "Machine Readability", why: "Engines have nothing reliable to read — no LocalBusiness/MedicalBusiness, Service, or FAQPage markup.", fix: "Add JSON-LD for the business, each treatment, and FAQs — using real, verified details only.", effort: "Medium" },
    { sev: "High", title: "No clear business summary", layer: "Machine Readability", why: "The site never clearly summarizes who the business serves, what it offers, where it operates, and which pages matter most.", fix: "Add a clear business profile section in plain language, mark it up with schema — and optionally publish an llms.txt support file that points to key pages.", effort: "Low" },
    { sev: "High", title: "Providers & medical oversight not stated", layer: "Proof Density", why: "For medical aesthetics, trust hinges on who performs treatments — neither patients nor engines can verify licensed injectors or a medical director.", fix: "Add a providers section with real licenses and medical oversight, and mark it up with schema.", effort: "Low" },
    { sev: "High", title: "Generic, lumped service content", layer: "Service Specificity", why: "The treatments page reads like any med spa could have written it, and a single 'Services' list can't match specific queries like 'lip filler' or 'laser hair removal'. Modern search rewards useful, specific, experience-led content.", fix: "Give each treatment its own clear, crawlable page: what it is, who it's for, what to expect, common scenarios, and real process details.", effort: "Medium" },
    { sev: "High", title: "Missing buyer questions", layer: "Answer Coverage", why: "Customers ask about pricing ranges, downtime, pain, and safety before booking. If those answers aren't on the site, search systems and AI summaries have fewer useful details to work with.", fix: "Add FAQs based on real customer questions, grouped by treatment and buying intent, with FAQPage schema.", effort: "Low" },
    { sev: "Medium", title: "Weak local business alignment", layer: "Local Relevance", why: "Local search and AI-powered results rely on clear, consistent business details across the website and Google Business Profile — here the city appears only in the footer.", fix: "State the service area in copy, align services, contact details, category, and FAQs with your Google Business Profile.", effort: "Medium" },
    { sev: "Medium", title: "Thin metadata & buried booking", layer: "Conversion Path", why: "Weak titles/descriptions reduce clarity, and the booking path isn't obvious to an AI-referred visitor.", fix: "Write specific title/description/OG tags per page and surface a clear consultation CTA.", effort: "Low" },
  ],

  machineView: {
    before: [
      "# business summary → none",
      "# schema → none",
      "# treatments → unclear",
      "# providers → unknown",
    ],
    beforeNote: "AI can't confidently describe you",
    after: [
      { k: "Business", v: business },
      { k: "Serves", v: `${market} metro` },
      { k: "Offers", v: "Botox, fillers, laser, facials" },
      { k: "Providers", v: "licensed RN injectors · medical director" },
      { k: "@type", v: "MedicalBusiness" },
    ],
    afterNote: "clear · structured · citable",
  },
};
