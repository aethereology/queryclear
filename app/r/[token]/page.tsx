import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { AuditReportView } from "@/components/AuditReportView";
import { OutreachOpenTracker } from "@/components/OutreachOpenTracker";
import { publicAuditStore } from "@/lib/public-audit";

// Pre-unlocked cold-outreach report. The unguessable token IS the key (we already
// know who we sent it to), so there's no email gate. Private: noindex here,
// robots-disallowed in app/robots.ts, and deliberately NOT in sitemap/llms.txt.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your AI Search Audit",
  robots: { index: false, follow: false },
};

export default async function OutreachReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await publicAuditStore().getReport(token);
  if (!report) notFound();
  const prospectDomain = report.domain_url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <OutreachOpenTracker token={token} />
      <Header />
      <main id="main-content">
        <section className="site-section border-b border-line">
          <Container className="py-16 sm:py-20">
            <MonoLabel index="audit">AI Search Audit</MonoLabel>
            <h1 className="mt-5 max-w-3xl">Your AI search audit for {prospectDomain}.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              A read-only review of your public source material and labeled answer
              samples, with a prioritized list of what to fix first. Prepared by queryclear.
            </p>
            <div className="mt-10">
              <AuditReportView report={report} />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
