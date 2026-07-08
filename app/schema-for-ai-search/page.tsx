import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Schema for AI Search",
  description:
    "A plain-English guide to schema and JSON-LD for AI search: which structured data types matter, what to mark up, what to avoid, and how queryclear implements schema for service businesses.",
  alternates: { canonical: "/schema-for-ai-search" },
  openGraph: {
    title: "Schema for AI Search - queryclear",
    description:
      "Which structured data types matter for AI search, how to implement them honestly, and what most business sites get wrong.",
  },
};

const pillars = [
  {
    k: "Entity",
    t: "Who you are",
    d: "Business name, category, URL, parent organization, logo, and trusted profiles.",
  },
  {
    k: "Place",
    t: "Where you operate",
    d: "Address, service area, city and neighborhood language, hours, and contact details.",
  },
  {
    k: "Services",
    t: "What you offer",
    d: "Specific services tied to real pages, not one vague bucket of keywords.",
  },
  {
    k: "Answers",
    t: "What buyers ask",
    d: "Clear FAQ content that matches visible page copy and gives answer engines clean language to quote.",
  },
];

const schemaTypes = [
  {
    t: "Organization",
    use: "Use it to identify the company behind the website.",
    watch: "Best for brand-level facts: legal name, URL, logo, sameAs links, parent company, contact.",
  },
  {
    t: "LocalBusiness",
    use: "Use it when the business has a real location or defined service area.",
    watch: "Do not fake geography. Match the site, Google Business Profile, and visible NAP details.",
  },
  {
    t: "Service",
    use: "Use it on pages that explain a real service customers can buy or book.",
    watch: "Tie the service to the provider and page URL. Keep service names specific enough to match demand.",
  },
  {
    t: "FAQPage",
    use: "Use it when a page visibly presents questions and answers.",
    watch: "The markup should match the visible FAQ. Do not hide extra sales copy inside JSON-LD.",
  },
  {
    t: "BreadcrumbList",
    use: "Use it to make a page's site context explicit.",
    watch: "Keep the breadcrumb trail aligned with the actual navigation and canonical URL.",
  },
  {
    t: "WebSite / WebPage",
    use: "Use it to define the site and the specific page as distinct entities.",
    watch: "Helpful for canonical names, page descriptions, and connecting pages into one graph.",
  },
];

const implementationSteps = [
  {
    n: "01",
    t: "Map the visible facts",
    d: "We inventory the business facts already shown on the page: name, category, services, area served, proof, FAQs, and next step.",
  },
  {
    n: "02",
    t: "Choose the narrowest useful type",
    d: "A service page gets Service schema. A location page gets LocalBusiness details. A FAQ gets FAQPage. We avoid generic markup when a sharper type fits.",
  },
  {
    n: "03",
    t: "Connect the graph",
    d: "The business, website, service pages, FAQs, and breadcrumbs should point to each other with stable URLs and @id values.",
  },
  {
    n: "04",
    t: "Validate and maintain",
    d: "Schema has to parse, match the page, and stay current when hours, services, names, locations, or URLs change.",
  },
];

const mistakes = [
  "Marking up facts that are not visible or verifiable on the page",
  "Using every schema type a plugin offers instead of the type the page actually needs",
  "Leaving placeholder names, phone numbers, URLs, ratings, or service areas in production",
  "Adding review or rating markup when the reviews are not visible and complete",
  "Publishing valid JSON that still tells a confusing story about the business",
  "Letting schema drift after a redesign, rebrand, new location, or service change",
];

const auditChecks = [
  "Can a machine identify the business without guessing?",
  "Does the local/service-area data match the visible site?",
  "Are services tied to real, crawlable service pages?",
  "Do FAQs and schema say the same thing?",
  "Do canonical URLs, breadcrumbs, and @id values agree?",
  "Does the markup pass validation and still make human sense?",
];

const related = [
  {
    href: "/ai-visibility-stack",
    t: "The AI Visibility Stack",
    d: "See where schema fits inside the seven-layer readiness model.",
  },
  {
    href: "/llms-txt-for-businesses",
    t: "llms.txt for businesses",
    d: "A clean support file can point AI-oriented tools to your best pages.",
  },
  {
    href: "/ai-search-ready-website",
    t: "AI-search-ready websites",
    d: "Schema works best when the actual pages are clear, useful, and crawlable.",
  },
];

const example = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#business",
      "name": "Goldleaf Aesthetics & Med Spa",
      "url": "https://example.com/",
      "telephone": "+1-555-0100",
      "areaServed": "Westhaven metro",
      "sameAs": [
        "https://www.instagram.com/goldleaf-example"
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.com/botox/#service",
      "name": "Botox and Dysport injections",
      "provider": { "@id": "https://example.com/#business" },
      "areaServed": "Westhaven metro",
      "url": "https://example.com/botox/"
    }
  ]
}
</script>`;

const faqs = [
  {
    q: "Does schema help with AI search?",
    a: "Schema can help search and AI systems interpret your site by making key facts explicit. It does not force rankings or citations. The useful work is reducing ambiguity: who you are, what you offer, where you operate, and which page proves it.",
  },
  {
    q: "Which schema types does a service business usually need?",
    a: "Most service businesses start with Organization or LocalBusiness, WebSite, WebPage, BreadcrumbList, Service, and FAQPage where the page visibly includes FAQs. The exact set depends on the real page and real business facts.",
  },
  {
    q: "Should every page use the same schema?",
    a: "No. Site-wide Organization or WebSite schema may be shared, but page-specific schema should match the purpose of the page. A treatment page, city page, article, FAQ, and contact page should not all tell the same machine story.",
  },
  {
    q: "Can I add schema without changing the visible page?",
    a: "Only when the markup reflects what users can already see or verify. If important facts are missing from the page, the better fix is to improve the content first, then mark up the same facts.",
  },
  {
    q: "Is a schema plugin enough?",
    a: "Sometimes for basics, but plugins often output generic or stale markup. We still audit the page, the business facts, the schema graph, and validation so the result is accurate instead of merely present.",
  },
  {
    q: "How does schema relate to llms.txt?",
    a: "Schema defines structured facts inside your pages. llms.txt is an optional plain-text guide that can point AI-oriented tools toward important pages. They complement each other, but neither replaces useful, crawlable content.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Schema for AI Search",
  url: `${site.url}/schema-for-ai-search`,
  description:
    "A plain-English guide to structured data and JSON-LD for AI search.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Schema implementation for AI search",
  serviceType: "Structured data / JSON-LD implementation",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "Planning, writing, validating, and maintaining structured data for service-business websites so search and AI systems can interpret business facts more clearly.",
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
      name: "Schema for AI Search",
      item: `${site.url}/schema-for-ai-search`,
    },
  ],
};

export default function SchemaPage() {
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
              <MonoLabel index="schema">Structured data</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                Schema turns your business facts into a machine-readable map.
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted">
                Schema, usually published as JSON-LD, is not an AI-search cheat
                code. It is the part of the page that says, in a precise format:
                this is the business, these are the services, this is the area
                served, and these are the answers buyers need before they choose.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="/free-audit">Check my schema</Cta>
                <Cta href="/ai-search-ready-website" variant="ghost">
                  Build an AI-search-ready site
                </Cta>
              </div>
            </div>
            <div className="machine-panel">
              <p className="text-paper/40">{"// what clean schema clarifies"}</p>
              <div className="mt-4 grid gap-2">
                {pillars.map((p) => (
                  <div key={p.k}>
                    <span className="k">{p.k}</span>:{" "}
                    <span className="s">{p.t}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-lime">
                clear facts - connected pages - fewer machine guesses
              </p>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Why it matters</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              AI search does not need more keywords. It needs fewer ambiguities.
            </h2>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-4">
              {pillars.map((p) => (
                <StaggerItem key={p.k} className="card p-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-lime-deep">
                    {p.k}
                  </p>
                  <h3 className="mt-3 text-xl">{p.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {p.d}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">Types worth using</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The right schema is page-specific, not plugin-specific.
            </h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {schemaTypes.map((t) => (
                <StaggerItem key={t.t} className="card p-6">
                  <h3 className="font-mono text-base text-ink">{t.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink">Use when: </span>
                    {t.use}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink">Watch for: </span>
                    {t.watch}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Implementation model</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Good schema starts with the page, not the code block.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {implementationSteps.map((s) => (
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
              <MonoLabel index="04">A better example</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Connect the business to the service page.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                This simplified example uses a shared <code>@id</code> so the
                service points back to the business entity. Real projects need
                the actual URL, phone, service area, and visible page content.
              </p>
            </div>
            <pre className="machine-panel overflow-x-auto">
              <code>{example}</code>
            </pre>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="05">What breaks it</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Common schema mistakes.
              </h2>
              <ul className="mt-8 grid gap-3">
                {mistakes.map((m) => (
                  <li key={m} className="flex gap-3 text-ink">
                    <span aria-hidden="true" className="text-red-600">
                      x
                    </span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="audit">What we check</MonoLabel>
              <div className="card mt-8 p-6">
                <ul className="grid gap-3">
                  {auditChecks.map((c) => (
                    <li key={c} className="flex gap-3 text-sm text-muted">
                      <span aria-hidden="true" className="font-mono text-lime-deep">
                        ✓
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="06">Pair it with</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Schema works best when the surrounding site is clear.
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

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="07">Good to know</MonoLabel>
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
                Is your schema accurate, connected, and useful?
              </h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Run a free audit to see what your current markup says, what is
                missing, and whether your pages give modern search enough clear
                evidence to work with.
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
