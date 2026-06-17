import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "llms.txt for Businesses",
  description:
    "What llms.txt is, what it may help with, and what it doesn't guarantee. An honest guide for businesses — including a sample format — and why crawlable, well-structured content still matters more.",
  alternates: { canonical: "/llms-txt-for-businesses" },
  openGraph: {
    title: "llms.txt for Businesses — queryclear",
    description: "An honest guide to llms.txt: what it is, what it may help with, and what it won't do.",
  },
};

const sample = `# Goldleaf Aesthetics & Med Spa

> Medical aesthetics & med spa in the Westhaven metro, with licensed RN injectors under a medical director.

## Key pages
- Home: https://example.com/
- Treatments: https://example.com/treatments
- Providers: https://example.com/providers
- Contact: https://example.com/contact

## What we do
- Botox & Dysport, dermal fillers, laser hair removal, medical-grade facials, microneedling

## Notes
- Service area: Westhaven metro. Providers: licensed RN injectors, medical director.`;

const faqs = [
  { q: "Do I need an llms.txt file?", a: "No. It isn't required to appear in search or AI results, and it isn't a ranking factor. It's a reasonable, low-cost optional extra — a supplemental file for AI-oriented tools. It won't rescue a site that machines can't otherwise understand. Treat it as a small supporting signal, never a strategy." },
  { q: "Will llms.txt make AI cite me?", a: "No. There's no guarantee any AI system reads or acts on it, and adoption is still early and uneven. It may help a machine find a clean summary of your pages; it does not make you get cited." },
  { q: "What matters more than llms.txt?", a: "Crawlable, helpful, well-structured pages with valid schema and clear entities. If you only do one thing, make your actual content and structure legible — that's what AI systems mostly rely on." },
];

const webPageSchema = { "@context": "https://schema.org", "@type": "WebPage", name: "llms.txt for Businesses", url: `${site.url}/llms-txt-for-businesses`, description: "An honest guide to llms.txt for businesses.", isPartOf: { "@type": "WebSite", name: site.name, url: site.url } };
const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` }, { "@type": "ListItem", position: 2, name: "llms.txt for Businesses", item: `${site.url}/llms-txt-for-businesses` } ] };

export default function LlmsTxtPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="llms">llms.txt</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">llms.txt for businesses, honestly.</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              <code className="font-mono text-ink">llms.txt</code> is a plain-text file
              that gives AI-oriented tools a clean summary of your business and key
              pages. It&apos;s not required for search visibility and it isn&apos;t
              a ranking factor — it&apos;s an optional supplemental file, and it
              won&apos;t do the heavy lifting. Here&apos;s the straight version.
            </p>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="01">What it may help with</MonoLabel>
              <ul className="mt-5 grid gap-3">
                {["Offering a clean, machine-readable summary of who you are", "Pointing AI systems to your most important pages", "Stating your services and service area plainly in one place"].map((m) => (
                  <li key={m} className="flex gap-3 text-ink"><span aria-hidden="true" className="text-lime-deep">✓</span><span className="text-muted">{m}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="02">What it does not do</MonoLabel>
              <ul className="mt-5 grid gap-3">
                {["Guarantee that any AI reads it or acts on it", "Replace crawlable, well-structured content", "Make you get cited or ranked", "Fix a site machines otherwise can't understand"].map((m) => (
                  <li key={m} className="flex gap-3 text-ink"><span aria-hidden="true" className="text-red-600">✗</span><span className="text-muted">{m}</span></li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="03">A sample llms.txt</MonoLabel>
            <p className="mt-3 max-w-2xl text-sm text-muted">A simple, honest structure. (Demo values for a fictional business.)</p>
            <pre className="machine-panel mt-6 max-w-2xl overflow-x-auto"><code>{sample}</code></pre>
            <p className="mt-4 text-sm text-muted">Want to see a real one? Ours lives at <a href="/llms.txt" className="font-medium text-ink underline hover:text-lime-deep">/llms.txt</a> — we dogfood it.</p>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div><MonoLabel index="04">Our recommendation</MonoLabel></div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>Add an llms.txt if you like — it&apos;s cheap and tidy. But spend your real effort on the things search systems actually depend on: useful content, clear service pages, crawlability, local details, metadata, and a better user experience.</p>
              <p>If you ever hear someone sell llms.txt as <em>the</em> way to win AI search, be skeptical. It&apos;s a small optional extra, not a strategy — and nobody should charge you much for one.</p>
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="05">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Want the whole picture, not just a file?</h2>
              <p className="mt-3 max-w-xl text-paper/70">Our audit covers the structure and content that actually matter — llms.txt included as a footnote. Run a free audit; the full audit is $497.</p>
            </div>
            <Cta href="/free-audit">Run a free audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
