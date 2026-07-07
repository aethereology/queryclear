import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

const plan = site.carePlan;

export const metadata: Metadata = {
  title: "AI Search Care Plan",
  description:
    "Keep your site's modern-search readiness from drifting. The AI Search Care Plan is a human-delivered monthly retainer ($997/month, cancel anytime): a re-audit, up to two updates a month, and a measured score and AI-citation watch. We report what we measure — never a guarantee of rankings or citations.",
  alternates: { canonical: "/care-plan" },
  openGraph: {
    title: "AI Search Care Plan — queryclear",
    description:
      "A human-delivered monthly retainer that keeps your site clear to search and AI engines as they change. $997/month, cancel anytime.",
  },
};

const steps = [
  {
    t: "We set the baseline",
    d: "Month one, we re-audit your site across the seven readiness layers and record where AI answer engines stand on your business today.",
  },
  {
    t: "We keep it current",
    d: "Each month we apply up to two content or schema updates and re-check the score, so your site keeps pace as search and AI systems shift.",
  },
  {
    t: "You see what moved",
    d: "You get a short, plain-English report: what we changed, what the score did, and how AI engines describe you now. No dashboards to babysit.",
  },
];

const faqs = [
  {
    q: "How is this different from the AI Search Operator?",
    a: "The AI Search Operator is an agentic product for B2B SaaS teams (early access) — software that proposes work for a person to approve. The Care Plan is human-delivered monthly work for local and service businesses: we do the re-audit and updates ourselves.",
  },
  {
    q: "Do I have to sign a contract?",
    a: "No. It's month-to-month at $997/month. Cancel anytime, no cancellation fee — you keep the month you've paid for.",
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
    a: `Anytime — from the link on your Stripe receipt, or just email ${site.email} and we'll take care of it. No retention runaround.`,
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: plan.name,
  url: `${site.url}/care-plan`,
  description:
    "A human-delivered monthly retainer that keeps a website's modern-search readiness current: re-audit, updates, and a measured score and citation watch.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: plan.name,
  serviceType: "Recurring modern SEO / AI search readiness retainer",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "A monthly retainer that maintains a website's readiness for search engines and AI answer engines: a monthly re-audit, up to two content or schema updates, and a measured readiness score and AI-citation watch.",
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
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="care">{plan.name} · {plan.priceLabel}</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Keep your site clear to AI — every month, not just once.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              A one-time audit or upgrade fixes today. But search engines and AI
              answer engines keep changing — and a site that was clear last quarter
              can quietly drift. The {plan.name} is a human-delivered monthly retainer
              that keeps your readiness current: a re-audit, hands-on updates, and a
              report on how AI engines actually describe your business.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CheckoutButton product="care-plan" label={`Start the Care Plan — ${plan.priceLabel}`} />
              <Cta href="#care-cta" variant="ghost">Talk to us first</Cta>
              <Cta href="/free-audit" variant="ghost">Run a free audit</Cta>
            </div>
            <p className="mt-3 text-xs text-muted">
              Secure recurring checkout via Stripe. {plan.priceLabel}, billed monthly —
              cancel anytime, no contract.
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

        {/* How it works */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">How it works</MonoLabel>
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
              audit, an upgrade, or a build — and want it to stay current instead of
              going stale.
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
              your readiness score and how AI engines describe you, and we report what
              we find. That&apos;s the part we control.
            </p>
          </Container>
        </section>

        {/* Price + CTA */}
        <section className="border-b border-line bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6">
            <div>
              <p className="mono-label !text-paper/50">{plan.name}</p>
              <p className="mt-3 font-display text-6xl tnum text-paper">{plan.priceLabel}</p>
              <p className="mt-2 text-paper/70">Billed monthly · cancel anytime · no contract.</p>
            </div>
            <CheckoutButton product="care-plan" label={`Start the Care Plan — ${plan.priceLabel}`} />
            <p className="max-w-md text-xs text-paper/50">
              Secure recurring checkout by Stripe. We report what we measure — this is
              not a guarantee of rankings or AI citations.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        {/* Form CTA */}
        <section id="care-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Want to talk it through first?</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Ready to start? Begin the {plan.priceLabel} plan above. Prefer to ask a
                question or see if it fits your business first? Tell us about your site
                and a real person will reply — not a sales bot.
              </p>
              <div className="mt-6">
                <CheckoutButton product="care-plan" label={`Start now — ${plan.priceLabel}`} />
              </div>
            </div>
            <LeadForm defaultNeed="AI Search Care Plan" submitLabel="Ask about the Care Plan" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
