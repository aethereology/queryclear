import type { AuditReportData } from "./agent-runtime";

/** A portable copy of the observed report, never an invented readiness score. */
export function reportAsText(report: AuditReportData): string {
  const lines = ["QUERYCLEAR — SEARCH READINESS PREVIEW", report.domain_url, report.page_title,
    `Completed: ${report.audited_at ?? "Not recorded"}`, "",
    "SCOPE", "A limited public-page review. Modeled scenarios are hypotheses, not live engine measurements.",
    ...(report.crawled_urls ?? []).map(url => `Page: ${url}`), "", "PRIORITIZED ACTIONS"];
  for (const r of report.recommendations) lines.push(
    `${r.rank}. ${r.title} [${r.provenance}]`, `Why: ${r.rationale}`, `Action: ${r.action}`, `Evidence: ${r.evidence}`, "");
  lines.push("TECHNICAL FINDINGS");
  for (const f of report.findings) lines.push(`[${f.severity}] ${f.title}`, f.detail, `Fix: ${f.recommendation}`, `Source: ${f.url ?? "Not recorded"}`, "");
  lines.push("ANSWER SCENARIOS");
  for (const q of report.queries) lines.push(`${q.query}: ${q.cited_count}/${q.samples} samples (${q.measured ? "measured" : "modeled; not a live engine test"})`);
  if (report.sample_draft) lines.push("", "ILLUSTRATIVE DRAFT — VERIFY EVERY BUSINESS CLAIM", report.sample_draft.body);
  return lines.join("\n");
}

export function reportFilename(domain: string): string {
  try { return `queryclear-${new URL(domain).hostname.replace(/[^a-z0-9.-]/gi, "-")}.txt`; }
  catch { return "queryclear-report.txt"; }
}
