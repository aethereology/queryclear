import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Search Audit",
  description:
    "Get a human-reviewed, seven-layer website audit, labeled answer samples, a prioritized roadmap, and a 45-minute walkthrough for $497.",
  alternates: { canonical: "/ai-visibility-audit" },
  openGraph: {
    title: "AI Search Audit — queryclear",
    description:
      "A scored review of your site with a live walkthrough and a credit toward qualifying implementation.",
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
  `One public website: up to ${site.auditProduct.pageLimit} public URLs`,
  "Seven layer scores with evidence, source URLs, and the published normalization formula",
  "Technical checks covering indexability, metadata, canonicals, headings, internal links, and structured data",
  `Up to ${site.auditProduct.promptLimit} total prompt-engine observations, distributed across up to ${site.auditProduct.engineLimit} named engines selected at kickoff. Each prompt × engine check consumes one observation`,
  "Timestamped answer samples labeled by engine, prompt, access method, and whether the result was live, modeled, or manually observed",
  "A prioritized roadmap separating confirmed defects, content gaps, and optional experiments",
  `A ${site.auditProduct.walkthroughMinutes}-minute walkthrough and ${site.auditProduct.correctionRounds} factual-correction round`,
  `The $497 credited once toward a Website Upgrade or Website Build of $${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more, contracted within ${site.auditProduct.creditDays} days`,
];

const notIncluded = [
  "Editing your website, Google Business Profile, listings, analytics, or third-party accounts",
  "A comprehensive security, legal, privacy, accessibility, or medical-claims review",
  "Private, login-gated, staging, or app content unless separately scoped",
  "Guaranteed rankings, traffic, leads, recommendations, or citations",
];

const steps = [
  { t: "Purchase and complete intake", d: "Pay $497, submit one public website, and confirm the services, markets, and facts we should evaluate. The delivery clock starts when intake is complete." },
  { t: "We verify and document", d: `We review up to ${site.auditProduct.pageLimit} public URLs and deliver within 7 business days. Every finding is tied to observable evidence; answer samples are labeled by source and method.` },
  { t: "Walk through and decide", d: `We meet for ${site.auditProduct.walkthroughMinutes} minutes. Keep the roadmap, implement it yourself, or apply the $497 once to a Website Upgrade or Website Build of $${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more, contracted within ${site.auditProduct.creditDays} days.` },
];

const faqs = [
  { q: "How much does it cost?", a: "The free product at /free-audit is an automated, read-only readiness preview. The full human-reviewed AI Search Audit is $497 and includes evidence-linked scoring, labeled answer samples, a written roadmap, and a walkthrough." },
  { q: "What is the scope and turnaround?", a: `The fixed price covers one public website, up to ${site.auditProduct.pageLimit} public URLs, and up to ${site.auditProduct.promptLimit} total prompt-engine observations distributed across up to ${site.auditProduct.engineLimit} named engines selected at kickoff. Each prompt × engine check consumes one observation, so checking the same prompt in three engines uses three observations. Delivery is within 7 business days after complete intake. Private systems, extra sites, and implementation require a separate scope.` },
  { q: "Is the $497 credited toward implementation?", a: `Yes. The fee can be applied once to a Website Upgrade or Website Build of $${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more for the same site when you sign the implementation agreement within ${site.auditProduct.creditDays} days of report delivery. It is not cash, cannot exceed the implementation fee, and cannot be combined with another credit unless agreed in writing.` },
  { q: "What's the live walkthrough?", a: `A ${site.auditProduct.walkthroughMinutes}-minute call covering evidence, priorities, limitations, and next steps. One factual-correction round is included after delivery.` },
  { q: "Can I cancel or request a refund?", a: `Email ${site.email} immediately. We provide a full refund if substantive audit work has not begun. Once research begins, the fee is non-refundable except where required by law or if we cannot deliver the agreed scope. Client delays pause the delivery timeline.` },
  { q: "Do you guarantee I'll rank or get cited?", a: "No. Third-party search and AI systems control their own rankings and answers. We document the site's observable technical, clarity, proof, answer-coverage, and conversion gaps; the report is not an outcome forecast." },
  { q: "What do you need from me?", a: "Your website URL and a few real details about your business. We only ever work from accurate, verified information." },
  { q: "Can I do it myself instead?", a: "Yes — the audit gives you a prioritized roadmap you're free to run on your own. And every Website Upgrade now includes the Local AI Visibility Stack (our playbook and copy-paste templates) free, so the do-it-yourself toolkit comes with the done-for-you work." },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Visibility Audit",
  url: `${site.url}/ai-visibility-audit`,
  description:
    "Score your site's AI search readiness across seven categories with a prioritized fix list.",
  isPartOf: { "@id": site.schemaIds.website },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Search Audit",
  serviceType: "Modern SEO / AI search readiness audit",
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  description:
    "A human-reviewed website-readiness audit with evidence-linked scoring, labeled answer samples, a prioritized roadmap, and a live walkthrough.",
  areaServed: "United States",
  offers: {
    "@type": "Offer",
    price: "497",
    priceCurrency: "USD",
  },
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
      <main id="main-content">
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="audit">AI Search Audit · $497</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              A human-reviewed plan for a clearer website.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Get an evidence-linked review of one public website: seven readiness
              scores, technical findings, clearly labeled answer samples, and a
              prioritized roadmap. We deliver within seven business days after
              complete intake and walk through the report with you for 45 minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CheckoutButton product="ai-search-audit" label="Buy the audit — $497" />
              <Cta href="/free-audit" variant="ghost">Run a free preview</Cta>
              <Cta href="/audit" variant="ghost">See a sample report</Cta>
            </div>
            <p className="mt-3 text-xs text-muted">
              Secure checkout via Stripe. Scope, delivery, refund, and credit terms
              are stated below and incorporated into our Terms of Service.
            </p>
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
              <MonoLabel index="02">What the $497 audit includes</MonoLabel>
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

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="03">Not included</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">Clear boundaries.</h2>
            </div>
            <ul className="grid max-w-2xl gap-3">
              {notIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="text-muted">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Who / how long / after */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">How it works</MonoLabel>
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
              local and service businesses that want an evidence-backed view of how
              clearly their public website explains the business, services, markets,
              proof, buyer answers, and next step.
            </p>
          </Container>
        </section>

        {/* No guarantee */}
        <section className="border-b border-line bg-paper-2 py-12">
          <Container>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">An honest note: </span>
              we don&apos;t guarantee rankings or AI citations — no one credibly can.
              We measure documented website-readiness evidence and bounded answer
              samples. Search and AI systems control their own outputs.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="05">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        {/* Form CTA */}
        <section id="audit-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Get your AI Search Audit.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Ready to go? Buy the fixed-scope $497 audit now. Delivery is within
                seven business days after complete intake, followed by a 45-minute
                walkthrough. Want to talk first, or prefer a free readiness preview?
                Tell us about your site below, or{" "}
                <a href="/free-audit" className="underline hover:text-lime">
                  run a free audit
                </a>
                .
              </p>
              <div className="mt-6">
                <CheckoutButton product="ai-search-audit" label="Buy now — $497" />
              </div>
            </div>
            <LeadForm defaultNeed="AI Search Audit ($497)" submitLabel="Request my audit" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
