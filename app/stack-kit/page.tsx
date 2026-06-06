import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { PreorderButton } from "@/components/PreorderButton";
import { site } from "@/lib/site";

const kit = site.stackKit;

export const metadata: Metadata = {
  title: "The Local AI Visibility Stack — DIY kit ($97 pre-order)",
  description:
    "Do the work yourself: a $97 DIY kit to apply queryclear's 7-layer AI Visibility method to your own site — playbook, schema templates, llms.txt, AI-visibility prompts, and a self-scoring scorecard. Founding pre-order, fully refundable.",
  alternates: { canonical: "/stack-kit" },
  openGraph: {
    title: "The Local AI Visibility Stack — DIY kit ($97 pre-order)",
    description:
      "The do-it-yourself version of our AI search method. Founding pre-order, fully refundable, ships within 30 days.",
  },
};

const whoFor = [
  "You're hands-on and would rather do the work yourself than hire it out.",
  "You have one local business and want a clear, do-it-in-a-weekend plan.",
  "You want to understand exactly what AI search readiness involves.",
];

const whoSkip = [
  "You'd rather we just do it — start with a free audit, then our done-for-you work.",
  "You don't have time to implement changes on your own site.",
];

const faqs = [
  {
    q: "Is the kit available right now?",
    a: `It's a founding pre-order. We're building it now and it ships within ${kit.shipDays} days of purchase. If you'd rather not wait, you can get a full refund anytime before delivery — and if we miss ${kit.shipDays} days, we refund you automatically.`,
  },
  {
    q: "What if I'd rather you just do it for me?",
    a: "Then skip the kit. Start with a free AI search audit and we'll handle the work for you — done-for-you audits start at $750.",
  },
  {
    q: "Does this guarantee I'll rank or get cited by AI?",
    a: "No — and you should distrust anyone who promises that. The kit helps you make your site genuinely clearer and more trustworthy to search and AI systems. That's the part you can actually control.",
  },
  {
    q: "Can I get a refund?",
    a: `Yes. It's fully refundable anytime before you receive the kit — just email ${site.email}. If we don't ship within ${kit.shipDays} days, we refund you automatically.`,
  },
  {
    q: "What format is it?",
    a: "Digital: a written playbook plus copy-paste templates (schema, llms.txt, a service-page structure) and a self-scoring scorecard. No physical product.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: kit.name,
  url: `${site.url}/stack-kit`,
  description:
    "A $97 DIY kit to apply queryclear's 7-layer AI Visibility method to your own site. Founding pre-order, fully refundable.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: kit.name,
  description:
    "A do-it-yourself kit to apply the 7-layer AI Visibility Stack to a local business website: playbook, schema templates, llms.txt template, AI-visibility prompt set, and a self-scoring scorecard.",
  brand: { "@type": "Brand", name: site.name },
  offers: {
    "@type": "Offer",
    price: kit.priceUsd.toFixed(2),
    priceCurrency: kit.currency.toUpperCase(),
    availability: "https://schema.org/PreOrder",
    url: `${site.url}/stack-kit`,
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
    { "@type": "ListItem", position: 2, name: kit.name, item: `${site.url}/stack-kit` },
  ],
};

export default function StackKitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="kit">Founding pre-order</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              The Local AI Visibility Stack — do the work yourself.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              The same 7-layer method we use on client sites, packaged as a
              do-it-yourself kit for one local business. A plain-English playbook,
              copy-paste templates, and a self-scoring scorecard — so you can make your
              site clearer to ChatGPT, Claude, Perplexity, Gemini, and Google&apos;s AI
              Overviews on your own.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PreorderButton label={`Pre-order — ${kit.priceLabel}`} />
              <span className="text-sm text-muted">Fully refundable · ships in {`${kit.shipDays} days`}</span>
            </div>
          </Container>
        </section>

        {/* What's inside */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What&apos;s inside</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Six parts, one weekend.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {kit.contents.map((c, i) => (
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
              {" "}— the same method behind our{" "}
              <Link href="/ai-visibility-audit" className="font-medium text-ink underline hover:text-lime-deep">
                done-for-you audits
              </Link>
              .
            </p>
          </Container>
        </section>

        {/* Who it's for / who should skip */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="02">Who it&apos;s for</MonoLabel>
              <ul className="mt-5 grid gap-3">
                {whoFor.map((w) => (
                  <li key={w} className="flex gap-3 text-ink">
                    <span aria-hidden="true" className="text-lime-deep">✓</span>
                    <span className="text-sm leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="03">Who should skip it</MonoLabel>
              <ul className="mt-5 grid gap-3">
                {whoSkip.map((w) => (
                  <li key={w} className="flex gap-3 text-muted">
                    <span aria-hidden="true">→</span>
                    <span className="text-sm leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm">
                <Link href="/ai-visibility-audit" className="font-medium text-ink underline hover:text-lime-deep">
                  Rather we did it? Start with a free audit →
                </Link>
              </p>
            </div>
          </Container>
        </section>

        {/* Pre-order terms */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">The pre-order, plainly</MonoLabel>
            <div className="mt-5 max-w-2xl border border-dashed border-line bg-paper p-6 sm:p-8">
              <p className="leading-relaxed text-ink">{kit.terms}</p>
            </div>
          </Container>
        </section>

        {/* Price + CTA */}
        <section className="border-b border-line bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6">
            <div>
              <p className="mono-label !text-paper/50">{kit.name}</p>
              <p className="mt-3 font-display text-6xl tnum text-paper">{kit.priceLabel}</p>
              <p className="mt-2 text-paper/70">One-time · fully refundable · ships in {`${kit.shipDays} days`}.</p>
            </div>
            <PreorderButton label={`Pre-order — ${kit.priceLabel}`} />
            <p className="max-w-md text-xs text-paper/50">
              Secure checkout by Stripe. This is a founding pre-order for a product
              we&apos;re building now — not a guarantee of rankings or AI citations.
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

        {/* Honest note */}
        <section className="bg-paper-2 py-12">
          <Container>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">An honest note: </span>
              the kit is do-it-yourself guidance, not a guarantee. We don&apos;t promise
              rankings or AI citations — no one credibly can. It helps you make your
              site genuinely clearer to search and AI systems, which is the part you
              control.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
