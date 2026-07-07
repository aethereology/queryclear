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
    "See how clearly modern search understands your business. The queryclear AI Search Audit ($497) scores your site across seven readiness categories and is walked through with you live — and the $497 is credited in full toward a Website Upgrade if you go ahead. Run a free instant audit first.",
  alternates: { canonical: "/ai-visibility-audit" },
  openGraph: {
    title: "AI Search Audit — queryclear",
    description:
      "A scored review of your site, walked through with you live — and credited toward your upgrade if you go ahead.",
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
  "A live walkthrough of the findings — ask questions in real time",
  "A prioritized fix list — biggest impact first, in plain English",
  "Your $497 credited in full toward an upgrade if you go ahead",
];

const steps = [
  { t: "Buy the audit", d: "Pay $497 and tell us your site at checkout. We start as soon as it's purchased — no scheduling tag to get the work moving." },
  { t: "We run it, then walk you through it live", d: "We score all seven layers and run AI-visibility tests, then sit down with you on a short live call to walk through exactly what we found and what to fix first." },
  { t: "Decide — and the $497 is credited", d: "Keep the roadmap and run it yourself, or have us do it. If you go ahead with a Website Upgrade, your $497 is credited in full toward it." },
];

const faqs = [
  { q: "How much does it cost?", a: "The free AI Search Audit at /free-audit is free — an instant, read-only read on your biggest opportunities. The full AI Search Audit, with scoring, prompt testing, a live walkthrough, and a prioritized fix roadmap, is $497." },
  { q: "Is the $497 credited toward the upgrade?", a: "Yes. If you decide to have us do the work, your $497 is credited in full toward a Website Upgrade (from $2,500) — so the audit effectively becomes free when you go ahead. There's no obligation: you can also just keep the roadmap." },
  { q: "What's the live walkthrough?", a: "After we run the audit, we get on a short call and walk you through the findings in plain English — what's working, what's holding you back, and what to do first. You can ask questions in real time instead of decoding a PDF alone." },
  { q: "Do you guarantee I'll rank or get cited?", a: "No — and you should distrust anyone who does. We make your site genuinely clearer and more trustworthy to search and AI systems. That's the part we control, and we do it well." },
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
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Search Audit",
  serviceType: "Modern SEO / AI search readiness audit",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "A scored review of a website's readiness for search engines and AI-powered results, with a prioritized fix roadmap and real AI-visibility test results.",
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
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="audit">AI Search Audit · $497</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              See how modern search understands your business.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              When someone asks Google, ChatGPT, Claude, Perplexity, or Gemini
              for a business like yours, do you show up — clearly and
              accurately? The AI Search Audit scores your site across seven
              readiness categories, then we walk you through the findings live
              and hand you a prioritized fix roadmap. And if you go ahead with an
              upgrade, the $497 is credited in full. Not sure yet? Run a free
              instant audit first.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CheckoutButton product="ai-search-audit" label="Buy the audit — $497" />
              <Cta href="/free-audit" variant="ghost">Run a free audit</Cta>
              <Cta href="/audit" variant="ghost">See a sample report</Cta>
            </div>
            <p className="mt-3 text-xs text-muted">
              Secure checkout via Stripe. We start as soon as it&apos;s purchased,
              then schedule your live walkthrough. The $497 is credited toward a
              Website Upgrade if you proceed.
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
              <h2 className="text-3xl text-paper sm:text-4xl">Get your AI Search Audit.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Ready to go? Buy the $497 audit now — we start as soon as it&apos;s
                purchased, walk you through it live, and credit the $497 toward an
                upgrade if you proceed. Want to talk first, or prefer a free read?
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
