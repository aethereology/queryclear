import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Visibility Audit",
  description:
    "See how clearly AI search engines understand your business. The queryclear AI visibility audit scores your site across seven readiness categories and gives you a prioritized, plain-English fix list. Free to start; paid reports from $750.",
  alternates: { canonical: "/ai-visibility-audit" },
  openGraph: {
    title: "AI Visibility Audit — queryclear",
    description:
      "See how clearly AI search engines understand your business, and exactly what to fix first.",
  },
};

const categories = [
  { t: "Entity clarity", d: "Can a machine identify who you are, your category, and where you operate?" },
  { t: "Service specificity", d: "Is each service stated clearly enough to match a real customer question?" },
  { t: "Proof density", d: "Are there enough honest, credible trust signals to be taken seriously?" },
  { t: "Local relevance", d: "Are you clearly tied to the places you actually serve?" },
  { t: "Answer coverage", d: "Does the site directly answer the questions buyers ask before choosing?" },
  { t: "Machine readability", d: "Can search and AI systems crawl, parse, and summarize the site cleanly?" },
  { t: "Conversion path", d: "Once someone lands, is the next step obvious and easy to take?" },
];

const receive = [
  "Your current readiness scored across all seven categories",
  "Real AI-visibility test results for your category and city",
  "A prioritized fix list — biggest impact first, in plain English",
  "Specific, concrete recommendations (not a generic checklist)",
];

const steps = [
  { t: "You submit", d: "Tell us your site and a little about your business — takes about two minutes." },
  { t: "We review", d: "We run AI-visibility tests and score your site against the AI Visibility Stack." },
  { t: "You get findings", d: "We send your audit with a prioritized, plain-English fix list. No obligation." },
];

const faqs = [
  { q: "How much does it cost?", a: "The starter audit is free. If you want the full scored report with deeper analysis, paid audits start at $750." },
  { q: "How long does it take?", a: "Submitting the form takes about two minutes. We usually send your findings within a couple of business days." },
  { q: "Do you guarantee I'll rank or get cited?", a: "No — and you should distrust anyone who does. We make your site genuinely clearer and more trustworthy to search and AI systems. That's the part we control, and we do it well." },
  { q: "What do you need from me?", a: "Your website URL and a few real details about your business. We only ever work from accurate, verified information." },
  { q: "Can I do it myself instead?", a: "Yes. We offer a $97 DIY kit — The Local AI Visibility Stack — with the playbook and copy-paste templates to apply the same method on your own. It's a refundable founding pre-order; find it at queryclear.com/stack-kit." },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Visibility Audit",
  url: `${site.url}/ai-visibility-audit`,
  description:
    "Score your site's AI search readiness across seven categories with a prioritized fix list.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Visibility Audit",
  serviceType: "AI search optimization audit",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "A scored review of a website's readiness for search engines and AI answer engines, with a prioritized fix list and real AI-visibility test results.",
  areaServed: "United States",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "AI Visibility Audit", item: `${site.url}/ai-visibility-audit` },
  ],
};

export default function AuditLandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="audit">AI visibility audit</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              See how AI search understands your business.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              When someone asks ChatGPT, Claude, Perplexity, Gemini, or Google&apos;s
              AI Overviews for a business like yours, do you show up — clearly and
              accurately? Our audit scores your site across seven readiness
              categories and shows you exactly what to fix first.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="#audit-cta">Book a free AI search audit</Cta>
              <Cta href="/audit" variant="ghost">See a sample audit</Cta>
            </div>
          </Container>
        </section>

        {/* What it checks */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What the audit checks</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Seven readiness categories.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              These are the layers of the{" "}
              <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                AI Visibility Stack
              </a>
              . We score each one against your actual site.
            </p>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {categories.map((c, i) => (
                <StaggerItem key={c.t} className="card flex gap-4 p-6">
                  <span className="font-display text-2xl text-lime-deep">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg">{c.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.d}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* What you receive */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="02">What you receive</MonoLabel>
            </div>
            <ul className="grid max-w-2xl gap-3">
              {receive.map((r) => (
                <li key={r} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="text-lime-deep">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Who / how long / after */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">How it works</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Three steps, no obligation.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.t} className="card p-6">
                  <span className="font-display text-3xl text-lime-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">Who it&apos;s for: </span>
              local and service businesses whose customers increasingly ask AI for
              recommendations — and who want to know, honestly, how they currently
              show up.
            </p>
          </Container>
        </section>

        {/* No guarantee */}
        <section className="border-b border-line bg-paper-2 py-12">
          <Container>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">An honest note: </span>
              we don&apos;t guarantee rankings or AI citations — no one credibly can.
              We make your business genuinely clearer and more trustworthy to search
              and AI systems. That&apos;s the part we control, and it&apos;s what the
              audit measures.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        {/* Form CTA */}
        <section id="audit-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Book your free AI search audit.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Tell us about your site and we&apos;ll review how AI answer engines see
                it today — with a prioritized fix list. Free, no obligation. Paid
                reports start at $750.
              </p>
            </div>
            <LeadForm />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
