import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stack Kit order status",
  description: "Information about the retired Local AI Visibility Stack offer.",
  alternates: { canonical: "/stack-kit/success" },
  robots: { index: false, follow: false },
};

export default function StackKitSuccessPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="status">Retired offer</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              This page does not confirm a purchase.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              The standalone Local AI Visibility Stack offer is retired and cannot
              be purchased from queryclear. Visiting this URL alone does not create
              or prove an order.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl">
            <MonoLabel index="next">Need help?</MonoLabel>
            <div className="card mt-5 p-6">
              <h2 className="text-lg">Use your original receipt</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                If you have a historic Stripe receipt or an unresolved order question,
                forward it to{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>{" "}
                so we can verify it directly.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/stack-kit">See the retired offer notice</Cta>
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
