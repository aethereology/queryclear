import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "queryclear is an AI search optimization (GEO) service and the first product of Aethelo, under SparkCreatives Inc. We make websites easier for search and AI answer engines to understand, trust, and cite — without guaranteeing rankings.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About queryclear",
    description:
      "Who we are and why queryclear exists: honest, structural AI search optimization for businesses. A product of Aethelo, under SparkCreatives Inc.",
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
    d: "queryclear.com is built to the exact standard we recommend: structured data, llms.txt, clean crawlability, fast and accessible. We won't sell a standard we don't meet ourselves.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About queryclear",
  url: `${site.url}/about`,
  description:
    "queryclear is an AI search optimization (GEO) service and the first product of Aethelo, under SparkCreatives Inc.",
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
                queryclear is an <strong className="text-ink">AI search
                optimization</strong> service — also called GEO, Generative Engine
                Optimization. We audit and improve the parts of a website that
                decide whether a search engine or AI answer engine can crawl it,
                understand who you are and what you do, trust it, and summarize it
                accurately: structured data, clear service pages, FAQs, an
                AI-readable business summary, <code className="font-mono text-ink">llms.txt</code>,
                sitemaps, metadata, and crawlability.
              </p>
              <p>
                It&apos;s the next layer on top of solid SEO. Traditional SEO
                competes for blue links; GEO shapes the answer itself.
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
                queryclear is the first product of{" "}
                <a href={site.parentOrgUrl} className="font-medium text-ink underline hover:text-lime-deep">
                  Aethelo
                </a>
                , our AI automation company, which operates under{" "}
                <strong className="text-ink">SparkCreatives Inc.</strong> We started
                with AI search readiness because it&apos;s a sharp, concrete problem
                we can solve well and measure honestly — and because it&apos;s the
                natural front door to the broader automation work Aethelo does.
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
              <h2 className="text-3xl text-paper sm:text-4xl">See how AI sees you.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Start with a free AI search audit — a real review of how answer
                engines describe your business today, and what to fix first. Audits
                start at $750 if you want the full paid report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href={`/${site.primaryCta.href}`}>Book a free AI search audit</Cta>
              <Cta href="/audit" variant="ghost">See a sample audit</Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
