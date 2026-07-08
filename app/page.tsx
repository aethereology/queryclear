import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta, Mark } from "@/components/ui";
import { SnapshotCta } from "@/components/SnapshotCta";
import { Stagger, StaggerItem, ClipReveal, LineDraw } from "@/components/motion";
import { TypingPanel } from "@/components/TypingPanel";
import { HumanMachineToggle } from "@/components/HumanMachineToggle";
import { Accordion } from "@/components/Accordion";
import { HeroCircuit } from "@/components/HeroCircuit";
import { site } from "@/lib/site";

const proofStats = [
  { k: "7 layers", v: "scored across the AI Visibility Stack" },
  { k: "100 pts", v: "a plain-English readiness rubric" },
  { k: "Read-only", v: "free audits do not modify your site" },
  { k: "Human-led", v: "strategy, implementation, and review by people" },
] as const;

const searchRoute = [
  {
    n: "01",
    label: "Find",
    title: "Can the site be reached?",
    desc: "Crawlability, indexability, sitemap, robots, canonicals, and page health.",
  },
  {
    n: "02",
    label: "Parse",
    title: "Can the business be understood?",
    desc: "Entity clarity, service hierarchy, locations, internal links, and schema.",
  },
  {
    n: "03",
    label: "Trust",
    title: "Can the claim be believed?",
    desc: "Specific proof, staff credentials, examples, reviews, policies, and freshness.",
  },
  {
    n: "04",
    label: "Answer",
    title: "Can the page satisfy a real question?",
    desc: "Buyer-intent copy, FAQs, comparison language, constraints, and next steps.",
  },
  {
    n: "05",
    label: "Convert",
    title: "Can the visitor act?",
    desc: "Clear calls to action, fast forms, accessible layout, and local intent paths.",
  },
] as const;

const layerMatrix = [
  {
    n: "01",
    name: "Entity clarity",
    signal: "The business, category, market, services, and proof are unmistakable.",
    fix: "Clarify homepage, about, service, location, and organization signals.",
  },
  {
    n: "02",
    name: "Crawl foundation",
    signal: "Important pages are discoverable, indexable, fast enough, and internally linked.",
    fix: "Repair metadata, robots, sitemap, canonicals, headings, links, and broken paths.",
  },
  {
    n: "03",
    name: "Service answers",
    signal: "Each page answers who it is for, what happens, where it is offered, and why it is safe.",
    fix: "Rebuild thin service pages into useful, answer-first buying pages.",
  },
  {
    n: "04",
    name: "Structured data",
    signal: "Search systems can read organization, local business, service, and FAQ details.",
    fix: "Add accurate JSON-LD where it reflects visible page content.",
  },
  {
    n: "05",
    name: "Local proof",
    signal: "The site shows real market coverage, reviews, staff, credentials, and examples.",
    fix: "Tie services to places, evidence, policies, photos, and local language.",
  },
  {
    n: "06",
    name: "Answer-engine tests",
    signal: "AI tools can describe the business accurately for high-intent prompts.",
    fix: "Run prompt tests, compare gaps, and add missing source material to the site.",
  },
  {
    n: "07",
    name: "Conversion path",
    signal: "Visitors and agents can find the right action without hunting.",
    fix: "Tighten CTAs, forms, contact paths, booking paths, and offer hierarchy.",
  },
] as const;

const issueCards = [
  {
    eyebrow: "What people see",
    title: "A good-looking site that still feels vague.",
    desc: "Polished pages can still miss the basics: what you do, who it is for, where you do it, and why someone should trust you.",
  },
  {
    eyebrow: "What crawlers see",
    title: "Unclear pages, weak links, thin metadata.",
    desc: "Search systems need readable structure. If the site buries services, locations, and proof, it gives them less to work with.",
  },
  {
    eyebrow: "What AI answers see",
    title: "Not enough citable material.",
    desc: "AI-powered search compares sources. Generic copy, missing proof, and thin FAQs make you easier to skip or misdescribe.",
  },
] as const;

const deliverableGroups = [
  {
    label: "Foundation",
    items: ["Crawl and index review", "Metadata and headings", "Sitemap and robots guidance", "Page speed and accessibility notes"],
  },
  {
    label: "Clarity",
    items: ["Homepage message architecture", "Service-page structure", "Local market language", "FAQ and objection coverage"],
  },
  {
    label: "Signals",
    items: ["Organization and LocalBusiness schema", "Service and FAQ schema", "Internal links", "Open Graph metadata"],
  },
  {
    label: "Measurement",
    items: ["Prompt testing", "100-point scorecard", "Prioritized roadmap", "Before/after visibility checks"],
  },
] as const;

const resourceLinks = [
  {
    href: "/ai-visibility-stack",
    eyebrow: "Framework",
    title: "The AI Visibility Stack",
    desc: "The seven layers we use to audit and upgrade answer-engine readiness.",
  },
  {
    href: "/geo-audit",
    eyebrow: "Audit",
    title: "GEO, without the hype",
    desc: "A practical audit model for generative-engine visibility and modern SEO.",
  },
  {
    href: "/schema-for-ai-search",
    eyebrow: "Technical",
    title: "Schema for AI search",
    desc: "Structured data guidance for service businesses that need clearer signals.",
  },
  {
    href: "/llms-txt-for-businesses",
    eyebrow: "Support file",
    title: "llms.txt for businesses",
    desc: "What it can help with, what it cannot do, and when it is worth publishing.",
  },
] as const;

const faqs = [
  {
    q: "What does queryclear actually do?",
    a: "We upgrade business websites for modern search. That includes crawlability, page structure, metadata, schema, service-page copy, local signals, FAQs, conversion paths, and prompt testing against AI-powered search experiences.",
  },
  {
    q: "Is this different from SEO?",
    a: "It is not separate from SEO. It is modern SEO with more emphasis on clarity, structure, usefulness, entity signals, and the way AI answer engines summarize sources.",
  },
  {
    q: "Do you guarantee rankings or AI citations?",
    a: "No. We do not control Google, ChatGPT, Claude, Perplexity, Gemini, Bing, or any answer engine. We improve the parts you do control: your website, source material, structure, and measurement.",
  },
  {
    q: "Where should I start?",
    a: "Start with the free AI Search Audit if you want a quick read. Choose the $497 AI Search Audit if you want a scored report and roadmap. Choose a Website Upgrade or Build if you want us to implement.",
  },
  {
    q: "Do I need schema or llms.txt?",
    a: "Schema is often useful when it accurately reflects visible page content. llms.txt is optional and not a ranking factor. We treat both as supporting signals, not magic fixes.",
  },
  {
    q: "Who is this for?",
    a: "Service businesses that depend on search, trust, and high-intent leads: med spas, clinics, contractors, consultants, attorneys, dentists, home service companies, and local professional firms.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Modern SEO / AI Search Optimization",
  name: "Modern Search Website Optimization",
  description: site.description,
  provider: { "@type": "Organization", name: site.name, url: site.url },
  areaServed: "United States",
  offers: site.offers.map((offer) => ({
    "@type": "Offer",
    name: offer.name,
    description: offer.desc,
    url: `${site.url}${offer.href.startsWith("/") ? offer.href : `/${offer.href}`}`,
    price: offer.price,
  })),
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
  publisher: { "@type": "Organization", name: site.name, url: site.url },
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      <main className="home-page">
        <section className="site-section home-hero border-b border-dashed border-line">
          <Container className="relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-2 lg:py-24">
            <div className="relative z-10">
              <div className="fade-up">
                <MonoLabel>queryclear / modern search</MonoLabel>
              </div>
              <h1
                className="fade-up mt-6 max-w-4xl text-balance text-5xl leading-[0.98] sm:text-6xl lg:text-6xl"
                style={{ animationDelay: "0.08s" }}
              >
                Modern SEO for businesses that need to be understood by AI search.
              </h1>
              <p
                className="fade-up mt-6 max-w-2xl text-lg leading-relaxed text-muted"
                style={{ animationDelay: "0.16s" }}
              >
                We turn unclear service websites into readable, trustworthy source
                material for Google, AI Overviews, ChatGPT-style answers, and the
                people who still decide whether to call.
              </p>
              <div
                className="fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "0.24s" }}
              >
                <Cta href={site.primaryCta.href}>{site.primaryCta.label}</Cta>
                <Cta href="#offers" variant="ghost">
                  Compare offers
                </Cta>
              </div>
              <div
                className="fade-up mt-10 grid gap-2 sm:grid-cols-2"
                style={{ animationDelay: "0.32s" }}
              >
                {proofStats.map((stat) => (
                  <div key={stat.k} className="home-proof-chip">
                    <span className="font-mono text-xs uppercase text-lime-deep">{stat.k}</span>
                    <span className="text-sm text-muted">{stat.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up min-w-0" style={{ animationDelay: "0.36s" }}>
              <div className="home-console">
                <div className="home-console__bar">
                  <span className="flex items-center gap-2">
                    <Mark className="h-4 w-4" />
                    visibility console
                  </span>
                  <span>sample trace</span>
                </div>
                <div className="grid gap-4 p-4 md:p-5">
                  <HeroCircuit />
                  <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
                    <div className="home-answer-card">
                      <p className="mono-label !text-lime">Prompt</p>
                      <p className="mt-3 text-2xl leading-tight text-paper">
                        Who is the best-fit local provider for this service?
                      </p>
                      <div className="mt-5 grid gap-2 text-xs text-paper/65">
                        <span>Needs entity clarity</span>
                        <span>Needs service proof</span>
                        <span>Needs source pages worth citing</span>
                      </div>
                    </div>
                    <TypingPanel
                      className="min-h-full"
                      lines={[
                        <span key="a" className="text-paper/40">
                          # answer-engine source profile
                        </span>,
                        <span key="b">
                          <span className="k">business</span>:{" "}
                          <span className="s">verified service provider</span>
                        </span>,
                        <span key="c">
                          <span className="k">market</span>:{" "}
                          <span className="s">clear local coverage</span>
                        </span>,
                        <span key="d">
                          <span className="k">services</span>:{" "}
                          <span className="s">named, linked, explained</span>
                        </span>,
                        <span key="e">
                          <span className="k">proof</span>:{" "}
                          <span className="s">credentials, policies, examples</span>
                        </span>,
                        <span key="f" className="mt-3 block text-lime">
                          status: readable source material
                        </span>,
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Section id="problem" index="01" label="Why sites disappear">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <h2 className="max-w-2xl text-4xl sm:text-5xl">
                <ClipReveal
                  lines={[
                    "Your site is being evaluated",
                    "before anyone clicks.",
                  ]}
                />
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                Modern search does not only rank pages. It extracts, compares,
                summarizes, and decides what deserves to be shown. If your website
                is vague, thin, or hard to parse, it becomes weak source material.
              </p>
            </div>
            <Stagger className="grid gap-4 md:grid-cols-3">
              {issueCards.map((card) => (
                <StaggerItem key={card.title} className="home-issue-card">
                  <p className="mono-label !text-lime-deep">{card.eyebrow}</p>
                  <h3 className="mt-5 text-2xl">{card.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{card.desc}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Section>

        <Section id="method" index="02" label="The route" tone="tinted">
          <div className="home-method-grid grid gap-10 lg:items-start">
            <div>
              <h2 className="max-w-xl text-4xl sm:text-5xl">
                We make every important page pass five gates.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                The work is not magic. It is a practical sequence: make the site
                findable, understandable, credible, answer-ready, and easy to act on.
              </p>
              <div className="mt-8">
                <Cta href="/ai-visibility-stack" variant="ghost">
                  See the full stack
                </Cta>
              </div>
            </div>
            <div className="home-route">
              {searchRoute.map((step, index) => (
                <div key={step.n} className="home-route__step">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-sm text-lime-deep">{step.n}</span>
                    <span className="font-mono text-xs uppercase text-muted">{step.label}</span>
                  </div>
                  <h3 className="mt-5 text-xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.desc}</p>
                  {index < searchRoute.length - 1 && <span className="home-route__connector" />}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="solution" index="03" label="What changes">
          <div className="grid gap-12 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
            <div>
              <MonoLabel>human-readable / machine-readable</MonoLabel>
              <h2 className="mt-4 max-w-xl text-4xl sm:text-5xl">
                One website, two audiences, no fake robot copy.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                The best AI-search work starts with better pages for humans:
                sharper offers, useful details, visible proof, and fewer vague
                claims. Then we structure those facts so search systems can use them.
              </p>
              <div className="mt-8 grid gap-3 text-sm">
                {[
                  "Specific service pages instead of broad brochure copy",
                  "Local and trust signals placed where they support decisions",
                  "Schema that matches visible content",
                  "FAQs written from real buyer questions",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 bg-lime" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <HumanMachineToggle
                human={
                  <div className="home-page-preview">
                    <p className="mono-label !text-lime-deep">Service page</p>
                    <h3 className="mt-4 text-3xl">
                      Botox and fillers in Westhaven, performed by licensed injectors.
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                      A page that explains who the treatment is for, what happens
                      during the visit, who performs it, realistic timing, aftercare,
                      safety policies, and how to book.
                    </p>
                    <div className="mt-6 grid gap-2 sm:grid-cols-3">
                      {["Provider proof", "Treatment FAQs", "Booking path"].map((x) => (
                        <span key={x} className="border border-dashed border-line px-3 py-2 text-xs">
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                }
                machine={
                  <pre className="machine-panel min-h-[13rem]">
                    <code>
                      <span className="k">{"@type"}</span>: <span className="s">MedicalBusiness</span>
                      {"\n"}
                      <span className="k">service</span>: <span className="s">Botox / dermal fillers</span>
                      {"\n"}
                      <span className="k">areaServed</span>: <span className="s">Westhaven metro</span>
                      {"\n"}
                      <span className="k">provider</span>: <span className="s">licensed injectors</span>
                      {"\n"}
                      <span className="k">mainEntity</span>: <span className="s">visible treatment FAQ</span>
                      {"\n\n"}
                      <span className="text-lime">source can be parsed and checked</span>
                    </code>
                  </pre>
                }
              />
            </div>
          </div>
        </Section>

        <Section id="stack" index="04" label="The stack" tone="tinted">
          <div className="mb-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <h2 className="max-w-xl text-4xl sm:text-5xl">
                Seven layers, scored without theatrics.
              </h2>
            </div>
            <p className="max-w-2xl leading-relaxed text-muted lg:justify-self-end">
              Every audit and upgrade is organized around the same stack, so the
              roadmap is clear: fix the weak layer, re-test, then measure what moved.
            </p>
          </div>
          <LineDraw className="mb-8" />
          <Stagger className="home-layer-grid">
            {layerMatrix.map((layer) => (
              <StaggerItem key={layer.n} className="home-layer-row">
                <div className="home-layer-row__index">{layer.n}</div>
                <div>
                  <h3 className="text-2xl">{layer.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{layer.signal}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted">{layer.fix}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="deliverables" index="05" label="What you get">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <h2 className="max-w-lg text-4xl sm:text-5xl">
                Practical outputs, not a mystery report.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                The audit gives you the map. The upgrade applies the fixes. The
                care plan keeps the foundation from drifting as search changes.
              </p>
            </div>
            <Stagger className="grid gap-4 md:grid-cols-2">
              {deliverableGroups.map((group) => (
                <StaggerItem key={group.label} className="card p-6">
                  <p className="mono-label !text-lime-deep">[ {group.label} ]</p>
                  <ul className="mt-5 grid gap-3 text-sm text-muted">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="font-mono text-lime-deep">+</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Section>

        <section id="offers" className="site-section scroll-mt-20 bg-pine py-20 text-paper md:py-24">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-end">
              <div>
                <MonoLabel index="06">Start here</MonoLabel>
                <h2 className="mt-4 max-w-xl text-4xl text-paper sm:text-5xl">
                  Choose the amount of help you want us to carry.
                </h2>
              </div>
              <p className="max-w-2xl leading-relaxed text-paper/68 lg:justify-self-end">
                Begin with a quick read, buy the scored audit, or move straight
                into implementation. The $497 audit is credited in full toward a
                Website Upgrade if you go ahead.
              </p>
            </div>
            <Stagger className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {site.offers.map((offer, index) => (
                <StaggerItem key={offer.name} className="home-offer-card">
                  <div>
                    <p className="font-mono text-xs uppercase text-lime">{offer.price}</p>
                    <h3 className="mt-4 text-2xl text-paper">{offer.name}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-paper/65">{offer.desc}</p>
                  </div>
                  <div className="mt-7">
                    {offer.need === null ? (
                      <Cta
                        href={offer.href}
                        variant={index === 0 ? "primary" : "ghost"}
                        className={index === 0 ? "" : "btn-on-pine"}
                      >
                        {offer.cta}
                      </Cta>
                    ) : (
                      <SnapshotCta
                        href={offer.href}
                        variant="ghost"
                        defaultNeed={offer.need}
                        className="btn-on-pine"
                      >
                        {offer.cta}
                      </SnapshotCta>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-8 grid gap-4 border border-dashed border-paper/18 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <p className="text-sm leading-relaxed text-paper/65">
                Already optimized? The monthly{" "}
                <Link href={site.carePlan.path} className="text-lime underline">
                  AI Search Care Plan
                </Link>{" "}
                keeps the foundation current with a re-audit, hands-on updates,
                and a measured citation watch. Cancel anytime.
              </p>
              <Cta href={site.operator.path} variant="ghost" className="btn-on-pine">
                Meet the operator
              </Cta>
            </div>
          </Container>
        </section>

        <Section id="resources" index="07" label="Deepen the method" tone="tinted">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <h2 className="max-w-lg text-4xl sm:text-5xl">
                The supporting guides are part of the product.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                These pages explain the exact principles behind the work, so you
                can evaluate the method before you buy anything.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {resourceLinks.map((resource) => (
                <Link key={resource.href} href={resource.href} className="home-resource-link">
                  <span className="mono-label !text-lime-deep">[ {resource.eyebrow} ]</span>
                  <span className="mt-4 block font-display text-2xl">{resource.title}</span>
                  <span className="mt-3 block text-sm leading-relaxed text-muted">{resource.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        <Section id="faq" index="08" label="Good to know">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <h2 className="text-4xl sm:text-5xl">Questions, answered.</h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                Honest constraints matter here. We do not sell guaranteed rankings,
                AI-citation promises, or magic files.
              </p>
            </div>
            <Accordion items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
          </div>
        </Section>

        <section id="audit-cta" className="site-section scroll-mt-20 bg-paper-2 py-20 md:py-28">
          <Container className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <MonoLabel index="09">Get started</MonoLabel>
              <h2 className="mt-5 max-w-xl text-4xl sm:text-5xl">
                <ClipReveal lines={["Show us the site.", "We will find the weak layers."]} />
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted">
                Tell us what you run, where you compete, and what you want the site
                to do. A real person reads every inquiry and replies with a practical
                next step.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-muted">
                <Link href="/free-audit" className="ulink w-fit font-medium text-ink">
                  Run the free AI Search Audit first
                </Link>
                <Link href="/ai-visibility-audit" className="ulink w-fit font-medium text-ink">
                  Or see the $497 scored audit
                </Link>
              </div>
            </div>
            <LeadForm />
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Section({
  id,
  index,
  label,
  children,
  tone = "paper",
}: {
  id: string;
  index: string;
  label: string;
  children: ReactNode;
  tone?: "paper" | "tinted";
}) {
  const toneClass = tone === "tinted" ? "home-band-tinted" : "home-band-paper";

  return (
    <section id={id} className={`site-section scroll-mt-20 py-20 md:py-24 ${toneClass}`}>
      <Container>
        <div className="mb-3">
          <MonoLabel index={index}>{label}</MonoLabel>
        </div>
        {children}
      </Container>
    </section>
  );
}
