import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditReport } from "@/components/AuditReport";
import { goldleafDemo } from "@/lib/reports/goldleaf-demo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sample AI Search Audit",
  description:
    "A sample GEO / AI search readiness audit — scored against the seven-layer AI Visibility Stack, with real visibility tests and a prioritized fix list. Built on a fictional med-spa demo business.",
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "Sample AI Search Audit — queryclear",
    description:
      "See exactly how we score a site's readiness for AI answer engines, and what we'd fix first. A fictional med-spa demo.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sample AI Search Audit",
  url: `${site.url}/audit`,
  description:
    "A sample GEO / AI search readiness audit, scored against the AI Visibility Stack, on a fictional med-spa demo business.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Sample audit", item: `${site.url}/audit` },
  ],
};

export default function AuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <AuditReport data={goldleafDemo} />
      <Footer />
    </>
  );
}
