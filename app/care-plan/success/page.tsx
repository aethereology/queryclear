import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Care Plan enrollment",
  description: "Care Plan enrollment status and contact information.",
  alternates: { canonical: "/care-plan/success" },
  robots: { index: false, follow: false },
};

export default function CarePlanSuccessPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="status">Enrollment status</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              This page does not confirm Care Plan enrollment.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              The Care Plan is available only after a written eligibility review.
              Enrollment and billing details are confirmed directly by email; visiting
              this URL alone does not create or prove a subscription.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl">
            <MonoLabel index="next">What to do</MonoLabel>
            <div className="card mt-5 p-6">
              <h2 className="text-lg">Check the written confirmation</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                If you completed an approved enrollment, use the Stripe receipt and
                onboarding email sent to your address. Questions? Email{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/care-plan">Review Care Plan eligibility</Cta>
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
