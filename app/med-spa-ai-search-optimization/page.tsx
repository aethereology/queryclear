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
    "When someone asks ChatGPT, Gemini, or Google AI Overviews for a med spa, the answer names a few providers. queryclear makes a med spa's website clear, structured, and trustworthy to answer engines — real treatment pages, honest proof, and machine-readable details — so you're in the running.",
  alternates: { canonical: "/med-spa-ai-search-optimization" },
  openGraph: {
    title: "AI Search Optimization for Med Spas — queryclear",
    description:
      "Be the med spa an AI answer engine can understand and recommend: real treatment pages, honest proof, structured details.",
  },
};

const why = [
  {
    t: "Treatment questions go to AI now",
    d: "“Best place for Botox near me,” “who does microneedling in [city],” “laser hair removal that's worth it” — increasingly that question goes to an AI, and the answer names a few providers. If a model can't read what you offer, you're not one of them.",
  },
  {
    t: "Chains and franchises crowd the answer",
    d: "National med-spa brands publish clear, structured, treatment-by-treatment sites. An independent spa with a thin homepage and one vague service list gets skipped — not because it's worse, but because it's harder to understand.",
  },
  {
    t: "Your treatments aren't really on the page",
    d: "A single “Services” list can't be matched to a specific treatment query. Without a real page per treatment — what it is, who it's for, what to expect — the model has nothing concrete to cite.",
  },
];

// The 7-layer AI Visibility Stack (from /ai-visibility-stack), read through a
// med-spa lens. Honest framing — structure and clarity, not guarantees.
const layers = [
  { t: "Entity clarity", d: "One consistent name, address, and phone across your site, Google Business Profile, and listings — so a model knows exactly which business you are." },
  { t: "Service specificity", d: "A real page per treatment (injectables, microneedling, laser, facials) instead of one catch-all list machines can't parse." },
  { t: "Proof density", d: "Real reviews and before/after results surfaced where they can be read — not locked inside an image or a third-party widget." },
  { t: "Local relevance", d: "The city, neighborhoods, and service area you actually serve, stated plainly and consistently." },
  { t: "Answer coverage", d: "The questions buyers ask — safety, downtime, cost ranges, aftercare — answered on the page so an engine can quote you." },
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
    a: "No — no one can honestly promise that, and we won't. What we control is the reason an engine would skip or misdescribe you: unclear treatments, missing structure, weak local signals, no answer content. We fix those. Whether a given engine cites you on a given day is never guaranteed.",
  },
  {
    q: "Is this just SEO for med spas with a new name?",
    a: "No. Local and technical SEO still matter and we build on them. This adds the layer that decides whether an AI answer engine can understand your treatments, location, and proof well enough to describe and recommend you — a newer, related problem.",
  },
  {
    q: "Do I really need a separate page for every treatment?",
    a: "For the treatments you want to be found for, yes. A query like “lip filler near me” matches a clear lip-filler page far better than one line in a combined services list. It's also better for the humans comparing options.",
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
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Search Optimization for Med Spas",
  serviceType: "AI search optimization for med spas",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description:
    "Optimizing med-spa websites so search and AI answer engines can understand, trust, and recommend them — treatment pages, structured data, local signals, and proof.",
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
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="med spa">AI search for med spas</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              When someone asks AI for a med spa, be the answer.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              People now ask ChatGPT, Gemini, and Google AI Overviews where to get
              Botox, microneedling, or laser treatments — and the answer names a
              few providers. queryclear makes a med spa&apos;s website clear,
              structured, and trustworthy to those engines, so your treatments can
              be understood and recommended.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/free-audit">Run a free audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See our method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Why med spas go invisible</MonoLabel>
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
              Seven layers machines read before they recommend you.
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
              <h2 className="text-3xl text-paper sm:text-4xl">See how modern search sees your med spa.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                A free audit shows what to fix first, in plain English. The full
                scored audit is $497.
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
