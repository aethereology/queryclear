import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Local AI Search Optimization",
  description:
    "Modern SEO for local service businesses: clear services and markets, verified proof, useful answers, structured data, and conversion paths.",
  alternates: { canonical: "/local-ai-search-optimization" },
  openGraph: {
    title: "Local AI Search Optimization — queryclear",
    description:
      "Clarify local services, markets, proof, business profiles, structured data, and conversion paths for modern search.",
  },
};

const why = [
  { t: "Buyers ask full questions", d: "Queries increasingly include a service, location, fit, cost, safety, availability, or comparison. Thin pages leave search systems and buyers without enough specific information." },
  { t: "A business profile is one source", d: "A complete profile helps local discovery, while the website supplies deeper service, proof, policy, team, and booking information. The two should agree." },
  { t: "Many local sites stay vague", d: "Thin homepages, combined service lists, weak internal links, and missing proof make the business harder to evaluate regardless of which search interface a buyer uses." },
];

const fixes = [
  { t: "Service-area clarity", d: "We make the cities and neighborhoods you serve explicit and machine-readable." },
  { t: "Clear service pages", d: "A real page per service — what it is, who it's for, where — instead of one vague list." },
  { t: "LocalBusiness & Service schema", d: "Valid structured data built only from your real, verified details." },
  { t: "Review & proof signals", d: "Surfacing the honest trust signals you already have, where machines can read them." },
  { t: "Google Business Profile alignment", d: "Making your site and your profile tell the same, consistent story." },
  { t: "A working booking / contact path", d: "So an AI-referred visitor can actually take the next step." },
];

const industries = ["Med spas", "Aestheticians", "Spas & salons", "Dentists & clinics", "Home services", "Wellness studios"];

const faqs = [
  { q: "Is this just local SEO with a new name?", a: "It is modern local SEO, not a replacement for it. The work combines crawlability, useful service pages, business-profile alignment, proof, structured data, buyer answers, and conversion paths, then samples how configured answer tools handle that public material." },
  { q: "Will this guarantee I show up when someone asks AI?", a: "No. We can improve and validate the website, document business-profile alignment, and record bounded answer samples. We cannot control a third party's index, ranking, recommendation, citation, or changing output." },
  { q: "I already have a Google Business Profile. Isn't that enough?", a: "It is an important local-search asset, but public website pages can supply additional service, proof, and conversion details. We align the site and profile around the same verified business facts." },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Local AI Search Optimization",
  url: `${site.url}/local-ai-search-optimization`,
  description: "Helping local and service businesses become legible to AI answer engines.",
  isPartOf: { "@id": site.schemaIds.website },
};
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Local AI Search Optimization",
  serviceType: "Local SEO / AI search optimization",
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  description: "Improving local service pages, markets, verified proof, structured data, business-profile alignment, and conversion paths for modern search.",
  areaServed: "United States",
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Local AI Search Optimization", item: `${site.url}/local-ai-search-optimization` },
  ],
};

export default function LocalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="local">Local AI search</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Make your local business easier to identify and evaluate.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              queryclear improves the public facts modern search depends on: specific
              service pages, genuine market coverage, verified proof, consistent
              business profiles, structured data, and a reliable path to contact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See our method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Why local discovery is changing</MonoLabel>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
              {why.map((w) => (
                <StaggerItem key={w.t} className="card p-6">
                  <h2 className="text-lg">{w.t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">What queryclear fixes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">The local signals people and systems need.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {fixes.map((f) => (
                <StaggerItem key={f.t} className="card p-6">
                  <h3 className="text-lg">{f.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Industries we serve</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Built for appointment-based local businesses.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {industries.map((i) => (
                <span key={i} className="border border-dashed border-line bg-paper px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink">{i}</span>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm text-muted">
              We go deepest on <a href="/med-spa-ai-search-optimization" className="font-medium text-ink underline hover:text-lime-deep">med spas</a>.
              Don&apos;t see yours? The approach applies to most local and service
              businesses — <a href="/contact" className="font-medium text-ink underline hover:text-lime-deep">ask us</a>.
            </p>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="04">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Check your local-search source material.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                The free automated preview checks public pages and labels its limits.
                The full human-reviewed audit is $497.
              </p>
            </div>
            <Cta href="/free-audit">Run a free audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
