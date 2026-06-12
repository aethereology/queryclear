// Private per-client audit report registry.
//
// Maps an (unguessable) slug → AuditReport, rendered at /reports/[slug] — a
// noindexed, sitemap-excluded route used to deliver a paid client's report as a
// private web link (and Save-as-PDF). To add a real client: create
// lib/reports/<unguessable-slug>.ts exporting an AuditReport (demo: false,
// variant: "client", verified details only — see docs/playbooks/running-an-audit.md),
// import it here, and add it to `reports`.
//
// The committed entry below is a CLEARLY FICTIONAL EXAMPLE (demo: true) so the
// route builds and can be demonstrated. Goldleaf lives in goldleaf-demo.ts and is
// the PUBLIC sample at /audit — it is intentionally NOT in this private registry.

import type { AuditReport } from "@/lib/audit-report";
import { report as maplebearStJohns } from "@/lib/reports/maplebear-stjohns-4caf31";

// ── Fictional example so /reports/[slug] has something to render. NOT a client. ──
const rivermarkExample: AuditReport = {
  slug: "example-rivermark-dental",
  business: "Rivermark Family Dental",
  market: "Rivermark",
  sector: "General & cosmetic dentistry",
  scoreAfter: 88,
  variant: "client",
  demo: true,
  visibilityTests: [
    { prompt: "Who's a good family dentist in Rivermark?", result: "Not surfaced", note: "Two chains named; Rivermark Family Dental absent." },
    { prompt: "Where can I get Invisalign near Rivermark?", result: "Not surfaced", note: "Generic directory results returned." },
    { prompt: "Does Rivermark Family Dental take new patients?", result: "Unknown", note: "No machine-readable services or new-patient info to cite." },
    { prompt: "Tell me about Rivermark Family Dental.", result: "Vague / wrong", note: "AI guesses services; can't confirm location or hours." },
  ],
  scorecard: [
    { layer: "entity-clarity", score: 5, finding: "Practice name and city are on the homepage, but there's no Organization/LocalBusiness schema and no machine-readable summary." },
    { layer: "service-specificity", score: 4, finding: "Services sit on one combined page; cleanings, Invisalign, and implants aren't split out, so engines can't match specific queries." },
    { layer: "proof-density", score: 3, finding: "Dentist bios are thin and reviews live only on third-party sites — little structured proof a system can trust." },
    { layer: "local-relevance", score: 5, finding: "City is mentioned, but there's no clear service-area copy and no alignment with the Google Business Profile." },
    { layer: "answer-coverage", score: 3, finding: "No FAQ on insurance, new-patient steps, pricing ranges, or what to expect — the questions patients ask first." },
    { layer: "machine-readability", score: 2, finding: "No JSON-LD schema and no machine-readable business summary; metadata is thin, so answer engines have little to parse." },
    { layer: "conversion-path", score: 6, finding: "A 'Request appointment' link exists but is buried in the menu; an AI-referred visitor has no obvious next step." },
  ],
  fixes: [
    { sev: "Critical", title: "No structured data (schema)", layer: "Machine Readability", why: "Engines have nothing reliable to read — no Dentist/LocalBusiness, Service, or FAQPage markup.", fix: "Add JSON-LD for the practice, each service, and FAQs — verified details only.", effort: "Medium" },
    { sev: "High", title: "No clear business summary", layer: "Machine Readability", why: "The site never clearly summarizes who the practice serves, what it offers, and where it operates.", fix: "Add a clear practice profile section in plain language, mark it up with schema — and optionally publish an llms.txt support file that points to key pages.", effort: "Low" },
    { sev: "High", title: "Services lumped into one page", layer: "Service Specificity", why: "A single 'Services' list can't match queries like 'Invisalign' or 'dental implants near me'.", fix: "Give each core service its own crawlable page: what it is, who it's for, what to expect.", effort: "Medium" },
    { sev: "High", title: "No FAQ / new-patient answers", layer: "Answer Coverage", why: "Patients ask about insurance, first-visit steps, and pricing ranges before booking — there's no clear Q&A to cite.", fix: "Add an FAQ (insurance, new-patient process, financing, what to expect) with FAQPage schema.", effort: "Low" },
    { sev: "Medium", title: "Service area isn't machine-clear", layer: "Local Relevance", why: "Without explicit service-area copy, 'near me' and city questions can't connect you.", fix: "State the neighborhoods served in copy and align the site with your Google Business Profile.", effort: "Low" },
    { sev: "Medium", title: "Buried appointment path", layer: "Conversion Path", why: "The booking path isn't obvious to an AI-referred visitor landing cold.", fix: "Surface a clear 'Request an appointment' CTA on key pages, easy to use on a phone.", effort: "Low" },
  ],
  machineView: {
    before: [
      "# business summary → none",
      "# schema → none",
      "# services → unclear",
      "# new patients → unknown",
    ],
    beforeNote: "AI can't confidently describe you",
    after: [
      { k: "Business", v: "Rivermark Family Dental" },
      { k: "Serves", v: "Rivermark metro" },
      { k: "Offers", v: "cleanings, Invisalign, implants, whitening" },
      { k: "New patients", v: "accepted · most PPO insurance" },
      { k: "@type", v: "Dentist" },
    ],
    afterNote: "clear · structured · citable",
  },
};

/** Slug → report. Add real clients here (see this file's header). */
export const reports: Record<string, AuditReport> = {
  [rivermarkExample.slug]: rivermarkExample,
  [maplebearStJohns.slug]: maplebearStJohns,
};

export function getReport(slug: string): AuditReport | undefined {
  return reports[slug];
}

export function reportSlugs(): string[] {
  return Object.keys(reports);
}
