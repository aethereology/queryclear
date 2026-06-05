import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "GEO Audit — Generative Engine Optimization",
  description:
    "A GEO (Generative Engine Optimization) audit from queryclear identifies the gaps in your site's structure, content, proof, and crawlability that keep AI answer engines from understanding you. GEO is a layer on top of solid SEO — not a replacement, and not magic.",
  alternates: { canonical: "/geo-audit" },
  openGraph: {
    title: "GEO Audit — queryclear",
    description: "Find the gaps that keep AI answer engines from understanding your business. GEO is a layer on top of good SEO.",
  },
};

const includes = [
  { t: "Crawl & index readiness", d: "Can search and AI systems reach and parse your pages at all?" },
  { t: "Structured data review", d: "What schema exists, what's missing, and what's invalid." },
  { t: "Entity & service clarity", d: "Whether a machine can tell who you are and what you offer." },
  { t: "Content & answer coverage", d: "Whether your pages answer the questions buyers actually ask." },
  { t: "AI-visibility tests", d: "Real queries run against the major answer engines for your category." },
  { t: "Prioritized fix list", d: "Plain-English recommendations, biggest impact first." },
];

const faqs = [
  { q: "What is GEO?", a: "GEO — Generative Engine Optimization — is making your site easy for AI answer engines (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) to crawl, understand, summarize, trust, and cite. It's the answer-engine counterpart to SEO." },
  { q: "Is GEO a replacement for SEO?", a: "No. GEO sits on top of solid SEO fundamentals — crawlable, helpful, well-structured content. If your SEO basics are broken, GEO can't paper over them. We treat GEO as the next layer, not a substitute." },
  { q: "Is this just hype?", a: "We're deliberately skeptical of hype. GEO isn't magic and there are no secret tricks. It's disciplined clarity and structure so machines can understand you. We won't promise rankings or citations." },
];

const webPageSchema = { "@context": "https://schema.org", "@type": "WebPage", name: "GEO Audit", url: `${site.url}/geo-audit`, description: "A Generative Engine Optimization audit of a website's AI-search readiness.", isPartOf: { "@type": "WebSite", name: site.name, url: site.url } };
const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: "GEO Audit", serviceType: "Generative Engine Optimization audit", provider: { "@type": "Organization", name: site.name, url: site.url }, description: "An audit identifying gaps in a site's structure, content, proof, and crawlability for AI answer engines.", areaServed: "United States" };
const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` }, { "@type": "ListItem", position: 2, name: "GEO Audit", item: `${site.url}/geo-audit` } ] };

export default function GeoAuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="geo">GEO audit</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">A GEO audit, without the hype.</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Generative Engine Optimization is the work of making your site clear and
              structured enough for AI answer engines to understand and summarize.
              Our GEO audit finds the concrete gaps holding you back — and we&apos;re
              honest that GEO is a layer on top of good SEO, not a magic switch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/ai-visibility-audit">Get a GEO audit</Cta>
              <Cta href="/audit" variant="ghost">See a sample audit</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div><MonoLabel index="01">How GEO relates to SEO</MonoLabel></div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>Traditional SEO competes for a ranked list of blue links. GEO shapes the <em>answer</em> an AI gives when someone asks about your category — whether it can describe you accurately and consider recommending you.</p>
              <p>They aren&apos;t rivals. GEO depends on SEO fundamentals: if a page can&apos;t be crawled or isn&apos;t helpful, no amount of structure saves it. We assess both, and we won&apos;t sell GEO as a way around doing the basics well.</p>
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">What the audit includes</MonoLabel>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {includes.map((i) => (
                <StaggerItem key={i.t} className="card p-6">
                  <h2 className="text-lg">{i.t}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{i.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-6 text-sm text-muted">We score each area against the <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">AI Visibility Stack</a>.</p>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">What we won&apos;t promise</MonoLabel>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              We won&apos;t promise rankings, traffic, or AI citations — those depend
              on third-party systems no one controls. We will make your business
              genuinely clearer and more trustworthy to those systems, and show you
              exactly what changed and why.
            </p>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="04">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Ready for a straight GEO audit?</h2>
              <p className="mt-3 max-w-xl text-paper/70">Start free. Paid reports start at $750.</p>
            </div>
            <Cta href="/ai-visibility-audit">Get a GEO audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
