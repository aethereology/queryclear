import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Scorecard } from "@/components/Scorecard";
import { TOTAL_QUESTIONS } from "@/lib/scorecard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Visibility Scorecard",
  description:
    "Grade your own website for AI search readiness. Answer a few plain-English questions across the seven layers of the AI Visibility Stack and get an instant 0-100 score with what to fix first.",
  alternates: { canonical: "/scorecard" },
  openGraph: {
    title: "AI Visibility Scorecard - queryclear",
    description:
      "Score your site's readiness for AI answer engines across all seven layers. Instant result, no email required.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Visibility Scorecard",
  url: `${site.url}/scorecard`,
  description:
    "A free self-assessment that grades a website's readiness for AI answer engines across the seven layers of the AI Visibility Stack.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "AI Visibility Scorecard", item: `${site.url}/scorecard` },
  ],
};

export default function ScorecardPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="grid gap-8 py-12 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-end md:py-14">
            <div>
              <MonoLabel index="tool">Free self-assessment</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                AI Visibility Scorecard
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted">
                Answer <span className="tnum font-mono text-ink">{TOTAL_QUESTIONS}</span>{" "}
                plain-English questions and get an instant{" "}
                <span className="tnum font-mono text-ink">0-100</span>{" "}
                readiness score across the seven layers of the{" "}
                <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                  AI Visibility Stack
                </a>
                . No email gate, no ranking promises, just a practical read on what
                your site gives answer engines to work with.
              </p>
            </div>
            <div className="border border-dashed border-line bg-paper p-5">
              <p className="mono-label text-lime-deep">[ what it checks ]</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="tnum font-display text-3xl leading-none">{TOTAL_QUESTIONS}</p>
                  <p className="mt-1 text-xs text-muted">questions</p>
                </div>
                <div>
                  <p className="tnum font-display text-3xl leading-none">7</p>
                  <p className="mt-1 text-xs text-muted">layers</p>
                </div>
                <div>
                  <p className="tnum font-display text-3xl leading-none">0</p>
                  <p className="mt-1 text-xs text-muted">email gate</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Measures readiness, not rankings. Use &ldquo;Not sure&rdquo; when
                you cannot verify an answer from the live site.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-10 md:py-12">
          <Container>
            <Scorecard />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Want the verified version?</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                The scorecard is a self-check. A free AI Search audit reads your
                live site and shows what to fix first, in plain English.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/ai-visibility-audit" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                Get the $497 audit
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
