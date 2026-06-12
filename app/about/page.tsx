import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "queryclear is a modern SEO service for the AI search era, a SparkCreatives Inc. brand. We make websites easier for search engines and AI-powered results to understand and trust — without guaranteeing rankings.",
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
    t: "Our own site is the proof",
    d: "queryclear.com is built to the exact standard we recommend: structured data, clean crawlability, clear service pages, fast and accessible. We won't sell a standard we don't meet ourselves.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About queryclear",
  url: `${site.url}/about`,
  description:
    "queryclear is a modern SEO service for the AI search era, a SparkCreatives Inc. brand.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
  about: {
    "@type": "Organization",
    name: site.name,
    url: site.url,
    parentOrganization: { "@type": "Organization", name: site.parentOrg, url: site.parentOrgUrl },
  },
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
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="about">Who we are</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              We make businesses legible to the machines people now ask.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              More and more buyers don&apos;t scroll a list of links — they ask
              ChatGPT, Claude, Perplexity, Gemini, or Google&apos;s AI Overviews
              and act on the answer. queryclear exists to make sure those systems
              can actually understand your business, describe it accurately, and
              consider recommending it.
            </p>
          </Container>
        </section>

        {/* What it is */}
        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="01">What queryclear is</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                queryclear is <strong className="text-ink">modern SEO for the AI
                search era</strong> — some people call this work GEO or AEO. We
                audit and improve the parts of a website that decide whether a
                search engine or AI-powered result can crawl it, understand who
                you are and what you do, trust it, and summarize it accurately:
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
              <MonoLabel index="02">Why it exists &amp; where it sits</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                Search is shifting from a list of links to a single AI-generated
                answer, and most local and small businesses have websites that were
                never built for a machine to read. That gap is the reason queryclear
                exists.
              </p>
              <p>
                queryclear is a{" "}
                <a href={site.parentOrgUrl} className="font-medium text-ink underline hover:text-lime-deep">
                  SparkCreatives Inc.
                </a>{" "}
                brand. We started with search readiness because it&apos;s a sharp,
                concrete problem we can solve well and measure honestly — and
                because a website that machines and people both understand is the
                foundation everything else builds on.
              </p>
            </div>
          </Container>
        </section>

        {/* Principles */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">How we operate</MonoLabel>
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
              <MonoLabel index="04">What we will and won&apos;t promise</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                <strong className="text-ink">We promise:</strong> better technical
                readiness, clearer content, valid structured data, real crawlability,
                an honest AI-readable summary of your business, and a conversion path
                that works.
              </p>
              <p>
                <strong className="text-ink">We don&apos;t promise:</strong>{" "}
                guaranteed rankings or guaranteed AI citations. Answer engines are
                changing constantly and no one controls their output. What we control
                is whether your business is clear and trustworthy to them — and we do
                that part well.
              </p>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">See how modern search sees you.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Start with a free AI Search Snapshot — a plain-English review of
                your site&apos;s biggest search-readiness opportunities. The full
                scored AI Search Audit is $497 if you want the deep report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href={`/${site.primaryCta.href}`}>Get your free Snapshot</Cta>
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
