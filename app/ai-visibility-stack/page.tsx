import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The AI Visibility Stack",
  description:
    "The queryclear AI Visibility Stack is a seven-layer framework for modern search readiness: entity clarity, service specificity, proof density, local relevance, answer coverage, machine readability, and conversion path.",
  alternates: { canonical: "/ai-visibility-stack" },
  openGraph: {
    title: "The AI Visibility Stack - queryclear",
    description:
      "Seven layers that decide whether search engines and AI answer engines can find, understand, trust, and recommend your business.",
  },
};

const layers = [
  {
    n: "01",
    name: "Entity Clarity",
    short: "A machine can tell exactly who the business is.",
    what: "Business name, category, location, service area, contact details, profiles, and ownership are consistent enough to identify one clear entity.",
    weak: "The site uses vague category language, inconsistent names, no useful About page, and business facts scattered across templates.",
    fix: "Clarify name, category, market, contact, About content, Organization or LocalBusiness schema, and key sameAs profiles.",
  },
  {
    n: "02",
    name: "Service Specificity",
    short: "Each offer maps to a real buyer question.",
    what: "Services are described on dedicated, crawlable pages with plain names, use cases, geography, eligibility, process, and next steps.",
    weak: "One thin services list tries to cover everything, with little detail and no clear page for high-intent searches.",
    fix: "Build or rewrite service pages around what the buyer asks, what the service includes, who it fits, and why the provider is credible.",
  },
  {
    n: "03",
    name: "Proof Density",
    short: "The site gives systems a reason to trust it.",
    what: "Credentials, reviews, examples, team details, policies, real photos, and experience signals are visible and specific.",
    weak: "The site makes broad claims but hides the evidence, leaving answer engines with little reason to prefer it over competitors.",
    fix: "Surface honest proof near claims: credentials, reviews, case details, before/after context where appropriate, and real team information.",
  },
  {
    n: "04",
    name: "Local Relevance",
    short: "The business is tied to the places it actually serves.",
    what: "Cities, neighborhoods, service areas, local proof, Google Business Profile alignment, and location details are explicit and consistent.",
    weak: "The site says 'near me' or targets a city without showing real location context, service-area detail, or profile consistency.",
    fix: "Clarify the actual service area, align NAP details, add local context to service pages, and only create location pages that are genuine.",
  },
  {
    n: "05",
    name: "Answer Coverage",
    short: "The site answers pre-sale questions directly.",
    what: "Pages cover pricing guidance, fit, process, timing, risks, comparisons, FAQs, and what happens next in language humans can use.",
    weak: "The site sells, but does not answer. AI systems have to infer important buyer details from competitors or generic sources.",
    fix: "Add answer-first sections, FAQs, comparison content, process explanations, and objections that match real buyer questions.",
  },
  {
    n: "06",
    name: "Machine Readability",
    short: "The site can be crawled, parsed, and connected.",
    what: "Semantic HTML, unique metadata, internal links, sitemap, robots, canonical tags, JSON-LD schema, and optional llms.txt all agree.",
    weak: "Important content is hard to crawl, schema is generic or invalid, pages are orphaned, and machine-readable signals contradict each other.",
    fix: "Clean the technical foundation, validate schema, connect pages with internal links, and keep metadata and support files synchronized.",
  },
  {
    n: "07",
    name: "Conversion Path",
    short: "A referred visitor knows what to do next.",
    what: "Calls to action, forms, booking paths, phone/email options, accessibility, and trust cues make the next step obvious.",
    weak: "Even if modern search sends a visitor, the page buries contact options, uses fragile forms, or fails to match the visitor's intent.",
    fix: "Make the primary action visible, reduce form friction, improve booking/contact reliability, and align CTAs with page intent.",
  },
];

const scoreBands = [
  {
    score: "0-2",
    label: "Missing",
    d: "The layer is absent, contradictory, blocked, or too thin to help people or machines.",
  },
  {
    score: "3-5",
    label: "Present but weak",
    d: "Some signals exist, but they are generic, incomplete, inconsistent, or not tied to a useful page.",
  },
  {
    score: "6-8",
    label: "Clear enough",
    d: "The layer works for core pages, but there are gaps in depth, proof, structure, or maintenance.",
  },
  {
    score: "9-10",
    label: "Strong",
    d: "The layer is specific, visible, structured, consistent, and connected to the rest of the site.",
  },
];

const workflows = [
  {
    t: "Audit",
    d: "We score each layer against your actual site, then run prompt tests to see how answer engines describe the business today.",
  },
  {
    t: "Prioritize",
    d: "Lower-layer gaps come first. A conversion tweak cannot fix a site that cannot identify the business or explain its services.",
  },
  {
    t: "Implement",
    d: "The roadmap becomes concrete work: service pages, metadata, schema, FAQs, local signals, proof, internal links, and CTAs.",
  },
  {
    t: "Maintain",
    d: "Modern-search readiness drifts as services, pages, locations, competitors, and answer engines change. The stack gives us a repeatable re-audit model.",
  },
];

const failurePatterns = [
  "A polished homepage that never states the category, service area, or primary services plainly",
  "Service pages that exist only as a bulleted list with no answers, proof, or next step",
  "Schema that validates syntactically but describes a different business than the page does",
  "FAQs that answer easy internal questions instead of buyer questions",
  "Local pages targeting cities without genuine local relevance",
  "A contact path that breaks the moment a mobile visitor wants to book",
];

const related = [
  {
    href: "/geo-audit",
    t: "GEO Audit",
    d: "See how the stack translates into a no-hype audit of your current site.",
  },
  {
    href: "/schema-for-ai-search",
    t: "Schema for AI search",
    d: "Layer 06 in practice: structured data that matches the visible page.",
  },
  {
    href: "/llms-txt-for-businesses",
    t: "llms.txt for businesses",
    d: "An optional support layer when the real pages are already clear.",
  },
];

const faqs = [
  {
    q: "What is the AI Visibility Stack?",
    a: "It is queryclear's seven-layer framework for judging whether a website can be found, understood, trusted, and acted on by modern search and AI answer engines. The layers are entity clarity, service specificity, proof density, local relevance, answer coverage, machine readability, and conversion path.",
  },
  {
    q: "Why do lower layers come first?",
    a: "Because higher layers depend on them. If a system cannot identify the business or understand the services, more FAQs or CTAs will not solve the core visibility problem. We fix the foundation before polishing the surface.",
  },
  {
    q: "Is this an SEO framework or an AI framework?",
    a: "Both. The stack is modern SEO applied to AI-powered search behavior. It keeps traditional foundations like crawlability and content quality, then adds the clarity, proof, and answer coverage that answer engines need to summarize a business accurately.",
  },
  {
    q: "How is the stack scored?",
    a: "In the paid audit, each layer is scored against the actual site, with notes on what is missing, what is weak, and what should be fixed first. The score is not the goal; it is a way to prioritize work.",
  },
  {
    q: "Can I use the stack myself?",
    a: "Yes. You can start with the free scorecard or free audit. The stack is deliberately plain-English so a business owner can see the gaps without decoding technical SEO jargon.",
  },
  {
    q: "Does a high stack score guarantee AI citations?",
    a: "No. No one controls third-party answer engines. A strong stack means the site gives those systems clearer, more trustworthy material to work with. It improves the foundation; it does not guarantee the outcome.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "The AI Visibility Stack",
  url: `${site.url}/ai-visibility-stack`,
  description:
    "The seven-layer queryclear framework for modern-search and AI-search website readiness.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "The AI Visibility Stack layers",
  itemListElement: layers.map((layer, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: layer.name,
    description: layer.short,
  })),
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
      name: "The AI Visibility Stack",
      item: `${site.url}/ai-visibility-stack`,
    },
  ],
};

export default function StackPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
              <MonoLabel index="method">Our method</MonoLabel>
              <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
                The seven layers between invisible and recommendable.
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-muted">
                Modern search does not reward a single trick. It rewards a
                website that can be found, understood, trusted, and acted on.
                The AI Visibility Stack is the framework we use to audit that
                foundation and decide what to fix first.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href="/free-audit">Run a free audit</Cta>
                <Cta href="/geo-audit" variant="ghost">
                  See the GEO audit
                </Cta>
              </div>
            </div>
            <div className="machine-panel">
              <p className="text-paper/40">{"// AI Visibility Stack"}</p>
              <div className="mt-4 grid gap-2">
                {layers.map((layer) => (
                  <div key={layer.n}>
                    <span className="k">{layer.n}</span>{" "}
                    <span className="s">{layer.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-lime">
                foundation first - lower layers support higher layers
              </p>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">The principle</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              A system cannot recommend what it cannot identify, parse, or trust.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  t: "Find",
                  d: "The site has to be crawlable, indexable, internally linked, and clear enough to discover.",
                },
                {
                  t: "Understand",
                  d: "The business, services, market, proof, and answers have to be explicit instead of implied.",
                },
                {
                  t: "Act",
                  d: "A visitor who arrives from modern search needs a clear, reliable path to contact, book, or buy.",
                },
              ].map((item) => (
                <div key={item.t} className="card p-6">
                  <h3 className="text-xl">{item.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">The seven layers</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The stack runs from identity to action.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Lower layers come first. A gap in identity, service clarity, or
              crawlability weakens everything above it.
            </p>
            <Stagger className="mt-10 grid gap-4">
              {layers.map((layer) => (
                <StaggerItem
                  key={layer.n}
                  className="card grid gap-5 p-6 md:grid-cols-[7rem_1fr] md:items-start"
                >
                  <div>
                    <span className="font-display text-4xl text-lime-deep">
                      {layer.n}
                    </span>
                    <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
                      Layer
                    </p>
                  </div>
                  <div>
                    <h3 className="text-2xl">{layer.name}</h3>
                    <p className="mt-2 text-base text-ink">{layer.short}</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="mono-label !text-lime-deep">What it means</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {layer.what}
                        </p>
                      </div>
                      <div>
                        <p className="mono-label !text-red-600">Weak signal</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {layer.weak}
                        </p>
                      </div>
                      <div>
                        <p className="mono-label !text-lime-deep">Typical fix</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {layer.fix}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Scoring</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              We score for usefulness, not checklist theater.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {scoreBands.map((band) => (
                <div key={band.score} className="card p-6">
                  <p className="font-display text-3xl text-lime-deep">
                    {band.score}
                  </p>
                  <h3 className="mt-3 text-xl">{band.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {band.d}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="04">How we use it</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              The stack turns a fuzzy AI-search problem into ordered work.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {workflows.map((w, index) => (
                <div key={w.t} className="card p-6">
                  <span className="font-display text-3xl text-lime-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-xl">{w.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {w.d}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="05">Failure patterns</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Where sites usually lose points.
              </h2>
            </div>
            <ul className="grid max-w-2xl gap-3">
              {failurePatterns.map((f) => (
                <li key={f} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="text-red-600">
                    x
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="06">Related pages</MonoLabel>
            <h2 className="mt-3 max-w-3xl text-3xl sm:text-4xl">
              Go deeper on the layers that usually need work.
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
                See your stack scored.
              </h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Start with the free audit, or get the full $497 AI Search Audit
                for seven-layer scoring, prompt tests, a prioritized roadmap, and
                a live walkthrough.
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
              <Cta
                href="/scorecard"
                variant="ghost"
                className="!border-paper/30 !text-paper hover:!bg-white/10"
              >
                Score your own site
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
