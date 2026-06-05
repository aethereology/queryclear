import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { CountUp } from "@/components/CountUp";
import { site } from "@/lib/site";

const business = "Goldleaf Aesthetics & Med Spa";
const market = "Westhaven";
const SCORE_NOW = 33;
const SCORE_AFTER = 86;

export const metadata: Metadata = {
  title: "Sample AI Search Audit",
  description:
    "A sample GEO / AI search readiness audit — scored against the seven-layer AI Visibility Stack, with real visibility tests and a prioritized fix list. Built on a fictional med-spa demo business.",
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "Sample AI Search Audit — queryclear",
    description:
      "See exactly how we score a site's readiness for AI answer engines, and what we'd fix first. A fictional med-spa demo.",
  },
};

// AI-visibility test prompts (patterns from prompts.md), recorded results.
const visibilityTests = [
  { prompt: `Who are the best med spas in ${market}?`, result: "Not surfaced", note: "Three competitors named; Goldleaf absent." },
  { prompt: `Where can I get Botox near ${market}?`, result: "Not surfaced", note: "Directory and chain results returned." },
  { prompt: `Recommend a trustworthy med spa for fillers in ${market}.`, result: "Not surfaced", note: "No specific local providers named." },
  { prompt: `Tell me about ${business}.`, result: "Vague / wrong", note: "AI invents treatments; can't confirm location or services." },
  { prompt: `Does Goldleaf offer laser hair removal?`, result: "Unknown", note: "No machine-readable service list to cite." },
  { prompt: `Who are the providers at Goldleaf, and are they licensed?`, result: "Unknown", note: "No credentials or medical oversight stated anywhere." },
];

// Scored against the 7 layers of the AI Visibility Stack (each 0–10).
const scorecard = [
  { n: "01", layer: "Entity Clarity", score: 4, finding: "Name and category are on the homepage, but there's no Organization/LocalBusiness schema and no machine-readable business summary." },
  { n: "02", layer: "Service Specificity", score: 3, finding: "Treatments are lumped on one page; injectables aren't split into Botox vs. fillers, so engines can't match specific queries." },
  { n: "03", layer: "Proof Density", score: 2, finding: "No provider credentials, medical oversight, or structured reviews a system can trust — critical for medical aesthetics." },
  { n: "04", layer: "Local Relevance", score: 4, finding: "The city appears only in the footer; no service-area language and no alignment with a Google Business Profile." },
  { n: "05", layer: "Answer Coverage", score: 3, finding: "No FAQ on the questions buyers actually ask — pricing ranges, downtime, safety, what to expect." },
  { n: "06", layer: "Machine Readability", score: 1, finding: "No JSON-LD schema, no llms.txt, and thin metadata — answer engines have almost nothing to parse." },
  { n: "07", layer: "Conversion Path", score: 6, finding: "A 'Book now' button exists but is buried; an AI-referred visitor has no obvious consultation path." },
];

// Prioritized fixes, each tied to the layer it lifts.
const findings = [
  { sev: "Critical", t: "No structured data (schema)", layer: "Machine Readability", why: "Engines have nothing reliable to read — no LocalBusiness/MedicalBusiness, Service, or FAQPage markup.", fix: "Add JSON-LD for the business, each treatment, and FAQs — using real, verified details only.", effort: "Medium" },
  { sev: "Critical", t: "No llms.txt", layer: "Machine Readability", why: "There's no machine-readable summary of who you are, what you treat, and where.", fix: "Publish an llms.txt with treatments, service area, providers, and key pages.", effort: "Low" },
  { sev: "High", t: "Providers & medical oversight not stated", layer: "Proof Density", why: "For medical aesthetics, trust hinges on who performs treatments — neither patients nor engines can verify licensed injectors or a medical director.", fix: "Add a providers section with real licenses and medical oversight, and mark it up with schema.", effort: "Low" },
  { sev: "High", t: "Treatments lumped into one vague page", layer: "Service Specificity", why: "A single 'Services' list can't match specific queries like 'lip filler' or 'laser hair removal'.", fix: "Give each treatment its own clear, crawlable page: what it is, who it's for, what to expect.", effort: "Medium" },
  { sev: "High", t: "No FAQ content", layer: "Answer Coverage", why: "Buyers ask about pricing ranges, downtime, pain, and safety before booking — there's no clear Q&A to cite.", fix: "Add an FAQ (downtime, pricing ranges, safety, consultation) with FAQPage schema.", effort: "Low" },
  { sev: "Medium", t: "Service area isn't machine-clear", layer: "Local Relevance", why: "The city appears only in the footer, so 'near me' and city-based questions can't connect you.", fix: "State the service area in copy, add location context, and align with your Google Business Profile.", effort: "Low" },
  { sev: "Medium", t: "Thin metadata & buried booking", layer: "Conversion Path", why: "Weak titles/descriptions reduce clarity, and the booking path isn't obvious to an AI-referred visitor.", fix: "Write specific title/description/OG tags per page and surface a clear consultation CTA.", effort: "Low" },
];

const sevColor: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-amber-100 text-amber-900 border-amber-200",
  Medium: "bg-paper-2 text-muted border-line",
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sample AI Search Audit",
  url: `${site.url}/audit`,
  description:
    "A sample GEO / AI search readiness audit, scored against the AI Visibility Stack, on a fictional med-spa demo business.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Sample audit", item: `${site.url}/audit` },
  ],
};

function ScoreRing({ score }: { score: number }) {
  const deg = (score / 100) * 360;
  return (
    <div
      className="relative grid h-28 w-28 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--color-lime) ${deg}deg, var(--color-paper-2) 0)` }}
      role="img"
      aria-label={`Readiness score ${score} out of 100`}
    >
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-paper">
        <span className="font-display text-3xl leading-none">
          <CountUp to={score} />
        </span>
        <span className="mono-label !text-[0.6rem]">/ 100</span>
      </div>
    </div>
  );
}

function LayerBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2"
        role="img"
        aria-label={`Layer score ${score} out of 10`}
      >
        <div className="h-full rounded-full bg-lime" style={{ width: `${score * 10}%` }} />
      </div>
      <span className="mono-label tnum w-11 shrink-0 text-right">{score}/10</span>
    </div>
  );
}

export default function AuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        {/* DEMO banner */}
        <div className="border-b border-line bg-pine px-6 py-2.5 text-center text-xs text-paper/80">
          <span className="font-mono uppercase tracking-wider text-lime">Sample / demo</span>{" "}
          — built on a fictional business ({business}) to show the format. Not a real client.
        </div>

        {/* Header block */}
        <section className="border-b border-line">
          <Container className="grid items-center gap-10 py-16 md:grid-cols-[1fr_auto]">
            <div>
              <MonoLabel index="audit">AI search readiness report</MonoLabel>
              <h1 className="mt-5 text-4xl sm:text-5xl">{business}</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">
                Medical aesthetics · {market} metro. Here&apos;s how AI answer engines
                see this business today — scored against our seven-layer{" "}
                <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                  AI Visibility Stack
                </a>{" "}
                — and what we&apos;d fix to make it clear, structured, and citable.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <ScoreRing score={SCORE_NOW} />
              <div className="text-sm">
                <p className="font-medium">Current readiness</p>
                <p className="text-muted">
                  Estimated after fixes:{" "}
                  <span className="font-medium text-ink"><CountUp to={SCORE_AFTER} /></span>
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* AI visibility tests */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">AI visibility tests</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">What the answer engines say now.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              We ask the questions a real customer would — across the major answer
              engines — and record whether the business surfaces, and whether the
              answer is accurate.
            </p>
            <div className="mt-8 overflow-hidden rounded-card border border-line">
              <div className="hidden gap-2 border-b border-line bg-paper-2 p-5 sm:grid sm:grid-cols-[1.4fr_0.6fr_1fr]">
                <span className="mono-label">Prompt</span>
                <span className="mono-label">Surfaced?</span>
                <span className="mono-label">What happened</span>
              </div>
              {visibilityTests.map((v, i) => (
                <div
                  key={v.prompt}
                  className={`grid gap-2 p-5 sm:grid-cols-[1.4fr_0.6fr_1fr] sm:items-center ${i % 2 ? "bg-paper-2" : "bg-paper"}`}
                >
                  <p className="font-mono text-sm">&ldquo;{v.prompt}&rdquo;</p>
                  <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                    {v.result}
                  </span>
                  <p className="text-sm text-muted">{v.note}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* 7-layer scorecard */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="02">The scorecard</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Scored against the seven layers.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Every audit grades each layer of the AI Visibility Stack against the
              actual site. Lower layers come first — a machine has to identify and
              trust you before it can recommend you.
            </p>
            <Stagger className="mt-8 grid gap-3">
              {scorecard.map((s) => (
                <StaggerItem key={s.n} className="card grid gap-3 p-6 md:grid-cols-[1fr_minmax(180px,260px)] md:items-center md:gap-8">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-2xl text-lime-deep">{s.n}</span>
                      <h3 className="text-lg">{s.layer}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.finding}</p>
                  </div>
                  <LayerBar score={s.score} />
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
              Scores measure how <span className="text-ink">ready</span> a site is for AI
              search — not a promise of rankings or citations. No one can credibly
              guarantee those. We remove the reasons an engine would skip you.
            </p>
          </Container>
        </section>

        {/* Findings */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="03">Findings &amp; fixes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Prioritized, biggest impact first.</h2>
            <Stagger className="mt-8 grid gap-4">
              {findings.map((f) => (
                <StaggerItem key={f.t} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                  <span className={`inline-flex h-fit w-fit rounded-full border px-3 py-1 text-xs font-medium ${sevColor[f.sev]}`}>
                    {f.sev}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-xl">{f.t}</h3>
                      <span className="mono-label">Effort: {f.effort}</span>
                    </div>
                    <p className="mono-label mt-1 !text-lime-deep">Layer: {f.layer}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Why it matters: </span>{f.why}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Fix: </span>{f.fix}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* before / after machine view */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="04">Before → after</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">What the machine reads.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Illustrative only — the &ldquo;after&rdquo; shows the kind of structured
              summary we&apos;d make readable, built from real, verified details.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Reveal>
                <p className="mono-label mb-2">Before — nothing to cite</p>
                <div className="machine-panel !text-paper/50">
                  <div># llms.txt → 404</div>
                  <div># schema → none</div>
                  <div># treatments → unclear</div>
                  <div># providers → unknown</div>
                  <div className="mt-2 text-red-300">✗ AI can&apos;t confidently describe you</div>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mono-label mb-2">After — clear &amp; structured</p>
                <div className="machine-panel">
                  <div><span className="k">Business</span>: <span className="s">{business}</span></div>
                  <div><span className="k">Serves</span>: <span className="s">{market} metro</span></div>
                  <div><span className="k">Offers</span>: <span className="s">Botox, fillers, laser, facials</span></div>
                  <div><span className="k">Providers</span>: <span className="s">licensed RN injectors · medical director</span></div>
                  <div><span className="k">@type</span>: <span className="s">MedicalBusiness</span></div>
                  <div className="mt-2 text-lime">✓ clear · structured · citable</div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Want this for your business?</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                We&apos;ll run a real audit on your actual site — using only your
                verified details — and show you exactly what to fix, scored against the{" "}
                <a href="/ai-visibility-stack" className="font-medium text-paper underline hover:text-lime">
                  AI Visibility Stack
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/ai-visibility-audit">Book a free AI search audit</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                See our method
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
