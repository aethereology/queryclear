import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

const offer = site.upgrade;

export const metadata: Metadata = {
  title: "Website Upgrade",
  description:
    "Upgrade up to five priority pages, technical SEO, structured data, internal links, analytics checks, and conversion paths from $2,500.",
  alternates: { canonical: offer.path },
  openGraph: {
    title: "Website Upgrade — queryclear",
    description:
      "A fixed-scope modern-search improvement sprint for the website you already have, from $2,500.",
  },
};

const included = [
  `One existing public website and up to ${offer.pageLimit} agreed priority pages`,
  "A kickoff review of crawlability, indexability, page hierarchy, existing analytics, and verified business facts",
  "Page-level improvements to headings, metadata, copy structure, answer coverage, proof placement, and calls to action",
  "Accurate Organization or LocalBusiness, Service, WebPage, and applicable visible FAQ structured data",
  "Internal-link, sitemap, robots, canonical, Open Graph, and basic accessibility corrections within the agreed pages and templates",
  "GA4, Google Search Console, and Bing Webmaster connection checks; account setup or verification when client-owned access is provided",
  "Staging or preview review, one consolidated revision round, crawl/schema/form QA, and a written handoff",
];

const excluded = [
  "A full redesign, rebrand, platform migration, or replacement website",
  "More than five priority pages, net-new long-form pages, custom applications, or complex integrations",
  "Ongoing content production, backlink acquisition, paid media, directory management, or Google Business Profile management",
  "Photography, video, illustration, premium fonts, stock assets, hosting, domains, or other third-party fees",
  "Legal, medical, security, privacy, or regulatory approval of client claims and materials",
  "Guaranteed rankings, traffic, leads, recommendations, or AI citations",
];

const process = [
  {
    t: "Confirm scope",
    d: "We review the site, platform, access, five priority pages, verified facts, and desired conversion action before issuing the fixed SOW.",
  },
  {
    t: "Build safely",
    d: "We work in staging, a preview branch, or a backed-up environment where the platform allows it. You approve material copy and claim changes.",
  },
  {
    t: "Validate and hand off",
    d: "We test crawl signals, structured data, links, forms, analytics connections, responsive behavior, and agreed accessibility checks before launch.",
  },
];

const faqs = [
  {
    q: "What does “from $2,500” mean?",
    a: `The $2,500 base scope covers one existing site and up to ${offer.pageLimit} agreed priority pages with the inclusions on this page. Final price is fixed in a written SOW after platform, access, content, and technical complexity are reviewed. Work outside the SOW requires written approval and a change order.`,
  },
  {
    q: "How long does the upgrade take?",
    a: `A base engagement typically takes ${offer.typicalTimeline}. Client delays, missing access, unverified claims, and added scope pause or change the schedule. The signed SOW contains the actual dates.`,
  },
  {
    q: "Which platforms do you support?",
    a: "Modern frameworks and mainstream CMS platforms are considered case by case. We confirm that the current platform supports safe editing, previews or backups, metadata, structured data, analytics, and handoff before accepting the project.",
  },
  {
    q: "Who owns the work?",
    a: "After full payment, you receive the client-specific deliverables and handoff rights stated in the SOW. You retain your pre-existing materials and accounts. queryclear retains its general methods, reusable tools, and know-how.",
  },
  {
    q: "Is the $497 audit credited?",
    a: `Yes. The audit fee is credited once toward a Website Upgrade or Website Build of $${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more for the same website when the agreement is signed within ${site.auditProduct.creditDays} days after report delivery. The credit is not cash and cannot be combined unless agreed in writing.`,
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: offer.name,
  url: `${site.url}${offer.path}`,
  description:
    "A fixed-scope improvement sprint for an existing service-business website, including up to five priority pages and technical launch QA.",
  isPartOf: { "@id": site.schemaIds.website },
  about: { "@id": site.schemaIds.brand },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: offer.name,
  serviceType: "Fixed-scope website optimization",
  url: `${site.url}${offer.path}`,
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  areaServed: "United States",
  description:
    "A fixed-scope improvement sprint for an existing service-business website, including up to five priority pages and technical launch QA.",
  offers: {
    "@type": "Offer",
    price: "2500",
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

export default function WebsiteUpgradePage() {
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
            <MonoLabel index="upgrade">{offer.name} · {offer.priceLabel}</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Fix the site you have before replacing it.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              A fixed-scope implementation sprint for an existing service-business
              website. The base engagement improves up to {offer.pageLimit} priority
              pages, the technical search foundation, structured data, internal
              links, analytics connections, and the path from visit to inquiry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="#upgrade-cta">Request a fixed scope</Cta>
              <Cta href="/ai-visibility-audit" variant="ghost">Start with the $497 audit</Cta>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
              Base scope: {offer.priceLabel} · {offer.typicalTimeline} · {offer.revisionRounds} consolidated
              revision round. Final scope, schedule, and price are set in a signed SOW.
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
            <h2 className="mt-3 text-3xl sm:text-4xl">Scoped, reviewed, and reversible.</h2>
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
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Scope questions, answered.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
              Engagements are also governed by the signed SOW and our{" "}
              <a href="/terms" className="font-medium text-ink underline">Terms of Service</a>.
              If those documents conflict, the signed SOW controls for that engagement.
            </p>
          </Container>
        </section>

        <section id="upgrade-cta" className="scroll-mt-20 bg-pine py-20 text-paper">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <MonoLabel index="05" tone="inverse">Request a fixed scope</MonoLabel>
              <h2 className="mt-5 text-3xl text-paper sm:text-4xl">Show us the current site.</h2>
              <p className="mt-4 max-w-md text-paper/70">
                We will confirm whether an upgrade is the right intervention, what
                the five priority pages should be, and which access or platform
                constraints affect the fixed price.
              </p>
            </div>
            <LeadForm defaultNeed="Website Upgrade" submitLabel="Request my upgrade scope" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
