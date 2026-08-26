import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { verifyCheckoutSession } from "@/lib/checkout-session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Audit checkout status",
  description: "Verify an AI Search Audit checkout and review the next steps.",
  alternates: { canonical: "/ai-visibility-audit/success" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function AuditSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const rawSessionId = (await searchParams).session_id;
  const sessionId = typeof rawSessionId === "string" ? rawSessionId : "";
  const verified = sessionId
    ? await verifyCheckoutSession(sessionId, "ai-search-audit")
    : null;

  if (!verified) {
    return (
      <>
        <Header />
        <main id="main-content">
          <section className="border-b border-line">
            <Container className="py-20 md:py-28">
              <MonoLabel index="status">Checkout status</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                We could not verify a completed audit payment from this link.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                A success-page URL is not proof of payment. Return from the Stripe
                checkout flow with its complete session link, or contact us if you
                received a receipt and still see this message.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="/ai-visibility-audit">Return to the audit</Cta>
                <Cta href="/contact" variant="ghost" showArrow={false}>
                  Contact queryclear
                </Cta>
              </div>
            </Container>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="confirmed">Audit purchased</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Your audit is booked. Thank you.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Stripe confirms completed payment for your {site.auditProduct.name} ({site.auditProduct.priceLabel}).
              We&apos;ll contact the email provided at checkout to complete intake,
              confirm the prompt-engine observation allocation, and schedule the walkthrough.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl">
            <MonoLabel index="next">What happens next</MonoLabel>
            <ol className="mt-5 grid gap-4">
              <li className="card p-6">
                <h2 className="text-lg">We run the full audit</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  We review up to {site.auditProduct.pageLimit} public URLs, score all
                  seven readiness layers, and run up to {site.auditProduct.promptLimit}{" "}
                  total prompt-engine observations distributed across up to{" "}
                  {site.auditProduct.engineLimit} named engines selected at kickoff.
                  Each prompt × engine check consumes one observation. Every answer
                  sample is labeled by engine, prompt, date, and access method.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">We walk you through it live</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  The report is due within seven business days after intake is
                  complete. We then schedule the included {site.auditProduct.walkthroughMinutes}-minute
                  walkthrough and one factual-correction round.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">Your $497 is credited if you go ahead</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  No obligation — keep the roadmap and run it yourself. Or, if you
                  decide to have us do the work, your $497 is credited once toward a
                  Website Upgrade or Website Build of ${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more
                  for the same site when the agreement is signed within{" "}
                  {site.auditProduct.creditDays} days after delivery. Questions or a problem? Email{" "}
                  <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                    {site.email}
                  </a>
                  {" "}— a real person replies, and if we can&apos;t complete your audit
                  we&apos;ll make it right.
                </p>
              </li>
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/">Back to home</Cta>
              <Cta href="/audit" variant="ghost" showArrow={false}>
                See a sample report
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
