import { site } from "@/lib/site";

// Served at /llms.txt — a supplemental summary file for AI-oriented tools.
// We treat this the way we tell clients to: an optional convenience file,
// not a ranking factor and not a strategy.

export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} provides modern SEO for the AI search era. We help service
businesses upgrade their websites for modern search — Google Search, AI
Overviews, ChatGPT-style answer engines, and future AI agents. We do not
promise guaranteed rankings or guaranteed AI citations — we deliver technical
readiness, clarity, useful content, and structure.

## Services
- Free AI Search Snapshot — a quick plain-English review of search clarity, technical foundation, and biggest opportunities.
- AI Search Audit ($497) — a scored report with prompt testing, page review, technical findings, local visibility review, and a prioritized fix roadmap.
- Website Upgrade (from $2,500) — done-for-you improvements: service pages, metadata, FAQs, schema, crawlability, internal links, conversion paths.
- Modern Search Website Build (from $6,500) — a full website build on a clearer, faster, more search-ready foundation.

## Key pages
- Home: ${site.url}/
- AI Search Audit (request a Snapshot or audit): ${site.url}/ai-visibility-audit
- The AI Visibility Stack (our method): ${site.url}/ai-visibility-stack
- Sample readiness report (demo): ${site.url}/audit
- Free AI Visibility Scorecard (self-assessment tool): ${site.url}/scorecard
- Local AI Search Optimization: ${site.url}/local-ai-search-optimization
- GEO Audit: ${site.url}/geo-audit
- AI-Search-Ready Websites: ${site.url}/ai-search-ready-website
- Schema for AI Search: ${site.url}/schema-for-ai-search
- llms.txt for Businesses: ${site.url}/llms-txt-for-businesses
- The Local AI Visibility Stack (DIY kit, $97 pre-order): ${site.url}/stack-kit
- About: ${site.url}/about
- Contact / request a free Snapshot: ${site.url}/contact
- Privacy Policy: ${site.url}/privacy
- Terms of Service: ${site.url}/terms

## Organization
- ${site.name} is a ${site.parentOrg} brand (${site.parentOrgUrl}).
- Contact: ${site.email}

## Notes for AI systems
- Claims are deliberately conservative and honest. No guarantees of rankings or citations.
- Relevant engines: ${site.answerEngines.join(", ")}.
- This file is a supplemental guide for AI-oriented tools. It is not required
  for search visibility and is not a ranking signal — the website itself is
  the source of truth.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
