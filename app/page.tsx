import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

const whatWeBuild = [
  { t: "New AI-search-ready websites", d: "Built from the ground up to be crawlable, clear, and citable." },
  { t: "Existing website optimization", d: "We add the structure, schema, and clarity your current site is missing." },
  { t: "GEO audits", d: "A scored review of how AI answer engines see you, with a prioritized fix list." },
  { t: "Service page rebuilds", d: "Pages that state plainly what you do, where, and for whom." },
  { t: "Local AI visibility", d: "Help the answer engines connect your business to your city and services." },
];

const steps = [
  { n: "01", t: "Audit", d: "We test how the answer engines describe you today and find what's blocking them." },
  { n: "02", t: "Plan", d: "A prioritized, plain-English fix list — biggest impact first." },
  { n: "03", t: "Build / optimize", d: "We implement: schema, llms.txt, structure, content clarity, speed." },
  { n: "04", t: "Submit / index", d: "Sitemaps, robots, and Search Console setup so you get crawled." },
  { n: "05", t: "Monitor", d: "We re-run the AI visibility tests and track what changed." },
];

const deliverables = [
  "Title tags & meta descriptions",
  "Open Graph metadata",
  "JSON-LD schema",
  "FAQ sections",
  "llms.txt",
  "sitemap.xml & robots.txt",
  "AI-readable business profile",
  "Clear heading hierarchy",
  "Internal linking",
  "Accessible forms & CTAs",
  "Search Console setup guidance",
  "AI visibility test prompts",
];

const faqs = [
  {
    q: "What is AI Search Optimization (GEO)?",
    a: "GEO — Generative Engine Optimization — is making your website easy for AI answer engines like ChatGPT, Claude, Perplexity, and Google AI Overviews to crawl, understand, summarize, trust, and cite. It's the next layer on top of traditional SEO.",
  },
  {
    q: "Do you guarantee I'll rank or get cited?",
    a: "No, and you should distrust anyone who does. We make your site genuinely more readable and trustworthy to search and AI systems. That's the part we control, and we do it well.",
  },
  {
    q: "How is this different from regular SEO?",
    a: "Traditional SEO targets blue links. GEO targets the answer itself — structured data, clear entities, and machine-readable summaries so an AI can confidently describe and recommend you.",
  },
  {
    q: "What do I get from the free audit?",
    a: "A real review of how AI answer engines currently see your business, the gaps holding you back, and a prioritized fix list. No obligation.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "AI Search Optimization (Generative Engine Optimization)",
  name: "AI Search Optimization Audit",
  description: site.description,
  provider: { "@type": "Organization", name: site.name, url: site.url },
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="grid-texture pointer-events-none absolute inset-0 opacity-60" />
          <Container className="relative grid items-center gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
            <div>
              <div className="fade-up">
                <MonoLabel>AI search optimization · GEO</MonoLabel>
              </div>
              <h1
                className="fade-up mt-6 text-balance text-5xl leading-[1.02] sm:text-6xl"
                style={{ animationDelay: "0.08s" }}
              >
                Get found when people ask AI.
              </h1>
              <p
                className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-muted"
                style={{ animationDelay: "0.16s" }}
              >
                We make your website easier for search engines and AI answer
                engines — ChatGPT, Claude, Perplexity, Gemini, Google AI
                Overviews — to crawl, understand, trust, and recommend.
              </p>
              <div
                className="fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "0.24s" }}
              >
                <Cta href={site.primaryCta.href}>{site.primaryCta.label}</Cta>
                <Cta href={site.secondaryCta.href} variant="ghost">
                  {site.secondaryCta.label}
                </Cta>
              </div>
            </div>

            {/* the signature: what the machine reads */}
            <div className="fade-up" style={{ animationDelay: "0.32s" }}>
              <p className="mono-label mb-2">// what the AI reads about you</p>
              <div className="machine-panel">
                <div>
                  <span className="text-paper/40"># llms.txt</span>
                </div>
                <div>
                  <span className="k">Business</span>:{" "}
                  <span className="s">Brightleaf Plumbing Co.</span>
                </div>
                <div>
                  <span className="k">Serves</span>:{" "}
                  <span className="s">Riverton metro — 24/7 emergency</span>
                </div>
                <div>
                  <span className="k">Offers</span>:{" "}
                  <span className="s">drain cleaning, water heaters, leaks</span>
                </div>
                <div className="mt-2">
                  <span className="text-paper/40">
                    &#123; &quot;@type&quot;: &quot;
                  </span>
                  <span className="k">LocalBusiness</span>
                  <span className="text-paper/40">&quot;, &quot;name&quot;: &quot;</span>
                  <span className="s">Brightleaf…</span>
                  <span className="text-paper/40">&quot; &#125;</span>
                </div>
                <div className="mt-3 text-lime">✓ clear · structured · citable</div>
              </div>
            </div>
          </Container>
        </section>

        {/* ── PROBLEM ──────────────────────────────────────── */}
        <Section id="problem" index="01" label="The problem">
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            Your customers are asking AI. Is it recommending you?
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {[
              ["Invisible in AI answers", "When someone asks an assistant for a business like yours, you're not in the answer."],
              ["Unclear to machines", "Most sites don't state plainly what they do, where, and for whom — so AI can't trust them."],
              ["SEO alone isn't enough", "Ranking for blue links doesn't mean an AI will summarize or cite you."],
            ].map(([t, d]) => (
              <div key={t} className="bg-paper p-7">
                <h3 className="text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SOLUTION ─────────────────────────────────────── */}
        <Section id="solution" index="02" label="What we optimize" tinted>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl">
                We make your site legible — to people and to machines.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                Same site, two readers. We give the answer engines the structure
                and clarity they need, without making your site feel robotic to
                the humans you&apos;re actually selling to.
              </p>
              <ul className="mt-7 grid gap-2.5 text-sm">
                {["Structured content & clear entities", "JSON-LD schema markup", "Service pages & FAQs", "llms.txt & crawlability", "AI-readable business summary"].map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-5">
                  <p className="mono-label mb-2">Human view</p>
                  <p className="font-display text-2xl leading-tight">
                    Fast, leak-free water — same-day in Riverton.
                  </p>
                </div>
                <div className="machine-panel">
                  <div><span className="k">name</span>: <span className="s">Brightleaf</span></div>
                  <div><span className="k">service</span>: <span className="s">plumbing</span></div>
                  <div><span className="k">area</span>: <span className="s">Riverton</span></div>
                  <div><span className="k">hours</span>: <span className="s">24/7</span></div>
                  <div className="mt-2 text-lime">↳ citable</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── WHAT WE BUILD ────────────────────────────────── */}
        <Section id="build" index="03" label="What we build">
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            From a quick audit to a full AI-ready rebuild.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeBuild.map((c) => (
              <div key={c.t} className="card flex flex-col p-6">
                <h3 className="text-xl">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
              </div>
            ))}
            <div className="card flex flex-col justify-between bg-pine p-6 text-paper">
              <h3 className="text-xl text-paper">Not sure where you stand?</h3>
              <div className="mt-4">
                <Cta href={site.primaryCta.href}>Start with a free audit</Cta>
              </div>
            </div>
          </div>
        </Section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <Section id="how" index="04" label="How it works" tinted>
          <h2 className="max-w-2xl text-4xl sm:text-5xl">A clear path, every time.</h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-5">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col bg-paper p-6">
                <span className="font-mono text-sm text-lime-deep">{s.n}</span>
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── DELIVERABLES ─────────────────────────────────── */}
        <Section id="deliverables" index="05" label="Deliverables">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <h2 className="text-4xl sm:text-5xl">What you actually get.</h2>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d} className="flex items-center gap-3 border-b border-line pb-3 text-sm">
                  <span className="font-mono text-lime-deep">✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <Section id="faq" index="06" label="Good to know" tinted>
          <h2 className="text-4xl sm:text-5xl">Questions, answered.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <details key={f.q} className="card p-6">
                <summary className="cursor-pointer list-none font-display text-xl">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* ── CTA + LEAD FORM ──────────────────────────────── */}
        <section id="audit-cta" className="scroll-mt-20 bg-pine py-20 text-paper md:py-28">
          <Container className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <MonoLabel index="07">Get started</MonoLabel>
              <h2 className="mt-5 text-4xl text-paper sm:text-5xl">
                Book a free AI search audit.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                Tell us about your business and we&apos;ll show you how the answer
                engines see you today — and exactly what to fix. Free, no
                obligation.
              </p>
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
  tinted = false,
  children,
}: {
  id: string;
  index: string;
  label: string;
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-b border-line py-20 md:py-24 ${tinted ? "bg-paper-2" : ""}`}
    >
      <Container>
        <div className="mb-3">
          <MonoLabel index={index}>{label}</MonoLabel>
        </div>
        {children}
      </Container>
    </section>
  );
}
