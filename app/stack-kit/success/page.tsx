import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

const kit = site.stackKit;

export const metadata: Metadata = {
  title: "Pre-order confirmed",
  description: "Your founding pre-order of The Local AI Visibility Stack is confirmed.",
  alternates: { canonical: "/stack-kit/success" },
  robots: { index: false, follow: false },
};

export default function StackKitSuccessPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="confirmed">Pre-order confirmed</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              You&apos;re a founding member. Thank you.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Your pre-order of {kit.name} is confirmed. Stripe just emailed your
              receipt.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl">
            <MonoLabel index="next">What happens next</MonoLabel>
            <ol className="mt-5 grid gap-4">
              <li className="card p-6">
                <h2 className="text-lg">We&apos;re building it now</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {`Your kit ships within ${kit.shipDays} days of purchase. We'll email it to the address on your receipt.`}
                </p>
              </li>
              <li className="card p-6">
                <h2 className="text-lg">Changed your mind?</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  It&apos;s fully refundable anytime before delivery — just email{" "}
                  <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                    {site.email}
                  </a>
                  . If we miss {`${kit.shipDays} days`}, we refund you automatically.
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
