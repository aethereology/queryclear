import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Search Optimization for Med Spas",
  description:
    "Improve med-spa treatment pages, verified proof, local signals, structured data, and booking paths for modern search and AI answer tools.",
  alternates: { canonical: "/med-spa-ai-search-optimization" },
  openGraph: {
    title: "AI Search Optimization for Med Spas — queryclear",
    description:
      "Improve treatment pages, verified provider proof, local signals, structured data, and booking paths for modern search.",
  },
};

const why = [
  {
    t: "Treatment questions go to AI now",
    d: "Questions such as “Botox near me” or “what should I expect after microneedling?” increasingly surface summaries alongside links. Specific public treatment information gives buyers and systems more to evaluate.",
  },
  {
    t: "Large brands publish more source material",
    d: "National brands often publish treatment-by-treatment pages, policies, provider details, and FAQs. An independent spa can compete on clarity and real local proof without copying generic chain content.",
  },
  {
    t: "Your treatments aren't really on the page",
    d: "A single combined Services list rarely answers fit, provider, process, timing, risks, aftercare, pricing guidance, or booking questions for a priority treatment.",
  },
];

// The 7-layer AI Visibility Stack (from /ai-visibility-stack), read through a
// med-spa lens. Honest framing — structure and clarity, not guarantees.
const layers = [
  { t: "Entity clarity", d: "One consistent name, address, phone, category, ownership, and provider identity across the site and business profiles." },
  { t: "Service specificity", d: "A real page per priority treatment (injectables, microneedling, laser, facials) instead of one catch-all list that provides little detail." },
  { t: "Proof density", d: "Real reviews and before/after results surfaced where they can be read — not locked inside an image or a third-party widget." },
  { t: "Local relevance", d: "The city, neighborhoods, and service area you actually serve, stated plainly and consistently." },
  { t: "Answer coverage", d: "The questions buyers ask — candidacy, safety, downtime, cost guidance, and aftercare — answered with practice-approved source information." },
  { t: "Machine readability", d: "Valid Service and FAQ structured data built only from your real details, plus a crawlable, fast site." },
  { t: "Conversion path", d: "A consult or booking step an AI-referred visitor can actually take when they land." },
];

const fixes = [
  { t: "Per-treatment service pages", d: "A clear page for each treatment you offer — what it is, who it's for, what to expect — instead of one vague list." },
  { t: "Treatment FAQ content", d: "Plain answers to the safety, downtime, cost-range, and aftercare questions buyers (and AI engines) actually ask." },
  { t: "Provider & credential clarity", d: "Who performs treatments and their real qualifications, stated where people and machines can read it." },
  { t: "Review & before/after proof", d: "Surfacing the honest results and reviews you already have so they're legible, not buried in images." },
  { t: "Profile ↔ site consistency", d: "Making your website and Google Business Profile tell the same, consistent story." },
  { t: "A working consult / booking path", d: "So an AI-referred visitor has an obvious next step instead of a dead end." },
];

const faqs = [
  {
    q: "Will this guarantee my med spa shows up when someone asks ChatGPT?",
    a: "No. We can improve and validate the public website and record bounded answer samples. We cannot control a third party's index, ranking, recommendation, citation, personalization, or changing output.",
  },
  {
    q: "Is this just SEO for med spas with a new name?",
    a: "It is modern local and technical SEO applied to newer answer interfaces, not a replacement discipline. The work still depends on crawlability, useful treatment content, verified practice facts, proof, business-profile alignment, structured data, and conversion paths.",
  },
  {
    q: "Do I really need a separate page for every treatment?",
    a: "Not necessarily every treatment. Priority treatments usually benefit from a dedicated, useful page because it can cover fit, provider, process, risks, aftercare, pricing guidance, and the next step more clearly than one line in a combined list.",
  },
  {
    q: "Can you make claims about treatment results or add testimonials?",
    a: "No. We never invent results, reviews, or credentials, and we keep medical claims honest and conservative. We make the true things about your practice — your real services, qualifications, and existing reviews — clear and machine-readable.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Search Optimization for Med Spas",
  url: `${site.url}/med-spa-ai-search-optimization`,
  description:
    "Helping med spas become legible to AI answer engines with real treatment pages, honest proof, and structured details.",
  isPartOf: { "@id": site.schemaIds.website },
};
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Search Optimization for Med Spas",
  serviceType: "AI search optimization for med spas",
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  description:
    "Improving med-spa treatment pages, verified provider proof, local signals, structured data, business-profile alignment, and booking paths.",
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
      name: "AI Search Optimization for Med Spas",
      item: `${site.url}/med-spa-ai-search-optimization`,
    },
  ],
};

export default function MedSpaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="med spa">AI search for med spas</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Make each priority treatment easier to evaluate.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              queryclear structures med-spa websites around specific treatments,
              verified provider facts, genuine local relevance, candid buyer answers,
              appropriate proof, and a clear consult or booking path. Your practice
              remains responsible for clinical and regulatory approval of every claim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See our method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Where med-spa sites lose clarity</MonoLabel>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
              {why.map((w) => (
                <StaggerItem key={w.t} className="card p-6">
                  <h2 className="text-lg">{w.t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">The stack, applied to a med spa</MonoLabel>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              Seven layers that strengthen the public source material.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-muted">
              Every audit and upgrade works through the same framework — our{" "}
              <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                AI Visibility Stack
              </a>
              . Here&apos;s what each layer means for a med spa.
            </p>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {layers.map((l) => (
                <StaggerItem key={l.t} className="card p-6">
                  <h3 className="text-lg">{l.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{l.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">What queryclear fixes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">The details a med spa is usually missing.</h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {fixes.map((f) => (
                <StaggerItem key={f.t} className="card p-6">
                  <h3 className="text-lg">{f.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <MonoLabel index="04">See it on a med spa</MonoLabel>
              <h2 className="mt-3 text-3xl sm:text-4xl">A sample audit, scored layer by layer.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Our public sample audit is a fictional med spa, “Goldleaf Aesthetics.”
                It shows the scored 7-layer readiness report and the prioritized fixes
                we&apos;d make — the same format a real client receives.
              </p>
            </div>
            <Cta href="/audit" variant="ghost">View the sample audit</Cta>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="05">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Check your public treatment-page foundation.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                The free automated preview checks public pages and labels its limits.
                The full human-reviewed audit is $497. Do not submit patient information.
              </p>
            </div>
            <Cta href="/free-audit">Run a free audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
