import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

const plan = site.carePlan;

export const metadata: Metadata = {
  title: "Care Plan started",
  description: "Your AI Search Care Plan subscription is confirmed.",
  alternates: { canonical: "/care-plan/success" },
  robots: { index: false, follow: false },
};

export default function CarePlanSuccessPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="confirmed">Care Plan started</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              You&apos;re on the Care Plan. Thank you.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Your {plan.name} ({plan.priceLabel}) is active and Stripe just emailed
              your receipt. We have the website you entered at checkout and we&apos;re
              starting month one.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl">
            <MonoLabel index="next">What happens next</MonoLabel>
            <ol className="mt-5 grid gap-4">
              <li className="card p-6">
                <h2 className="text-lg">We set your baseline</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  We re-audit your site across all seven readiness layers and record
                  where AI answer engines stand on your business today — so every
                  month after has something to measure against.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">You get a monthly report</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Each month we send a short, plain-English report: what we changed,
                  what your score did, and how AI engines describe you now. We email
                  it to the address on your receipt.
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">Cancel anytime</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  It&apos;s month-to-month, no contract. Cancel from your Stripe
                  receipt or email{" "}
                  <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                    {site.email}
                  </a>
                  {" "}— a real person replies.
                </p>
              </li>
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/">Back to home</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost" showArrow={false}>
                Read the method
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
