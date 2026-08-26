import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditReport } from "@/components/AuditReport";
import { getReport } from "@/lib/reports";
import { reportAccessCookieName, verifyReportAccessToken } from "@/lib/report-access";
import { getPrivateReport } from "@/lib/private-report-store";

// Private per-client audit reports. Non-demo reports require an expiring HMAC
// token, are dynamically rendered, and receive no-store response headers. See
// docs/playbooks/running-an-audit.md.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const candidate = getReport(slug);
  const report = candidate?.demo === true ? candidate : undefined;
  return {
    // Never leak a client's identity in unauthenticated metadata or link previews.
    title: report?.demo ? `AI Search Audit — ${report.business}` : "Private AI Search Audit",
    description: report?.demo
      ? `Demonstration AI-search readiness report for ${report.business}.`
      : "Private client deliverable.",
    // Private deliverable — never index, never follow.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string | string[] }>;
}) {
  const { slug } = await params;
  const candidate = getReport(slug);
  const demoReport = candidate?.demo === true ? candidate : undefined;
  const query = await searchParams;
  const access = typeof query.access === "string" ? query.access : undefined;
  if (!demoReport && access) {
    redirect(
      `/api/reports/access?slug=${encodeURIComponent(slug)}&access=${encodeURIComponent(access)}`,
    );
  }
  const cookieToken = (await cookies()).get(reportAccessCookieName(slug))?.value;
  if (!demoReport && !verifyReportAccessToken(slug, cookieToken)) notFound();
  const report = demoReport ?? (await getPrivateReport(slug));
  if (!report) notFound();

  return (
    <>
      <Header />
      <AuditReport data={{ ...report, variant: report.variant ?? "client" }} />
      <Footer />
    </>
  );
}
