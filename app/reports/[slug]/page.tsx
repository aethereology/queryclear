import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditReport } from "@/components/AuditReport";
import { getReport, reportSlugs } from "@/lib/reports";

// Private per-client audit reports. Noindexed and excluded from sitemap + llms.txt;
// delivered as an unguessable private link (and Save-as-PDF). See
// docs/playbooks/running-an-audit.md.

export function generateStaticParams() {
  return reportSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return { title: "Report not found", robots: { index: false, follow: false } };
  return {
    title: `AI Search Audit — ${report.business}`,
    description: `Private AI-search readiness report for ${report.business}.`,
    // Private deliverable — never index, never follow.
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) notFound();

  return (
    <>
      <Header />
      <AuditReport data={{ ...report, variant: report.variant ?? "client" }} />
      <Footer />
    </>
  );
}
