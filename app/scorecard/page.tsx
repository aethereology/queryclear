import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Scorecard } from "@/components/Scorecard";
import { TOTAL_QUESTIONS } from "@/lib/scorecard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AI Visibility Scorecard",
  description:
    "Grade your own website for AI search in two minutes. Answer a few plain-English questions across the seven layers of the AI Visibility Stack and get an instant 0–100 readiness score with what to fix first.",
  alternates: { canonical: "/scorecard" },
  openGraph: {
    title: "Free AI Visibility Scorecard — queryclear",
    description:
      "Score your site's readiness for AI answer engines across all seven layers — instant result, no email required.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free AI Visibility Scorecard",
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
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="tool">Free self-assessment</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              How ready is your site for AI search?
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Answer {TOTAL_QUESTIONS} plain-English questions about your website and get
              an instant 0–100 readiness score, scored against the seven layers of our{" "}
              <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                AI Visibility Stack
              </a>
              . No email needed to see your result — it&apos;s the same rubric behind our{" "}
              <a href="/audit" className="font-medium text-ink underline hover:text-lime-deep">
                sample audit
              </a>
              .
            </p>
            <p className="mt-4 max-w-2xl text-sm text-muted">
              It measures <span className="text-ink">readiness</span>, not rankings —
              answer honestly and use &ldquo;Not sure&rdquo; when you don&apos;t know.
            </p>
          </Container>
        </section>

        {/* The tool */}
        <section className="py-16">
          <Container className="max-w-3xl">
            <Scorecard />
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Prefer we do it for you?</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                A free AI Search audit checks your live site and shows what to
                fix first, in plain English. The full scored audit is $497.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/stack-kit" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                Do it yourself — $97 kit
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
