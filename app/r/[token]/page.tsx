import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Resend } from "resend";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { AuditReportView } from "@/components/AuditReportView";
import { publicAuditStore } from "@/lib/public-audit";
import { outreachStore } from "@/lib/outreach-store";
import { outreachReportTtlMs } from "@/lib/outreach";
import { renderOutreachViewNotifyEmail } from "@/lib/email";
import { site } from "@/lib/site";

// Pre-unlocked cold-outreach report. The unguessable token IS the key (we already
// know who we sent it to), so there's no email gate. Private: noindex here,
// robots-disallowed in app/robots.ts, and deliberately NOT in sitemap/llms.txt.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your AI Search Audit",
  robots: { index: false, follow: false },
};

// Best-effort founder notification — never blocks the page render (runs via after()).
async function notifyOpen(domainUrl: string, reportUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const to = process.env.LEAD_TO ?? site.email;
  try {
    await resend.emails.send({
      from,
      to,
      subject: `Prospect opened their audit — ${domainUrl}`,
      html: renderOutreachViewNotifyEmail({ domainUrl, reportUrl }, site),
    });
  } catch {
    /* best-effort: an open notification must never break the report page */
  }
}

export default async function OutreachReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await publicAuditStore().getReport(token);
  if (!report) notFound();

  // First open only: notify the founder + graduate the contact cold → opened.
  // after() runs post-response so it never slows the page.
  after(async () => {
    const first = await publicAuditStore().markViewedOnce(token, outreachReportTtlMs());
    if (!first) return;
    await notifyOpen(report.domain_url, `${site.url}/r/${token}`);
    const email = await outreachStore().emailForToken(token);
    if (email) {
      const contact = await outreachStore().getContact(email);
      // Only graduate a still-cold contact; never override replied/unsubscribed/etc.
      if (contact && contact.status === "cold") {
        await outreachStore().setStatus(email, "opened");
      }
    }
  });

  return (
    <>
      <Header />
      <main>
        <section className="site-section border-b border-line">
          <Container className="py-16 sm:py-20">
            <MonoLabel index="audit">AI Search Audit</MonoLabel>
            <h1 className="mt-5 max-w-3xl">Your AI search audit for {report.domain_url}.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              A read-only look at how AI answer engines find, read, and cite your site — with a
              prioritized list of what to fix first. Prepared by queryclear.
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
