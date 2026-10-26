import type { AuditReportData } from "@/lib/agent-runtime";
// Hand-authored, fictional UI example. No website was crawled and no model was queried.
export const readinessExample: AuditReportData = {
  domain_url: "https://example.com/services",
  page_title: "Fictional service page — illustrative report",
  crawled_urls: ["https://example.com/services"],
  methodology: {
    version: "free-readiness-preview-v2",
    crawled_page_limit: 5,
    visibility_method: "modeled-scenario",
    samples_per_query: 1,
  },
  findings: [
    {
      code: "missing_h1",
      severity: "medium",
      title: "Missing primary heading",
      detail:
        "Illustrative observation: no H1 in the example HTML. This is not a finding from a real crawl.",
      recommendation:
        "Check the rendered page and add a descriptive primary heading if it is missing.",
      url: "https://example.com/services",
    },
  ],
  queries: [
    {
      engine: "model",
      query:
        "Which provider offers this service in my area? (illustrative scenario)",
      cited_count: 0,
      samples: 1,
      citation_frequency: 0,
      confidence_low: 0,
      confidence_high: 1,
      measured: false,
    },
  ],
  recommendations: [
    {
      rank: 1,
      priority: 2,
      kind: "technical",
      title: "Name the service in a primary heading",
      rationale:
        "This fictional example shows how an on-page observation becomes a reviewable action.",
      action:
        "Confirm the heading is absent on the rendered page. If so, add a clear H1 describing the actual service.",
      provenance: "measured",
      evidence:
        "Illustrative technical:missing_h1 — https://example.com/services. Hand-authored example; no live measurement.",
    },
    {
      rank: 2,
      priority: 3,
      kind: "content",
      title: "Check whether your service area is clear",
      rationale:
        "This example models a buyer asking about location. A single scenario does not prove a content gap.",
      action:
        "Compare the question with your real customer inquiries. Add verified coverage details only where useful.",
      provenance: "estimated",
      evidence:
        "Illustrative modeled scenario: Which provider offers this service in my area? No model was queried to create this demonstration.",
    },
  ],
  sample_draft: {
    id: "illustrative-draft",
    title: "A service-page opening to adapt",
    body: "[Service name] for [customers] in [verified service area]. Explain what the service includes, who provides it, and how to request a consultation. Replace every bracket with verified business facts before publication.",
    status: "pending_approval",
  },
  detected_voice: null,
};
