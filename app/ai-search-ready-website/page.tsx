import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI-Search-Ready Websites",
  description:
    "Build or optimize your website for AI search readiness: structured content, clear service pages, valid schema, metadata, crawlability, FAQs, and a working conversion path. queryclear builds the standard it recommends.",
  alternates: { canonical: "/ai-search-ready-website" },
  openGraph: {
    title: "AI-Search-Ready Websites — queryclear",
    description: "What makes a website AI-search-ready — and what most sites miss.",
  },
};

const miss = [
  "Vague homepages that don't say what, where, or for whom",
  "No structured data, so machines have nothing reliable to read",
  "Service pages merged into one thin list",
  "No FAQs, so there's no clear Q&A to quote",
  "No clear, machine-readable business summary",
  "Important content hidden behind scripts crawlers can't run",
];

const build = [
  { t: "Technical setup", d: "Clean semantic HTML, fast loads, sitemap, robots, canonical tags — the crawl foundation." },
  { t: "Content setup", d: "Clear entities: what you do, who it's for, where. Written for humans and machines." },
  { t: "Schema & structured data", d: "Valid JSON-LD (Organization, LocalBusiness, Service, FAQPage) from your real details only." },
  { t: "Service-page system", d: "A real, crawlable page per service, built from a consistent template." },
  { t: "Internal linking", d: "A sensible link map so crawlers and readers can navigate and understand context." },
  { t: "Conversion path", d: "An obvious, accessible next step: contact, booking, or audit request." },
];

const faqs = [
  { q: "Do you build new sites or fix existing ones?", a: "Both. We optimize an existing site (adding structure, schema, clarity, and crawlability) or build a new AI-search-ready site from scratch. The right choice depends on what you have today — the audit tells us." },
  { q: "Will an AI-ready site guarantee I get cited?", a: "No. We make your site genuinely clear, structured, and trustworthy to search and AI systems — that's the part we control. We never promise rankings or AI citations." },
  { q: "How is this different from a normal web designer?", a: "Most sites are designed to look good to people. We additionally build them to be understood by machines: valid structured data, clear entities, machine-readable summaries, and crawlability — the things answer engines actually rely on." },
];

const webPageSchema = { "@context": "https://schema.org", "@type": "WebPage", name: "AI-Search-Ready Websites", url: `${site.url}/ai-search-ready-website`, description: "Building and optimizing websites for AI search readiness.", isPartOf: { "@type": "WebSite", name: site.name, url: site.url } };
const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: "AI-Search-Ready Website Build & Optimization", serviceType: "AI search optimization website build", provider: { "@type": "Organization", name: site.name, url: site.url }, description: "Building or optimizing websites with structured content, schema, metadata, crawlability, and clear conversion paths for AI search readiness.", areaServed: "United States" };
const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` }, { "@type": "ListItem", position: 2, name: "AI-Search-Ready Websites", item: `${site.url}/ai-search-ready-website` } ] };

export default function ReadyWebsitePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="build">AI-search-ready websites</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">A website machines can actually read.</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Most websites are built to look good to people. We build them to also be
              understood by search engines and AI answer engines — clear entities,
              valid structured data, crawlable content, and a conversion path that
              works. We hold our own site to this exact standard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See our method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What normal websites miss</MonoLabel>
            <ul className="mt-8 grid max-w-3xl gap-3">
              {miss.map((m) => (
                <li key={m} className="flex gap-3 text-ink"><span aria-hidden="true" className="text-red-600">✗</span><span>{m}</span></li>
              ))}
            </ul>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">What we build</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">The AI-search-ready system.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {build.map((b) => (
                <StaggerItem key={b.t} className="card p-6">
                  <h3 className="text-lg">{b.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{b.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Build or optimize for modern search.</h2>
              <p className="mt-3 max-w-xl text-paper/70">Run a free audit so we know what your site needs. Upgrades start at $2,500; full builds at $6,500.</p>
            </div>
            <Cta href="/free-audit">Run a free audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
