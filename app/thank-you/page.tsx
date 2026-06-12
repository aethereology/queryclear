import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";

// Post-conversion page: deliberately noindex and excluded from sitemap.ts and
// llms.txt — it exists as a stable success URL for people and analytics, not
// as a public marketing route.
export const metadata: Metadata = {
  title: "Request received",
  description:
    "Thanks — we received your request. We'll review your website and follow up with your free AI Search Snapshot.",
  alternates: { canonical: "/thank-you" },
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="ok">[ received ]</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Thanks — we received your request.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              We&apos;ll review the website details you submitted and follow up
              with your free AI Search Snapshot — a plain-English look at your
              site&apos;s clarity, crawlability, service pages, local signals,
              and AI-search readiness.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              In the meantime, you can see how we evaluate modern-search
              foundations in a sample readiness report.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Cta href="/audit">View a sample report</Cta>
              <Cta href="/" variant="ghost">
                Back to home
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
