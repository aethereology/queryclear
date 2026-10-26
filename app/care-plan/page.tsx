import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

const plan = site.carePlan;

export const metadata: Metadata = {
  title: "AI Search Care Plan",
  description:
    "Monthly modern-search maintenance for eligible service websites: a re-audit, up to two defined updates, and documented answer samples for $997/month.",
  alternates: { canonical: "/care-plan" },
  openGraph: {
    title: "AI Search Care Plan — queryclear",
    description:
      "Human-delivered maintenance for eligible service websites: $997/month under a month-to-month enrollment.",
  },
};

const steps = [
  {
    t: "We set the baseline",
    d: "Month one, we re-audit your public site across the seven readiness layers and record labeled answer samples for the agreed prompts and engines.",
  },
  {
    t: "We keep it current",
    d: "Each month we apply up to two pre-approved, defined updates and re-score the agreed public pages.",
  },
  {
    t: "You see what moved",
    d: "You get a short report documenting what changed, how the readiness score moved, and what the labeled answer samples showed.",
  },
];

const eligibility = [
  "The site has completed a queryclear audit, upgrade, or build — or passes a baseline review before enrollment",
  "You can provide authorized CMS or repository access and approve changes before publication",
  "The existing platform can support scoped content, metadata, schema, and internal-link updates without a rebuild",
  "There is one named client approver and verified source material for every business, service, credential, and regulated claim",
];

const boundaries = [
  "One update means one small change to one existing page or shared template: copy, metadata, schema, or internal links",
  "Up to two updates are included per billing month and unused updates do not roll over",
  "New pages, redesigns, migrations, custom development, emergency fixes, and third-party fees are quoted separately",
  "Changes are scheduled after required access, source material, and approval are available",
];

const faqs = [
  {
    q: "How is this different from a one-time upgrade?",
    a: "A Website Upgrade is a fixed-scope implementation project. The Care Plan is human-delivered monthly maintenance for an eligible existing site: a re-audit, up to two defined updates, and documented answer samples.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. The plan is month-to-month at $997/month after eligibility is approved. Cancel before the next renewal to stop future billing; service continues through the paid billing period. Fees already billed are not prorated except where required by law.",
  },
  {
    q: "Do you guarantee my rankings or AI citations will improve?",
    a: "No — and you should distrust anyone who does. We do the ongoing work to keep your site clear and trustworthy to search and AI systems, and we report what we actually measure. That's the part we control.",
  },
  {
    q: "What if I just had an audit or upgrade?",
    a: "That's the ideal time to start. The Care Plan keeps that work from drifting as engines change, instead of letting a one-time fix slowly go stale.",
  },
  {
    q: "How do I cancel?",
    a: `Email ${site.email} before the next renewal. We confirm the effective cancellation date in writing. There is no cancellation fee or long-term commitment.`,
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: plan.name,
  url: `${site.url}/care-plan`,
  description:
    "A human-delivered monthly retainer that keeps a website's modern-search readiness current: re-audit, updates, and a measured score and citation watch.",
  isPartOf: { "@id": site.schemaIds.website },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: plan.name,
  serviceType: "Recurring modern SEO / AI search readiness retainer",
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  description:
    "Eligibility-reviewed monthly website maintenance: a re-audit, up to two bounded updates, and documented answer samples.",
  areaServed: "United States",
  offers: {
    "@type": "Offer",
    priceCurrency: plan.currency.toUpperCase(),
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: plan.priceUsd.toFixed(2),
      priceCurrency: plan.currency.toUpperCase(),
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: "MON",
    },
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
    { "@type": "ListItem", position: 2, name: plan.name, item: `${site.url}/care-plan` },
  ],
};

export default function CarePlanPage() {
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
            <MonoLabel index="care">{plan.name} · {plan.priceLabel}</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Keep your website clear, current and working.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              A human-delivered maintenance plan for sites that already have a sound
              baseline. Each month includes a re-audit, up to two clearly bounded
              updates, and documented answer samples. We confirm platform, access,
              baseline, and approval fit before billing begins.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Cta href="#care-cta">Check eligibility</Cta>
              <Cta href="/free-audit" variant="ghost">Run a free preview</Cta>
            </div>
            <p className="mt-3 text-xs text-muted">
              {plan.priceLabel}, billed month-to-month after written eligibility
              approval. No long-term commitment.
            </p>
          </Container>
        </section>

        {/* What's included */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What every month includes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Done for you, every month.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {plan.includes.map((c, i) => (
                <StaggerItem key={c.title} className="card flex gap-4 p-6">
                  <span className="font-display text-2xl text-lime-deep">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-6 max-w-2xl text-sm text-muted">
              Built on{" "}
              <Link href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                the AI Visibility Stack
              </Link>
              {" "}— the same seven-layer method behind our{" "}
              <Link href="/ai-visibility-audit" className="font-medium text-ink underline hover:text-lime-deep">
                audit
              </Link>
              {" "}and upgrades.
            </p>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="02">Eligibility</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">A maintenance plan, not a rescue plan.</h2>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-muted">
                {eligibility.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="text-lime-deep">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="scope">What an update means</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">The monthly boundary is explicit.</h2>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-muted">
                {boundaries.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">How it works</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Three steps, repeated monthly.</h2>
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
              local and service businesses that have already done the work once — an
              audit, an upgrade, or a build — and want a defined recurring review
              and update cadence.
            </p>
          </Container>
        </section>

        {/* No guarantee */}
        <section className="border-b border-line py-12">
          <Container>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">An honest note: </span>
              we don&apos;t guarantee rankings or AI citations — no one credibly can.
              The Care Plan is ongoing, hands-on work plus honest measurement: we track
              your readiness score and labeled answer samples, and report the method,
              date, prompt, engine, and observations.
            </p>
          </Container>
        </section>

        {/* Price + eligibility CTA */}
        <section className="border-b border-line bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6">
            <div>
              <p className="mono-label !text-paper/70">{plan.name}</p>
              <p className="mt-3 font-display text-4xl sm:text-6xl tnum text-paper">{plan.priceLabel}</p>
              <p className="mt-2 text-paper/70">
                Billed month-to-month after eligibility approval · no long-term commitment.
              </p>
            </div>
            <Cta href="#care-cta">Check eligibility</Cta>
            <p className="max-w-md text-xs text-paper/70">
              Billing does not begin from this page. We first confirm baseline,
              access, scope, and approval fit in writing.
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
        <section id="care-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Check Care Plan eligibility.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Tell us about your site and current platform. A real person reviews
                the baseline, access needs, and likely monthly scope before sending
                any enrollment or billing link.
              </p>
            </div>
            <LeadForm defaultNeed="AI Search Care Plan" submitLabel="Check my eligibility" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
