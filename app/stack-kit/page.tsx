import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

const kit = site.stackKit;

// The Local AI Visibility Stack is no longer a standalone public SKU (the $97
// pre-order demand test was retired 2026-06-23). Its contents are now bundled
// free with every Website Upgrade. This page is kept reachable for old inbound
// links but is noindexed and unlinked from nav/sitemap/llms.txt.
export const metadata: Metadata = {
  title: "The Local AI Visibility Stack — included with every Upgrade",
  description:
    "The Local AI Visibility Stack — our 7-layer playbook, copy-paste schema templates, AI-visibility prompts, and a self-scoring scorecard — is now included free with every queryclear Website Upgrade.",
  alternates: { canonical: "/stack-kit" },
  robots: { index: false, follow: false },
};

const faqs = [
  {
    q: "Can I still buy the kit on its own?",
    a: "No — we retired the standalone kit. Its full contents now come free with every Website Upgrade, so you get the do-it-yourself toolkit alongside the done-for-you work instead of choosing between them.",
  },
  {
    q: "What if I just want to do it myself?",
    a: "Start with a free AI Search audit to see your biggest opportunities, then a $497 AI Search Audit gives you a prioritized, plain-English roadmap you're free to run on your own. If you'd like us to do the work, every Upgrade includes the Stack's templates and playbook.",
  },
  {
    q: "Does any of this guarantee I'll rank or get cited by AI?",
    a: "No — and you should distrust anyone who promises that. The Stack helps you make your site genuinely clearer and more trustworthy to search and AI systems. That's the part you can actually control.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: kit.name,
  url: `${site.url}/stack-kit`,
  description:
    "The Local AI Visibility Stack — our 7-layer playbook and templates — is included free with every queryclear Website Upgrade.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="kit">Included with every Upgrade</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              The Local AI Visibility Stack — now part of every Upgrade.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              The same 7-layer method we use on client sites — a plain-English
              playbook, copy-paste templates, and a self-scoring scorecard — used to
              be a separate DIY kit. It&apos;s now bundled <span className="font-medium text-ink">free</span> with
              every queryclear{" "}
              <Link href="/#offers" className="font-medium text-ink underline hover:text-lime-deep">
                Website Upgrade
              </Link>
              , so you get the do-it-yourself toolkit alongside the done-for-you work.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Cta href="/#offers">See the Upgrade</Cta>
              <Cta href="/free-audit" variant="ghost">Run a free audit</Cta>
            </div>
          </Container>
        </section>

        {/* What's inside */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What&apos;s in the Stack</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Six parts, included free.</h2>
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
                audit
              </Link>
              {" "}and upgrades.
            </p>
          </Container>
        </section>

        {/* How to get it */}
        <section className="border-b border-line bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6">
            <div>
              <p className="mono-label !text-paper/50">{kit.name}</p>
              <p className="mt-3 font-display text-5xl text-paper sm:text-6xl">Included free</p>
              <p className="mt-2 text-paper/70">with every Website Upgrade — no separate purchase.</p>
            </div>
            <Cta href="/#offers">See the Upgrade</Cta>
            <p className="max-w-md text-xs text-paper/50">
              Want a prioritized roadmap first? The $497 AI Search Audit is credited
              toward your upgrade if you go ahead.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="02">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        {/* Honest note */}
        <section className="bg-paper-2 py-12">
          <Container>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
              <span className="font-medium text-ink">An honest note: </span>
              the Stack is guidance and templates, not a guarantee. We don&apos;t promise
              rankings or AI citations — no one credibly can. It helps make your site
              genuinely clearer to search and AI systems, which is the part you control.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
