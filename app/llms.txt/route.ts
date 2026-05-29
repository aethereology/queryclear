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
- Sample GEO audit (demo): ${site.url}/audit

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
