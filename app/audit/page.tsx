import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditReport } from "@/components/AuditReport";
import { goldleafDemo } from "@/lib/reports/goldleaf-demo";
import Link from "next/link";
import { Container } from "@/components/ui";
import { AuditReportView } from "@/components/AuditReportView";
import { readinessExample } from "@/lib/reports/readiness-example";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sample Modern Search Readiness Report",
  description:
    "Explore a clearly fictional modern-search report with seven-layer scoring, evidence examples, prioritized fixes, and stated limitations.",
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "Sample Modern Search Readiness Report — queryclear",
    description:
      "See exactly how we score a site's readiness for modern search, and what we'd fix first. A fictional med-spa demo.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sample Modern Search Readiness Report",
  url: `${site.url}/audit`,
  description:
    "A sample modern-search readiness report, scored against the AI Visibility Stack, on a fictional med-spa demo business.",
  isPartOf: { "@id": site.schemaIds.website },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Sample audit", item: `${site.url}/audit` },
  ],
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<{view?:string}> }) {
  const automated = (await searchParams).view === "automated";
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <nav aria-label="Sample report type" className="border-b border-line bg-paper"><Container className="flex flex-wrap gap-3 py-4 text-sm"><Link href="/audit" aria-current={!automated ? "page" : undefined} className="rounded-lg border border-line px-4 py-3 aria-[current=page]:bg-paper-2">Human-reviewed audit example</Link><Link href="/audit?view=automated" aria-current={automated ? "page" : undefined} className="rounded-lg border border-line px-4 py-3 aria-[current=page]:bg-paper-2">Automated preview example</Link></Container></nav>
      {automated ? <main id="main-content"><Container className="py-12"><p className="evidence-tag">Fictional example · No crawl or model query performed</p><h1 className="mt-5 text-3xl sm:text-4xl">Inside an automated preview.</h1><p className="mt-5 mb-10 max-w-3xl text-muted leading-relaxed">This hand-authored report demonstrates the real report interface. All findings, page coverage, scenario outcomes and draft text below are illustrative. Evidence labels show how real reports categorize observations; they do not represent measurements of this example website.</p><AuditReportView report={readinessExample} /></Container></main> : <AuditReport data={goldleafDemo} />}
      <Footer />
    </>
  );
}
