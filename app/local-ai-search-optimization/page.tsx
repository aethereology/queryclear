import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Local AI Search Optimization",
  description:
    "Local discovery is moving from a map of links to a single AI answer. queryclear helps local and service businesses become clear, structured, and trustworthy to ChatGPT, Gemini, Google AI Overviews, and other answer engines — so 'near me' questions can surface you.",
  alternates: { canonical: "/local-ai-search-optimization" },
  openGraph: {
    title: "Local AI Search Optimization — queryclear",
    description:
      "Help AI answer engines connect your local business to your city, services, and customers.",
  },
};

const why = [
  { t: "Customers ask AI for recommendations now", d: "“Best dentist near me,” “who does microneedling in [city]” — increasingly that question goes to an AI, and the answer names a few businesses. If you're not legible to the model, you're not in the running." },
  { t: "A Google Business Profile isn't enough", d: "A profile helps maps, but answer engines also read your website. If your site doesn't clearly state what you do, where, and for whom, the AI has little to go on beyond a pin." },
  { t: "Most local sites were built for old Google", d: "Thin homepages, vague service lists, no structured data. They were built to rank a link, not to be understood and summarized by a machine." },
];

const fixes = [
  { t: "Service-area clarity", d: "We make the cities and neighborhoods you serve explicit and machine-readable." },
  { t: "Clear service pages", d: "A real page per service — what it is, who it's for, where — instead of one vague list." },
  { t: "LocalBusiness & Service schema", d: "Valid structured data built only from your real, verified details." },
  { t: "Review & proof signals", d: "Surfacing the honest trust signals you already have, where machines can read them." },
  { t: "Google Business Profile alignment", d: "Making your site and your profile tell the same, consistent story." },
  { t: "A working booking / contact path", d: "So an AI-referred visitor can actually take the next step." },
];

const industries = ["Med spas", "Aestheticians", "Spas & salons", "Dentists & clinics", "Home services", "Wellness studios"];

const faqs = [
  { q: "Is this just local SEO with a new name?", a: "No. Local SEO still matters and we build on it. This adds the layer that decides whether an AI answer engine can understand your business well enough to describe and recommend it — which is a different, newer problem." },
  { q: "Will this guarantee I show up when someone asks AI?", a: "No one can honestly guarantee that. We remove the reasons an AI would skip or misdescribe you: unclear services, missing structure, weak local signals. That's the part we control." },
  { q: "I already have a Google Business Profile. Isn't that enough?", a: "It's necessary but not sufficient. Answer engines also read your website. We make sure your site and profile tell the same clear story." },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Local AI Search Optimization",
  url: `${site.url}/local-ai-search-optimization`,
  description: "Helping local and service businesses become legible to AI answer engines.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Local AI Search Optimization",
  serviceType: "Local AI search optimization (GEO)",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description: "Optimizing local and service-business websites so search and AI answer engines can understand, trust, and recommend them.",
  areaServed: "United States",
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Local AI Search Optimization", item: `${site.url}/local-ai-search-optimization` },
  ],
};

export default function LocalPage() {
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
            <MonoLabel index="local">Local AI search</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              When someone asks AI for a business near them, be the answer.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Local discovery is shifting from a map of links to a single AI-generated
              recommendation. queryclear makes local and service businesses clear,
              structured, and trustworthy to the answer engines — so you can be
              understood and considered when it counts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/ai-visibility-audit">Get a local AI visibility audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See our method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">Why local discovery is changing</MonoLabel>
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
            <MonoLabel index="02">What queryclear fixes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">The local signals machines need.</h2>
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

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Industries we serve</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Built for appointment-based local businesses.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {industries.map((i) => (
                <span key={i} className="border border-dashed border-line bg-paper px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink">{i}</span>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm text-muted">
              Don&apos;t see yours? The approach applies to most local and service
              businesses — <a href="/contact" className="font-medium text-ink underline hover:text-lime-deep">ask us</a>.
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
              <h2 className="text-3xl text-paper sm:text-4xl">See how AI sees your local business.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                A free audit shows how answer engines describe you today and what to
                fix first. Paid reports start at $750.
              </p>
            </div>
            <Cta href="/ai-visibility-audit">Get a local AI visibility audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
