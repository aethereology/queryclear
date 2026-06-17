import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Audit purchase confirmed",
  description: "Your AI Search Audit purchase is confirmed.",
  alternates: { canonical: "/ai-visibility-audit/success" },
  robots: { index: false, follow: false },
};

export default function AuditSuccessPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="confirmed">Audit purchased</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Your audit is booked. Thank you.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Your {site.auditProduct.name} ({site.auditProduct.priceLabel}) is
              confirmed and Stripe just emailed your receipt. We have the website
              you entered at checkout and we&apos;re starting on it.
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
                  We score your site across all seven readiness layers, test how
                  AI answer engines describe your business, and write a prioritized,
                  plain-English fix roadmap.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">You get the report</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  We email your scored report to the address on your receipt —
                  usually within a couple of business days. If we need anything,
                  we&apos;ll reach out there first.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">Questions or a problem?</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Email{" "}
                  <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                    {site.email}
                  </a>
                  {" "}— a real person replies. If we can&apos;t complete your audit,
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
