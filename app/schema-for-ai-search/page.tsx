import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Schema for AI Search",
  description:
    "Structured data (schema / JSON-LD) gives search engines and AI answer engines reliable facts about your business. A plain-English guide to which schema types matter — Organization, LocalBusiness, Service, FAQPage — with simple examples and common mistakes.",
  alternates: { canonical: "/schema-for-ai-search" },
  openGraph: {
    title: "Schema for AI Search — queryclear",
    description: "Which structured data types matter for AI search, in plain English, with examples.",
  },
};

const types = [
  { t: "Organization", d: "Who the business is: name, URL, parent company, contact." },
  { t: "LocalBusiness", d: "A local business with a real location and/or service area, hours, and geography." },
  { t: "Service", d: "A specific service you offer, tied to your business and area." },
  { t: "FAQPage", d: "Question-and-answer content a machine can quote directly." },
  { t: "BreadcrumbList", d: "Where a page sits in your site, so its context is clear." },
  { t: "WebSite / WebPage", d: "The site and each page as identifiable entities." },
];

const mistakes = [
  "Marking up details you can't verify (invented hours, ratings, addresses)",
  "Using LocalBusiness when there's no real location or service area",
  "Schema that doesn't match what's visible on the page",
  "Invalid JSON-LD that silently fails validation",
  "Copy-pasted schema left with placeholder values",
];

const example = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Goldleaf Aesthetics & Med Spa",
  "url": "https://example.com",
  "areaServed": "Westhaven",
  "telephone": "+1-555-0100"
}
</script>`;

const faqs = [
  { q: "Is schema a ranking hack?", a: "No. Schema doesn't trick anything — it gives machines reliable, structured facts about your business so they can describe it accurately. It's clarity, not a hack, and we only mark up details that are true." },
  { q: "Which types does my business need?", a: "It depends on what's real. Most service businesses benefit from Organization (or LocalBusiness), Service, FAQPage, and BreadcrumbList. We only add a type when your verified data supports it." },
  { q: "Can't I just install a plugin?", a: "Plugins can generate schema, but they often emit invalid or inaccurate markup — placeholder values, types that don't fit, or claims that don't match the page. We build and validate schema from your real details." },
];

const webPageSchema = { "@context": "https://schema.org", "@type": "WebPage", name: "Schema for AI Search", url: `${site.url}/schema-for-ai-search`, description: "A plain-English guide to structured data for AI search.", isPartOf: { "@type": "WebSite", name: site.name, url: site.url } };
const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` }, { "@type": "ListItem", position: 2, name: "Schema for AI Search", item: `${site.url}/schema-for-ai-search` } ] };

export default function SchemaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="schema">Structured data</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">Schema, in plain English.</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Schema — also called structured data or JSON-LD — is a small block of
              code that hands search engines and AI answer engines reliable facts
              about your business: who you are, what you do, where, and how to reach
              you. It&apos;s how a machine reads you without guessing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/ai-visibility-audit">Audit my structured data</Cta>
              <Cta href="/ai-search-ready-website" variant="ghost">AI-search-ready websites</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Which types matter</MonoLabel>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {types.map((t) => (
                <StaggerItem key={t.t} className="card p-6">
                  <h2 className="font-mono text-base text-ink">{t.t}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">A simple example</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">What LocalBusiness schema looks like.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">Simplified, using only real fields. (Demo values shown for a fictional business.)</p>
            <pre className="machine-panel mt-6 max-w-2xl overflow-x-auto"><code>{example}</code></pre>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Common mistakes</MonoLabel>
            <ul className="mt-8 grid max-w-3xl gap-3">
              {mistakes.map((m) => (
                <li key={m} className="flex gap-3 text-ink"><span aria-hidden="true" className="text-red-600">✗</span><span>{m}</span></li>
              ))}
            </ul>
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
              <h2 className="text-3xl text-paper sm:text-4xl">Is your schema right — or just present?</h2>
              <p className="mt-3 max-w-xl text-paper/70">Our audit checks what schema you have, what&apos;s missing, and what&apos;s invalid. Run a free audit; the full audit is $497.</p>
            </div>
            <Cta href="/ai-visibility-audit">Audit my structured data</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
