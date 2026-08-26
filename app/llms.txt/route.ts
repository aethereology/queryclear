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
- Free AI Search Audit — an automated, read-only readiness preview of public website content. Automated and modeled output is labeled; it is not a verified multi-engine audit.
- AI Search Audit ($497) — one public website, up to 10 URLs, and up to 12 total prompt-engine observations distributed across up to three named engines selected at kickoff. Each prompt × engine check consumes one observation. Includes evidence-linked scoring, a prioritized roadmap, and a 45-minute walkthrough. Delivery is within seven business days after complete intake. The $497 may be credited once toward a $2,500+ Website Upgrade or Website Build for the same site when contracted within 60 days after report delivery.
- Website Upgrade (from $2,500) — a fixed-scope sprint for one existing site and up to five priority pages, with technical SEO, structured data, internal links, analytics checks, conversion paths, QA, and handoff.
- Modern Search Website Build (from $6,500) — one client-owned, one-language marketing site with up to seven core pages, technical SEO, analytics connections, lead capture, launch QA, and handoff.
- AI Search Care Plan ($997/month) — eligibility-review-only monthly maintenance for sites with a sound baseline: re-audit, up to two defined non-rollover updates, and documented answer samples. Month-to-month; no ranking or citation guarantee.

## Seven-layer method
1. Entity Clarity
2. Service Specificity
3. Proof Density
4. Local Relevance
5. Answer Coverage
6. Machine Readability
7. Conversion Path

Paid reports score each layer 0–10 and normalize the points earned out of 70 to a 0–100 readiness score. The free self-scorecard uses disclosed question weights totaling 100 and is labeled as self-assessed.

## Key pages
- Home: ${site.url}/
- AI Search Audit (request an audit): ${site.url}/ai-visibility-audit
- Website Upgrade: ${site.url}/website-upgrade
- The AI Visibility Stack (our method): ${site.url}/ai-visibility-stack
- Sample readiness report (demo): ${site.url}/audit
- Free AI Visibility Scorecard (self-assessment tool): ${site.url}/scorecard
- Local AI Search Optimization: ${site.url}/local-ai-search-optimization
- AI Search Optimization for Med Spas: ${site.url}/med-spa-ai-search-optimization
- GEO Audit: ${site.url}/geo-audit
- AI-Search-Ready Websites: ${site.url}/ai-search-ready-website
- Schema for AI Search: ${site.url}/schema-for-ai-search
- llms.txt for Businesses: ${site.url}/llms-txt-for-businesses
- AI Search Care Plan (monthly retainer, $997/mo): ${site.url}/care-plan
- About: ${site.url}/about
- Contact: ${site.url}/contact
- Free automated readiness preview: ${site.url}/free-audit
- Privacy Policy: ${site.url}/privacy
- Terms of Service: ${site.url}/terms

## Organization
- ${site.legal.relationship}
- Legal operator: ${site.legal.operator}, ${site.legal.entityType}; EIN ${site.legal.taxId}.
- Business address: ${site.legal.address.street}, ${site.legal.address.city}, ${site.legal.address.region} ${site.legal.address.postalCode}, United States.
- ${site.legal.serviceFeeNotice}
- Founder and lead operator: ${site.founder.name}.
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
