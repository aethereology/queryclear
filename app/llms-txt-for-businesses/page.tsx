import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "llms.txt for Businesses",
  description:
    "An honest business guide to llms.txt: what it is, when it is worth publishing, what it cannot guarantee, and how to write a useful file without confusing it for an AI-search strategy.",
  alternates: { canonical: "/llms-txt-for-businesses" },
  openGraph: {
    title: "llms.txt for Businesses - queryclear",
    description:
      "What llms.txt is, when it helps, what it will not do, and how businesses should use it alongside crawlable content and schema.",
  },
};

const verdicts = [
  {
    t: "Worth doing",
    d: "A concise llms.txt file is cheap to publish and can point AI-oriented tools toward your best pages.",
  },
  {
    t: "Not magic",
    d: "It is not a ranking factor, access-control file, citation guarantee, or replacement for your actual website.",
  },
  {
    t: "Best as a support layer",
    d: "Use it after the site itself is crawlable, specific, structured, and useful.",
  },
];

const helps = [
  "Summarizing who the business is in one clean place",
  "Pointing to canonical pages instead of letting a tool guess from the navigation",
  "Highlighting service pages, location pages, proof pages, and contact paths",
  "Separating important content from menus, footers, scripts, and duplicated template copy",
];

const doesNot = [
  "Guarantee that ChatGPT, Gemini, Claude, Perplexity, or Google will read it",
  "Tell crawlers what they are allowed to access",
  "Override robots.txt, noindex tags, paywalls, or weak page content",
  "Make an unclear business suddenly trustworthy or citable",
];

const order = [
  {
    n: "01",
    t: "Make the pages clear",
    d: "Service pages, local details, proof, FAQs, and CTAs have to be useful before a support file can help.",
  },
  {
    n: "02",
    t: "Add structured data",
    d: "Schema turns visible facts into structured facts: business, services, breadcrumbs, FAQs, and page purpose.",
  },
  {
    n: "03",
    t: "Publish llms.txt",
    d: "Use a short Markdown file at /llms.txt with the business summary and the URLs a machine should read first.",
  },
  {
    n: "04",
    t: "Keep it synchronized",
    d: "Update it when services, locations, offers, URLs, or positioning change. Stale guidance is worse than no guidance.",
  },
];

const fileRules = [
  {
    t: "Start with one sentence",
    d: "A blockquote summary should identify the business, category, audience, service area, and main value without hype.",
  },
  {
    t: "Link only to canonical pages",
    d: "Every URL should be a page you would want a customer, crawler, or assistant to read.",
  },
  {
    t: "Keep claims verifiable",
    d: "Do not stuff awards, credentials, service areas, or specialties unless the website backs them up.",
  },
  {
    t: "Use Markdown, not a data dump",
    d: "The point is a curated guide. Giant pasted page text usually creates more noise than clarity.",
  },
];

const deliverables = [
  "A plain-English business summary",
  "Canonical service and location links",
  "A short note on who the business serves",
  "Links to proof, FAQs, contact, and booking pages",
  "A no-hype notes section for important constraints",
  "A maintenance check so it stays aligned with the site",
];

const related = [
  {
    href: "/schema-for-ai-search",
    t: "Schema for AI search",
    d: "Structured data is the stronger machine-readable layer inside your pages.",
  },
  {
    href: "/ai-search-ready-website",
    t: "AI-search-ready websites",
    d: "A support file helps most when the website itself is clear and crawlable.",
  },
  {
    href: "/free-audit",
    t: "Free AI Search Audit",
    d: "See whether your current site gives modern search enough to understand.",
  },
];

const sample = `# Goldleaf Aesthetics & Med Spa

> Medical aesthetics clinic serving the Westhaven metro, with licensed RN injectors under a medical director.

Goldleaf helps adults compare and book non-surgical aesthetic treatments. The site is written for patients researching providers, treatment fit, pricing expectations, safety, and next steps.

## Canonical pages
- [Home](https://example.com/): business overview, services, and booking path
- [Botox and Dysport](https://example.com/botox/): neuromodulator treatment details
- [Dermal fillers](https://example.com/fillers/): filler options, fit, and FAQs
- [Providers](https://example.com/providers/): injector credentials and medical direction
- [Contact](https://example.com/contact/): location, phone, and booking request

## Service area
- Westhaven metro
- North Westhaven
- Lake District

## Notes
- Medical decisions require a consultation.
- The website does not provide emergency medical advice.`;

const faqs = [
  {
    q: "Do I need an llms.txt file?",
    a: "No. It is optional. For most businesses, llms.txt is a reasonable support file after the site has clear pages, valid schema, crawlability, and useful content. It should not be the first or only AI-search task.",
  },
  {
    q: "Will llms.txt make AI cite my business?",
    a: "No. There is no credible guarantee that any AI system will read the file, follow it, cite you, or rank you. It can make your important pages easier to find and summarize, but it does not control the answer.",
  },
  {
    q: "Is llms.txt the same as robots.txt?",
    a: "No. robots.txt is for crawl directives. llms.txt is a Markdown guide to important site context and links. It should coexist with robots.txt and sitemap.xml, not replace them.",
  },
  {
    q: "What should a business include?",
    a: "Include a short business summary, canonical service pages, location or service-area pages, proof pages, FAQs, contact or booking pages, and notes that help a machine interpret the site accurately. Leave out private, unverified, or inflated claims.",
  },
  {
    q: "Should I create llms-full.txt too?",
    a: "Only if there is a clear reason. Many documentation-heavy products publish larger machine-readable context files. Most local and service businesses are better served by a concise llms.txt that points to the right pages.",
  },
  {
    q: "Where does queryclear use it?",
    a: "We include llms.txt as a small support layer inside a broader modern-search setup: clearer pages, schema, metadata, crawlability, local signals, FAQs, and a working conversion path.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "llms.txt for Businesses",
  url: `${site.url}/llms-txt-for-businesses`,
  description: "An honest guide to llms.txt for businesses.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "llms.txt planning and implementation",
  serviceType: "AI-search readiness support file",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "Planning, writing, publishing, and maintaining llms.txt files as part of broader modern-search website optimization.",
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
    {
      "@type": "ListItem",
      position: 2,
      name: "llms.txt for Businesses",
      item: `${site.url}/llms-txt-for-businesses`,
    },
  ],
};

export default function LlmsTxtPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="grid gap-10 py-16 md:grid-cols-[1fr_0.82fr] md:items-center md:py-20">
            <div>
              <MonoLabel index="llms">llms.txt</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                llms.txt is useful. It is not your AI-search strategy.
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted">
                <code className="font-mono text-ink">llms.txt</code> is an
                optional Markdown file that gives AI-oriented tools a curated
                summary of your business and the pages worth reading first.
                Used well, it reduces noise. Used as a silver bullet, it
                distracts from the work that matters.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="/free-audit">Audit my AI-search setup</Cta>
                <Cta href="/llms.txt" variant="ghost">
                  View our llms.txt
                </Cta>
              </div>
            </div>
            <div className="machine-panel">
              <p className="text-paper/40">{"// good llms.txt posture"}</p>
              <div className="mt-4 grid gap-3">
                {verdicts.map((v) => (
                  <div key={v.t}>
                    <span className="k">{v.t}</span>:{" "}
                    <span className="s">{v.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">The honest verdict</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Publish it, but keep it in its lane.
            </h2>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
              {verdicts.map((v) => (
                <StaggerItem key={v.t} className="card p-6">
                  <h3 className="text-xl">{v.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {v.d}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="02">What it may help with</MonoLabel>
              <ul className="mt-6 grid gap-3">
                {helps.map((m) => (
                  <li key={m} className="flex gap-3 text-ink">
                    <span aria-hidden="true" className="text-lime-deep">
                      ✓
                    </span>
                    <span className="text-muted">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="03">What it cannot do</MonoLabel>
              <ul className="mt-6 grid gap-3">
                {doesNot.map((m) => (
                  <li key={m} className="flex gap-3 text-ink">
                    <span aria-hidden="true" className="text-red-600">
                      x
                    </span>
                    <span className="text-muted">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">Order of operations</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The file comes after the foundation.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {order.map((s) => (
                <div key={s.n} className="card p-6">
                  <span className="font-display text-3xl text-lime-deep">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <MonoLabel index="05">A sample file</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Short, specific, and easy to maintain.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                A good business llms.txt is not a keyword dump. It is a curated
                guide to the pages and facts that already represent the business
                well.
              </p>
            </div>
            <pre className="machine-panel overflow-x-auto">
              <code>{sample}</code>
            </pre>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="06">Writing rules</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Make the file useful enough to trust.
            </h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {fileRules.map((r) => (
                <StaggerItem key={r.t} className="card p-6">
                  <h3 className="text-xl">{r.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {r.d}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="07">What we include</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                A support file, not a sales brochure.
              </h2>
            </div>
            <ul className="grid max-w-2xl gap-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d} className="flex gap-3 text-sm text-muted">
                  <span aria-hidden="true" className="font-mono text-lime-deep">
                    ✓
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="08">Pair it with</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The stronger signals still live on your website.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  className="card block p-6 hover:border-lime"
                >
                  <h3 className="text-xl">{r.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {r.d}
                  </p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-wider text-lime-deep">
                    Read next →
                  </p>
                </a>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="09">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">
              Common questions.
            </h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">
                Want the whole setup, not just the text file?
              </h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Our audit checks the pages, schema, metadata, crawlability,
                local signals, and optional llms.txt layer that modern search
                needs to understand your business.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta
                href="/ai-search-ready-website"
                variant="ghost"
                className="!border-paper/30 !text-paper hover:!bg-white/10"
              >
                See the website offer
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
