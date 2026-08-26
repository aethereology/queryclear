import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

const offer = site.websiteBuild;

export const metadata: Metadata = {
  title: "Modern Search Website Build",
  description:
    "A client-owned service-business website with up to seven core pages, technical SEO, analytics, lead capture, and launch QA from $6,500.",
  alternates: { canonical: offer.path },
  openGraph: {
    title: "Modern Search Website Build — queryclear",
    description:
      "A clearly scoped, client-owned website foundation for people, search engines, and AI answer tools.",
  },
};

const included = [
  `One client-owned marketing website, one language, and up to ${offer.pageLimit} agreed core pages`,
  "Discovery, audience and offer clarification, page architecture, conversion path, and verified source-material plan",
  "Responsive implementation in an agreed modern framework or CMS, with semantic HTML and accessible interaction patterns",
  "Page copy structure and editing based on facts, claims, credentials, policies, and assets the client verifies",
  "Unique titles and descriptions, canonical handling, sitemap, robots, Open Graph data, structured data, and internal links",
  "One primary lead form connected to one agreed client-owned destination, with success and failure testing",
  "GA4, Google Search Console, and Bing Webmaster setup or connection when client-owned account access is supplied",
  "Performance, responsive, keyboard, form, crawl, schema, broken-link, and launch QA",
  "Two consolidated revision rounds and a written handoff for repository, hosting, domain, analytics, and ongoing ownership",
];

const excluded = [
  "A new logo, full brand identity, custom photography, video, illustration, or premium asset licensing",
  "E-commerce, memberships, portals, complex calculators, mobile apps, or custom back-office software",
  "More than seven pages, additional languages, large content migrations, or copy based on unverified claims",
  "CRM or booking integrations beyond the one destination named in the SOW",
  "Ongoing SEO, content publishing, paid media, backlink work, or Google Business Profile management after launch",
  "Hosting, domain, email, software, stock, premium font, and other third-party charges unless the SOW says otherwise",
  "Legal, medical, privacy, security, or regulatory approval of the client’s business and claims",
  "Guaranteed rankings, traffic, leads, recommendations, revenue, or AI citations",
];

const process = [
  {
    t: "Scope and source",
    d: "We agree on seven core pages, one primary conversion, platform, integrations, source materials, owners, milestones, and acceptance criteria in the SOW.",
  },
  {
    t: "Design and build",
    d: "We work in a client-visible preview. You approve page direction and all material business, credential, pricing, service, and regulated claims.",
  },
  {
    t: "Validate and launch",
    d: "We complete the agreed crawl, schema, accessibility, responsive, analytics, and form tests, then launch after written approval and deliver the handoff.",
  },
];

const faqs = [
  {
    q: "What does “from $6,500” include?",
    a: `The base price covers the ${offer.pageLimit}-page, one-language marketing-site scope listed on this page. Final price is fixed in a signed SOW after platform, content, integration, migration, and asset requirements are known. Added work requires a written change order.`,
  },
  {
    q: "How long does a build take?",
    a: `A base build typically takes ${offer.typicalTimeline}. Missing source material, account access, approvals, or added scope pauses or changes the schedule. The SOW contains the binding milestones.`,
  },
  {
    q: "Do you use Next.js, Astro, SvelteKit, or a CMS?",
    a: "We choose the simplest supported platform that meets the agreed editing, performance, integration, and ownership needs. Modern server-rendered or static frameworks are preferred where appropriate; a mainstream CMS can be used when the client’s editing workflow requires it. The platform is named before work begins.",
  },
  {
    q: "Who owns the domain, hosting, analytics, and code?",
    a: "The goal is client-owned accounts and assets. The SOW identifies account owners and transfer steps. After full payment, you receive the client-specific deliverables and rights stated in the SOW; queryclear retains its reusable methods, tools, and know-how.",
  },
  {
    q: "Do you guarantee rankings or AI citations?",
    a: "No. We deliver the agreed website, technical foundation, useful source material, measurement setup, and QA. Third-party search and AI systems control their own rankings and answers.",
  },
  {
    q: "Is the $497 audit credited?",
    a: `Yes. The audit fee is credited once toward a Website Upgrade or Website Build of $${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more for the same website when the agreement is signed within ${site.auditProduct.creditDays} days after report delivery. The credit is not cash and cannot be combined unless agreed in writing.`,
  },
  {
    q: "What happens after launch?",
    a: "You receive a written handoff and any correction period stated in the SOW. Ongoing content, optimization, and maintenance are optional separate services; the Care Plan is available only after eligibility review.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: offer.name,
  url: `${site.url}${offer.path}`,
  description:
    "A client-owned service-business marketing website with up to seven core pages, technical SEO, analytics connections, lead capture, and launch QA.",
  isPartOf: { "@id": site.schemaIds.website },
  about: { "@id": site.schemaIds.brand },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: offer.name,
  serviceType: "Service-business marketing website design and development",
  url: `${site.url}${offer.path}`,
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  areaServed: "United States",
  description:
    "A client-owned service-business marketing website with up to seven pages, technical SEO, analytics connections, lead capture, and launch QA.",
  offers: {
    "@type": "Offer",
    price: "6500",
    priceCurrency: "USD",
    description: "Base scope; final fixed price follows platform and scope review.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: offer.name, item: `${site.url}${offer.path}` },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function ReadyWebsitePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="build">{offer.name} · {offer.priceLabel}</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              A client-owned website built for clarity and action.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              A new marketing foundation for service businesses that need more than
              a patch. The base build covers up to {offer.pageLimit} core pages,
              verified copy structure, technical SEO, structured data, analytics
              connections, lead capture, launch QA, and a written handoff.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="#build-cta">Request a build scope</Cta>
              <Cta href="/website-upgrade" variant="ghost">Compare the Website Upgrade</Cta>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
              Base scope: {offer.priceLabel} · {offer.typicalTimeline} · {offer.revisionRounds} consolidated
              revision rounds. Final scope, schedule, and price are set in a signed SOW.
            </p>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-2">
            <div>
              <MonoLabel index="01">Base scope includes</MonoLabel>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-muted">
                {included.map((item) => (
                  <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-lime-deep">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel index="02">Not in the base scope</MonoLabel>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-muted">
                {excluded.map((item) => (
                  <li key={item} className="flex gap-3"><span aria-hidden="true">—</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="03">Delivery</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">One scope, visible approvals, clean handoff.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {process.map((item, index) => (
                <div key={item.t} className="card p-6">
                  <span className="font-display text-3xl text-lime-deep">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-xl">{item.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Build questions, answered.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
              Engagements are also governed by the signed SOW and our{" "}
              <a href="/terms" className="font-medium text-ink underline">Terms of Service</a>.
              If those documents conflict, the signed SOW controls for that engagement.
            </p>
          </Container>
        </section>

        <section id="build-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <MonoLabel index="05" tone="inverse">Request a fixed scope</MonoLabel>
              <h2 className="mt-5 text-3xl text-paper sm:text-4xl">Define the seven pages that matter.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                Share the current site, platform, primary services, and conversion
                goal. We will confirm whether a build is necessary and what belongs
                in the written scope before asking you to commit.
              </p>
            </div>
            <LeadForm defaultNeed="Modern Search Website Build" submitLabel="Request my build scope" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
