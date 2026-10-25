import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
export const metadata: Metadata = {
  title: "Automated audit methodology",
  description: "How QueryClear checks public HTML, distinguishes observations from modeled scenarios, and prioritizes evidence-backed recommendations.",
  alternates: { canonical: "/audit-methodology" },
};
const checks = [
  ["Page titles", "Missing titles and repeated title text are review flags. Length checks use 15 and 60 characters as rough heuristics, not search-engine limits or a prediction of truncation."],
  ["Headings and content", "We count H1 headings separately from other headings. Fewer than 200 extracted text characters prompts a low-priority review of the rendered page. It does not prove poor content quality."],
  ["Descriptions and structured data", "We check for a meta description, JSON-LD or microdata, and malformed JSON-LD. Syntax parsing does not validate schema semantics, factual accuracy, or eligibility for enhanced results."],
  ["Discovery files", "A robots.txt absence flag requires an observed 404 or 410 response. Timeouts and access failures are unknown, not evidence of absence. An absent llms.txt is not a readiness defect."],
];
export default function AuditMethodology() {
  return <><Header /><main id="main-content">
    <section className="site-section border-b border-line"><Container className="py-16 sm:py-20">
      <MonoLabel index="method">Evidence before conclusions</MonoLabel>
      <h1 className="mt-5 max-w-3xl">Know what your audit can tell you.</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">An automated preview is a starting point for review. We show what was observed, identify what was modeled, and keep the limits visible.</p>
      <p className="mt-5 text-sm text-muted">Method: free-readiness-preview-v2 · Published October 25, 2026. Each report records the version used; older reports may use v1 or have no recorded version.</p>
    </Container></section>
    <Container className="space-y-12 py-14">
      <section aria-labelledby="scope"><h2 id="scope" className="text-3xl">A bounded public-page review</h2><p className="mt-4 max-w-3xl text-muted">The preview fetches up to five public pages, beginning with your submitted URL and following eligible same-site links. It reads returned HTML without executing JavaScript, signing in, or inspecting your analytics. Your report lists the pages actually fetched and the completion time when recorded. An unreachable page is not evidence that its content is missing.</p></section>
      <section aria-labelledby="checks"><h2 id="checks" className="text-3xl">What the checks observe</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{checks.map(([title, text]) => <article key={title} className="card p-6"><h3 className="text-xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{text}</p></article>)}</div></section>
      <section aria-labelledby="model"><h2 id="model" className="text-3xl">Scenarios are hypotheses</h2><p className="mt-4 max-w-3xl text-muted">A general language model generates up to five buyer questions from the fetched copy and one answer sample per question in the public preview. These are not live queries to ChatGPT, Claude, Google AI Overviews, or other named products. Brand absence in one sample is not a visibility score, citation rate, ranking, or market-share estimate. Model output can change between runs.</p><p className="mt-4 max-w-3xl text-muted">A label of “measured” on a technical recommendation means its source is a deterministic check of fetched HTML. The impact and recommended fix still need human review. Sample drafts and inferred writing style are generated suggestions: verify every business claim before publishing.</p></section>
      <section aria-labelledby="priority"><h2 id="priority" className="text-3xl">How we order next steps</h2><ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 text-muted"><li>Group equivalent actions while retaining their distinct page evidence.</li><li>Order technical observations by configured severity: high, medium, then low. These are triage rules, not measured financial impact.</li><li>Keep modeled content hypotheses at low priority, after measured observations at the same priority.</li><li>Use title order for stable ties and return up to ten actions. Review the full findings list for observations outside that shortlist.</li></ol><p className="mt-4 max-w-3xl text-muted">There is no overall score or scoring weight in this automated preview. The separate self-assessment scorecard and paid human-reviewed audit use their own disclosed methods.</p></section>
      <section aria-labelledby="limits" className="card p-6 sm:p-8"><h2 id="limits" className="text-3xl">What remains outside this preview</h2><p className="mt-4 max-w-3xl text-muted">This is not a full-site crawl, JavaScript rendering audit, accessibility certification, Core Web Vitals measurement, backlink analysis, or verified multi-engine visibility study. No findings does not mean the website is error-free. Reports expire within 24 hours; download a copy if you want to keep it.</p><p className="mt-4 max-w-3xl text-muted">Version 2 retains evidence across pages and treats short HTML, absent descriptions, and absent structured data as low-priority review items. Version 1 used stronger severity for those heuristics. A change in findings across versions may reflect methodology rather than a website change.</p></section>
      <section><h2 className="text-2xl">Reference guidance</h2><ul className="mt-4 space-y-3 text-sm"><li><a className="underline" href="https://developers.google.com/search/docs/appearance/title-link">Google Search Central: title links</a></li><li><a className="underline" href="https://developers.google.com/search/docs/appearance/snippet">Google Search Central: snippets and descriptions</a></li></ul><p className="mt-4 max-w-3xl text-sm text-muted">Character counts are review heuristics. Google may choose different title or snippet text; a particular length does not guarantee how a result appears.</p></section>
      <div className="flex flex-wrap gap-4"><Link href="/free-audit" className="rounded bg-pine px-6 py-3 text-paper">Run a free preview</Link><Link href="/contact" className="rounded border border-line px-6 py-3">Report an inaccurate finding</Link></div>
    </Container>
  </main><Footer /></>;
}
