import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "GEO Audit - Modern SEO for AI Search",
  description:
    "A practical GEO audit for service businesses: queryclear reviews whether your site can be crawled, understood, trusted, and selected by modern search and AI answer engines. No hype, no ranking guarantees, just a scored fix roadmap.",
  alternates: { canonical: "/geo-audit" },
  openGraph: {
    title: "GEO Audit - queryclear",
    description:
      "A no-hype GEO audit that scores the modern-search foundations AI answer engines actually depend on.",
  },
};

const outcomes = [
  {
    k: "Findable",
    t: "Can systems reach the page?",
    d: "Indexability, sitemap coverage, robots rules, canonicals, page speed, and content that is not trapped behind fragile scripts.",
  },
  {
    k: "Understandable",
    t: "Can they identify the business?",
    d: "Entity clarity, service specificity, local language, headings, internal links, metadata, and structured data.",
  },
  {
    k: "Trustworthy",
    t: "Can they believe the claim?",
    d: "Proof, credentials, reviews, real examples, team details, policies, and consistency across the site and business profiles.",
  },
  {
    k: "Useful",
    t: "Can they answer the buyer?",
    d: "FAQ coverage, comparison content, process details, pricing guidance where appropriate, and clear next steps.",
  },
];

const seoGeo = [
  {
    old: "Can this page rank for a keyword?",
    modern: "Can this page answer a real buyer question well enough to be summarized?",
  },
  {
    old: "Does the title tag include the phrase?",
    modern: "Does the page make the business, service, location, and proof unmistakable?",
  },
  {
    old: "Do we have enough pages indexed?",
    modern: "Do the indexed pages form a coherent entity graph with clean internal links?",
  },
  {
    old: "Can we add an AI file or schema block?",
    modern: "Does the visible page already contain accurate facts worth marking up?",
  },
];

const includes = [
  {
    t: "Technical crawl review",
    d: "Robots, sitemap, canonical tags, indexability, render blockers, metadata, and whether important content can be parsed.",
  },
  {
    t: "Entity and service map",
    d: "Who you are, what you offer, who it is for, where you operate, and whether those facts stay consistent.",
  },
  {
    t: "AI visibility prompt tests",
    d: "Category, city, comparison, and buyer-intent prompts checked across the answer engines that matter to your market.",
  },
  {
    t: "Answer coverage review",
    d: "The questions buyers ask before they choose, and whether your pages answer them directly enough to be useful.",
  },
  {
    t: "Schema and machine-readability audit",
    d: "JSON-LD, breadcrumbs, LocalBusiness or Organization data, Service schema, FAQPage usage, and optional llms.txt support.",
  },
  {
    t: "Proof and trust review",
    d: "Reviews, credentials, team details, case examples, policies, and whether trust signals are visible to people and machines.",
  },
  {
    t: "Competitor/source comparison",
    d: "Which sources answer engines are likely to find instead, and what those pages make clearer than yours.",
  },
  {
    t: "Prioritized fix roadmap",
    d: "A plain-English list of what to fix first, why it matters, and whether it is content, technical, schema, or UX work.",
  },
];

const prompts = [
  {
    q: "Best med spa for natural-looking Botox in [city]",
    checks: "service specificity, local relevance, proof, and answer coverage",
  },
  {
    q: "Who offers emergency plumbing near [neighborhood]?",
    checks: "crawlability, service-area clarity, contact path, and business profile consistency",
  },
  {
    q: "Compare [service] providers in [market]",
    checks: "entity clarity, differentiators, trust signals, and competitor source coverage",
  },
];

const deliverables = [
  "A scored readout across the seven AI Visibility Stack layers",
  "Prompt-test findings with the exact questions we checked",
  "A source and competitor gap summary",
  "Schema, metadata, sitemap, robots, and crawlability notes",
  "A prioritized fix roadmap grouped by effort and impact",
  "A live walkthrough so you know what to do next",
];

const myths = [
  {
    myth: "GEO is a separate replacement for SEO.",
    reality:
      "The useful work is modern SEO with answer engines in mind: clear pages, crawlability, useful answers, proof, schema, and a working conversion path.",
  },
  {
    myth: "One file or plugin can make AI recommend you.",
    reality:
      "Files and plugins can support a strong site. They do not rescue weak content, missing proof, confusing services, or blocked pages.",
  },
  {
    myth: "You can guarantee AI citations.",
    reality:
      "No credible provider controls third-party answer engines. We measure, improve, and report what changed without inventing guarantees.",
  },
];

const related = [
  {
    href: "/ai-visibility-stack",
    t: "The AI Visibility Stack",
    d: "The seven-layer scoring model behind the GEO audit.",
  },
  {
    href: "/ai-visibility-audit",
    t: "AI Search Audit",
    d: "The paid $497 audit with scoring, prompt testing, and a live walkthrough.",
  },
  {
    href: "/ai-search-ready-website",
    t: "AI-search-ready websites",
    d: "Turn the audit roadmap into a stronger, clearer site.",
  },
];

const faqs = [
  {
    q: "What is a GEO audit?",
    a: "A GEO audit reviews whether your website can be found, understood, trusted, and used by AI-powered search experiences such as Google AI features, ChatGPT-style answer engines, Perplexity, Gemini, and similar tools. At queryclear, it is a practical modern SEO audit, not a separate magic system.",
  },
  {
    q: "How is GEO different from SEO?",
    a: "The fundamentals overlap heavily. SEO asks whether pages can rank and earn clicks. GEO adds whether answer engines can understand, summarize, and confidently mention the business. The work still depends on crawlability, useful content, structure, proof, and accurate business details.",
  },
  {
    q: "What do you actually test?",
    a: "We review crawlability, metadata, structured data, internal links, service-page clarity, local relevance, proof, FAQs, conversion paths, and real answer-engine prompts for the business category and market.",
  },
  {
    q: "Do you guarantee rankings, traffic, or AI citations?",
    a: "No. We do not control Google, ChatGPT, Claude, Perplexity, Gemini, or any other answer engine. The audit shows what your site currently gives those systems to work with and what should be improved first.",
  },
  {
    q: "Is this only for local businesses?",
    a: "No. The framework works for local service businesses, professional firms, clinics, SaaS companies, and other organizations. We go deepest on service businesses because their visibility depends on clear services, geography, proof, and conversion paths.",
  },
  {
    q: "Should I run the free audit first?",
    a: "Yes, if you want a fast read before buying. The free audit gives an instant, read-only snapshot. The full AI Search Audit is the deeper paid version with scoring, prompt testing, a prioritized roadmap, and a live walkthrough.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "GEO Audit",
  url: `${site.url}/geo-audit`,
  description:
    "A practical Generative Engine Optimization audit of a website's modern-search and AI-search readiness.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "GEO Audit",
  serviceType: "Modern SEO / Generative Engine Optimization audit",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "A no-hype audit that scores a website's crawlability, entity clarity, service specificity, proof, local relevance, answer coverage, machine readability, and conversion path for modern search and AI answer engines.",
  areaServed: "United States",
  offers: {
    "@type": "Offer",
    price: "497",
    priceCurrency: "USD",
    url: `${site.url}/ai-visibility-audit`,
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
    {
      "@type": "ListItem",
      position: 2,
      name: "GEO Audit",
      item: `${site.url}/geo-audit`,
    },
  ],
};

export default function GeoAuditPage() {
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
              <MonoLabel index="geo">GEO audit</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                A GEO audit that separates AI-search work from AI-search theater.
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted">
                Generative Engine Optimization sounds new. The serious work is
                disciplined: make the business findable, understandable,
                trustworthy, and useful to people and machines. We score that
                foundation, test real buyer prompts, and hand you the fix roadmap.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="/free-audit">Run a free audit</Cta>
                <Cta href="/ai-visibility-audit" variant="ghost">
                  Get the $497 audit
                </Cta>
              </div>
            </div>
            <div className="machine-panel">
              <p className="text-paper/40">{"// GEO audit posture"}</p>
              <div className="mt-4 grid gap-3">
                {outcomes.map((o) => (
                  <div key={o.k}>
                    <span className="k">{o.k}</span>:{" "}
                    <span className="s">{o.t}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-lime">
                measured gaps - prioritized fixes - no citation promises
              </p>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What GEO really measures</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Before an answer engine can recommend you, it has to clear four gates.
            </h2>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-4">
              {outcomes.map((o) => (
                <StaggerItem key={o.k} className="card p-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-lime-deep">
                    {o.k}
                  </p>
                  <h3 className="mt-3 text-xl">{o.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {o.d}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">SEO vs GEO</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The questions changed. The fundamentals still matter.
            </h2>
            <div className="mt-8 grid gap-4">
              {seoGeo.map((row) => (
                <div
                  key={row.old}
                  className="card grid gap-4 p-6 md:grid-cols-2 md:items-start"
                >
                  <div>
                    <p className="mono-label !text-muted">Traditional SEO asks</p>
                    <p className="mt-2 text-lg text-ink">{row.old}</p>
                  </div>
                  <div>
                    <p className="mono-label !text-lime-deep">
                      Modern search also asks
                    </p>
                    <p className="mt-2 text-lg text-ink">{row.modern}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">What the audit includes</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              A scored review of the signals answer engines depend on.
            </h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {includes.map((i) => (
                <StaggerItem key={i.t} className="card p-6">
                  <h3 className="text-lg">{i.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {i.d}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-6 text-sm text-muted">
              We score each area against the{" "}
              <a
                href="/ai-visibility-stack"
                className="font-medium text-ink underline hover:text-lime-deep"
              >
                AI Visibility Stack
              </a>
              .
            </p>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <MonoLabel index="04">Prompt testing</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                We test the questions buyers actually ask.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Prompt tests are not fortune-telling. They are a practical way
                to see whether answer engines can connect your business to the
                category, location, service, and proof a buyer cares about.
              </p>
            </div>
            <div className="grid gap-4">
              {prompts.map((p) => (
                <div key={p.q} className="card p-5">
                  <p className="font-mono text-xs text-lime-deep">{p.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Checks: {p.checks}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="05">What you get</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Useful output, not a mystery PDF.
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

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="06">No magic tricks</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The audit is designed to puncture bad assumptions.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {myths.map((m) => (
                <div key={m.myth} className="card p-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-red-600">
                    Myth
                  </p>
                  <h3 className="mt-3 text-xl">{m.myth}</h3>
                  <p className="mt-4 font-mono text-xs uppercase tracking-wider text-lime-deep">
                    Reality
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {m.reality}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="07">Related pages</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Choose the next step by how much help you need.
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
                    Open page →
                  </p>
                </a>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="08">Good to know</MonoLabel>
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
                See what modern search can and cannot understand.
              </h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Start with a free read, or buy the full $497 audit for scoring,
                prompt testing, a prioritized roadmap, and a live walkthrough.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta
                href="/ai-visibility-audit"
                variant="ghost"
                className="!border-paper/30 !text-paper hover:!bg-white/10"
              >
                Get the $497 audit
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
