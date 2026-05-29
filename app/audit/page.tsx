import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sample AI Search Audit",
  description:
    "A sample GEO / AI search audit showing how we score a site's readiness for AI answer engines and what we'd fix. Built on a fictional demo business.",
  alternates: { canonical: "/audit" },
};

const visibilityTests = [
  { prompt: "Who are the best emergency plumbers in Riverton?", result: "Not surfaced", note: "Three competitors named; Brightleaf absent." },
  { prompt: "I need a water heater repaired in Riverton — who should I call?", result: "Not surfaced", note: "Generic directory results returned." },
  { prompt: "Tell me about Brightleaf Plumbing Co.", result: "Vague / wrong", note: "AI invents details; can't confirm services or area." },
  { prompt: "Does Brightleaf offer 24/7 emergency service?", result: "Unknown", note: "No machine-readable hours/service data to cite." },
];

const findings = [
  { sev: "Critical", t: "No structured data (schema)", why: "AI engines have nothing reliable to read — no LocalBusiness, Service, or FAQ markup.", fix: "Add JSON-LD for LocalBusiness, Service, and FAQPage using real, verified details.", effort: "Medium" },
  { sev: "Critical", t: "No llms.txt", why: "No machine-readable summary of who you are, what you offer, and where.", fix: "Publish an llms.txt with services, service area, and key pages.", effort: "Low" },
  { sev: "High", t: "Vague service pages", why: "Pages don't state plainly what you do, for whom, and where — so AI can't connect you to queries.", fix: "Rewrite service pages with clear entities: service + city + audience.", effort: "Medium" },
  { sev: "High", t: "No FAQ content", why: "Answer engines pull from clear Q&A; there's none to cite.", fix: "Add an FAQ section with FAQPage schema.", effort: "Low" },
  { sev: "Medium", t: "Thin metadata", why: "Weak titles/descriptions and no Open Graph reduce clarity and shareability.", fix: "Write specific title tags, meta descriptions, and OG tags per page.", effort: "Low" },
  { sev: "Medium", t: "Crawl gaps", why: "No sitemap and unclear robots rules slow indexing.", fix: "Add sitemap.xml + robots.txt and set up Search Console.", effort: "Low" },
];

const sevColor: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-amber-100 text-amber-900 border-amber-200",
  Medium: "bg-paper-2 text-muted border-line",
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
        <span className="font-display text-3xl leading-none">{score}</span>
        <span className="mono-label !text-[0.6rem]">/ 100</span>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <>
      <Header />
      <main>
        {/* DEMO banner */}
        <div className="border-b border-line bg-pine px-6 py-2.5 text-center text-xs text-paper/80">
          <span className="font-mono uppercase tracking-wider text-lime">Sample / demo</span>{" "}
          — built on a fictional business (Brightleaf Plumbing Co.) to show the format. Not a real client.
        </div>

        {/* Header block */}
        <section className="border-b border-line">
          <Container className="grid items-center gap-10 py-16 md:grid-cols-[1fr_auto]">
            <div>
              <MonoLabel index="audit">AI search readiness report</MonoLabel>
              <h1 className="mt-5 text-4xl sm:text-5xl">Brightleaf Plumbing Co.</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">
                Residential &amp; emergency plumbing · Riverton metro. Here&apos;s
                how AI answer engines see this business today — and what we&apos;d
                fix to make it clear, structured, and citable.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <ScoreRing score={34} />
              <div className="text-sm">
                <p className="font-medium">Current readiness</p>
                <p className="text-muted">Estimated after fixes: <span className="font-medium text-ink">82</span></p>
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
              We ask the questions a real customer would, across the major answer
              engines, and record whether the business surfaces.
            </p>
            <div className="mt-8 overflow-hidden rounded-card border border-line">
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

        {/* Findings */}
        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">Findings &amp; fixes</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">Prioritized, biggest impact first.</h2>
            <div className="mt-8 grid gap-4">
              {findings.map((f) => (
                <div key={f.t} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                  <span className={`inline-flex h-fit w-fit rounded-full border px-3 py-1 text-xs font-medium ${sevColor[f.sev]}`}>
                    {f.sev}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-xl">{f.t}</h3>
                      <span className="mono-label">Effort: {f.effort}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Why it matters: </span>{f.why}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Fix: </span>{f.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* before / after machine view */}
        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">Before → after</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">What the machine reads.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mono-label mb-2">Before — nothing to cite</p>
                <div className="machine-panel !text-paper/50">
                  <div># llms.txt → 404</div>
                  <div># schema → none</div>
                  <div># services → unclear</div>
                  <div className="mt-2 text-red-300">✗ AI can&apos;t confidently describe you</div>
                </div>
              </div>
              <div>
                <p className="mono-label mb-2">After — clear &amp; structured</p>
                <div className="machine-panel">
                  <div><span className="k">Business</span>: <span className="s">Brightleaf Plumbing Co.</span></div>
                  <div><span className="k">Serves</span>: <span className="s">Riverton metro · 24/7</span></div>
                  <div><span className="k">Offers</span>: <span className="s">drains, water heaters, leaks</span></div>
                  <div><span className="k">@type</span>: <span className="s">LocalBusiness</span></div>
                  <div className="mt-2 text-lime">✓ clear · structured · citable</div>
                </div>
              </div>
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
                verified details — and show you exactly what to fix.
              </p>
            </div>
            <Cta href={`/#${site.primaryCta.href.replace("#", "")}`}>Book a free AI search audit</Cta>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
