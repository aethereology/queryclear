import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Kyle, queryclear's founder and lead operator, and learn how the SparkCreatives Inc. brand approaches modern SEO and AI-search readiness.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About queryclear",
    description:
      "Who we are and why queryclear exists: honest, structural website optimization for modern search. A SparkCreatives Inc. brand.",
  },
};

const principles = [
  {
    t: "We sell readiness, not promises",
    d: "We make your site genuinely clearer and more structured for search and AI systems. We never promise rankings or AI citations — those aren't ours to guarantee, and anyone who says otherwise is guessing.",
  },
  {
    t: "Plain words over hype",
    d: "No buzzwords, no black boxes. We explain exactly what we change and why it helps a machine understand your business.",
  },
  {
    t: "Only true things",
    d: "We never invent reviews, ratings, credentials, or business details — for our clients or in our own demos. Sample work is clearly labeled as fictional.",
  },
  {
    t: "Evidence before claims",
    d: "We publish the scoring method, label fictional examples, distinguish modeled output from observed output, and tie recommendations to inspectable pages and technical evidence.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About queryclear",
  url: `${site.url}/about`,
  description:
    "queryclear is a modern SEO service for the AI search era, a SparkCreatives Inc. brand.",
  isPartOf: { "@id": site.schemaIds.website },
  about: { "@id": site.schemaIds.brand },
  publisher: { "@id": site.schemaIds.organization },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "About", item: `${site.url}/about` },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="about">Who we are</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Better discovery starts with a clearer website.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Some buyers now encounter AI-generated answers alongside or instead of
              a traditional list of links. queryclear structures public business facts,
              services, and supporting evidence for modern search interfaces while
              making the same pages more useful to buyers.
            </p>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="01">The operator</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <h2 className="text-3xl text-ink sm:text-4xl">{site.founder.name}, founder and lead operator.</h2>
              <p>
                {site.founder.name} leads queryclear&apos;s strategy, engineering, and
                delivery. He also founded{" "}
                <a href={site.founder.studioUrl} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.founder.studioName}
                </a>
                , where his role and the broader team are published.
              </p>
              <p>
                You can review the broader studio&apos;s{" "}
                <a href={site.founder.workUrl} className="font-medium text-ink underline hover:text-lime-deep">
                  linked project library
                </a>
                . Those examples include client and in-house website systems and are
                shown as broader studio work — not as invented queryclear client outcomes.
              </p>
            </div>
          </Container>
        </section>

        {/* What it is */}
        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="02">What queryclear is</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                queryclear is <strong className="text-ink">modern SEO for the AI
                search era</strong> — some people call this work GEO or AEO. We
                audit and improve the parts of a website that affect whether a
                search engine or AI-powered result can crawl it, identify the
                business and services, find supporting evidence, and summarize its public facts:
                clear service pages, useful FAQs, structured data, local business
                details, metadata, sitemaps, and crawlability.
              </p>
              <p>
                It isn&apos;t separate from SEO — it builds on it. Useful content,
                crawlable pages, clear structure, and accurate business
                information are still the foundation; we make sure that
                foundation holds up in AI-powered search experiences too.
              </p>
            </div>
          </Container>
        </section>

        {/* Why it exists / org relationship */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="03">Why it exists &amp; where it sits</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                Search is shifting from a list of links to a single AI-generated
                answer, and most local and small businesses have websites that were
                never built for a machine to read. That gap is the reason queryclear
                exists.
              </p>
              <p>
                {site.legal.relationship} SparkCreatives Inc. is a {site.legal.entityType}.{" "}
                <a href={site.parentOrgUrl} className="font-medium text-ink underline hover:text-lime-deep">
                  Review the parent organization
                </a>{" "}
                for its public mission and organization information. {site.legal.serviceFeeNotice}
              </p>
            </div>
          </Container>
        </section>

        {/* Principles */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">How we operate</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Operating principles.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {principles.map((p) => (
                <StaggerItem key={p.t} className="card p-6">
                  <h3 className="text-xl">{p.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* No-guarantee philosophy */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="05">What we will and won&apos;t promise</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                <strong className="text-ink">Our controllable commitments:</strong>{" "}
                a defined scope, evidence-linked findings, truthful source material,
                documented approvals, validation of the technical work we deliver,
                and a clear handoff.
              </p>
              <p>
                <strong className="text-ink">We don&apos;t promise:</strong>{" "}
                guaranteed rankings or guaranteed AI citations. Answer engines are
                changing constantly and no one controls their output. What we control
                is the agreed website work, its technical validation, and transparent
                reporting of the evidence we observe.
              </p>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Review your public search foundation.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Run a free AI Search Audit — an automated, read-only read on your
                site&apos;s biggest search-readiness opportunities. The full
                scored AI Search Audit is $497 if you want the deep report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free preview</Cta>
              <Cta href="/audit" variant="ghost" className="!border-paper/30 !text-paper hover:!bg-white/10">
                See a sample audit
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
