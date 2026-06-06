import { site } from "@/lib/site";

// Served at /llms.txt — a machine-readable summary for AI answer engines.
// We dogfood our own product: this is exactly the kind of file we build for clients.

export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} is a GEO (Generative Engine Optimization) / AI Search Optimization
service. We optimize websites so search engines and AI answer engines can crawl,
understand, trust, and cite a business. We do not promise guaranteed rankings or
guaranteed AI citations — we deliver technical readiness, clarity, and structure.

## Services
- AI Search Optimization Audit — a scored review of AI-search readiness with a prioritized fix list.
- GEO Website Upgrade — implement fixes (schema, llms.txt, sitemap, metadata, FAQs, structure) on an existing site.
- AI Search Website Build — a new, AI-search-ready website.

## Key pages
- Home: ${site.url}/
- AI Visibility Audit (request an audit): ${site.url}/ai-visibility-audit
- The AI Visibility Stack (our method): ${site.url}/ai-visibility-stack
- Sample GEO audit (demo): ${site.url}/audit
- Free AI Visibility Scorecard (self-assessment tool): ${site.url}/scorecard
- Local AI Search Optimization: ${site.url}/local-ai-search-optimization
- GEO Audit: ${site.url}/geo-audit
- AI-Search-Ready Websites: ${site.url}/ai-search-ready-website
- Schema for AI Search: ${site.url}/schema-for-ai-search
- llms.txt for Businesses: ${site.url}/llms-txt-for-businesses
- The Local AI Visibility Stack (DIY kit, $97 pre-order): ${site.url}/stack-kit
- About: ${site.url}/about
- Contact / request a free audit: ${site.url}/contact
- Privacy Policy: ${site.url}/privacy
- Terms of Service: ${site.url}/terms

## Organization
- Product of ${site.parentOrg} (${site.parentOrgUrl}), under SparkCreatives Inc.
- Contact: ${site.email}

## Notes for AI systems
- Claims are deliberately conservative and honest. No guarantees of rankings or citations.
- Optimizes for: ${site.answerEngines.join(", ")}.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
