import { Container, MonoLabel, Cta } from "@/components/ui";
import { SnapshotCta } from "@/components/SnapshotCta";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { CountUp } from "@/components/CountUp";
import {
  layerMeta,
  scoreFromLayers,
  sortedFixes,
  type AuditReport as AuditReportData,
  type Severity,
} from "@/lib/audit-report";

const sevColor: Record<Severity, string> = {
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
        className="h-2 flex-1 overflow-hidden border border-line bg-paper-2"
        role="img"
        aria-label={`Layer score ${score} out of 10`}
      >
        <div className="h-full bg-lime" style={{ width: `${score * 10}%` }} />
      </div>
      <span className="mono-label tnum w-11 shrink-0 text-right">{score}/10</span>
    </div>
  );
}

/**
 * The full AI-search readiness report body (renders its own <main>). Driven
 * entirely by `data`; pages own Header/Footer + JSON-LD. Used by the public
 * sample (/audit) and private client reports (/reports/[slug]).
 */
export function AuditReport({ data }: { data: AuditReportData }) {
  const variant = data.variant ?? "client";
  const scoreNow = scoreFromLayers(data.scorecard);
  const fixes = sortedFixes(data.fixes);

  return (
    <main>
      {/* DEMO banner — only for clearly-fictional examples */}
      {data.demo && (
        <div className="border-b border-line bg-pine px-6 py-2.5 text-center text-xs text-paper/80">
          <span className="font-mono uppercase tracking-wider text-lime">Sample / demo</span>{" "}
          — built on a fictional business ({data.business}) to show the format. Not a real client.
        </div>
      )}

      {/* Header block */}
      <section className="border-b border-line">
        <Container className="grid items-center gap-10 py-16 md:grid-cols-[1fr_auto]">
          <div>
            <MonoLabel index="audit">Modern search readiness report</MonoLabel>
            <h1 className="mt-5 text-4xl sm:text-5xl">{data.business}</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              {data.sector ? `${data.sector} · ` : ""}{data.market} metro. Here&apos;s how this
              business performs across modern search foundations — crawlability,
              service clarity, local relevance, useful content, metadata, schema,
              and AI-search readiness — scored against our seven-layer{" "}
              <a href="/ai-visibility-stack" className="font-medium text-ink underline hover:text-lime-deep">
                AI Visibility Stack
              </a>
              .
            </p>
            {data.preparedOn && (
              <p className="mono-label mt-4">Prepared {data.preparedOn}</p>
            )}
          </div>
          <div className="flex items-center gap-5">
            <ScoreRing score={scoreNow} />
            <div className="text-sm">
              <p className="font-medium">Current readiness</p>
              <p className="text-muted">
                Estimated after fixes:{" "}
                <span className="font-medium text-ink"><CountUp to={data.scoreAfter} /></span>
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
          <div className="mt-8 overflow-hidden border border-dashed border-line">
            <div className="hidden gap-2 border-b border-line bg-paper-2 p-5 sm:grid sm:grid-cols-[1.4fr_0.6fr_1fr]">
              <span className="mono-label">Prompt</span>
              <span className="mono-label">Surfaced?</span>
              <span className="mono-label">What happened</span>
            </div>
            {data.visibilityTests.map((v, i) => (
              <div
                key={v.prompt}
                className={`grid gap-2 p-5 sm:grid-cols-[1.4fr_0.6fr_1fr] sm:items-center ${i % 2 ? "bg-paper-2" : "bg-paper"}`}
              >
                <p className="font-mono text-sm">&ldquo;{v.prompt}&rdquo;</p>
                <span className="inline-flex w-fit border border-red-200 bg-red-100 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-red-800">
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
            {data.scorecard.map((s) => {
              const meta = layerMeta(s.layer);
              return (
                <StaggerItem key={s.layer} className="card grid gap-3 p-6 md:grid-cols-[1fr_minmax(180px,260px)] md:items-center md:gap-8">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-2xl text-lime-deep">{meta.n}</span>
                      <h3 className="text-lg">{meta.name}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.finding}</p>
                  </div>
                  <LayerBar score={s.score} />
                </StaggerItem>
              );
            })}
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
            {fixes.map((f) => (
              <StaggerItem key={f.title} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                <span className={`inline-flex h-fit w-fit border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider ${sevColor[f.sev]}`}>
                  {f.sev}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xl">{f.title}</h3>
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
                {data.machineView.before.map((line) => (
                  <div key={line}>{line}</div>
                ))}
                <div className="mt-2 text-red-300">✗ {data.machineView.beforeNote}</div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mono-label mb-2">After — clear &amp; structured</p>
              <div className="machine-panel">
                {data.machineView.after.map((row) => (
                  <div key={row.k}><span className="k">{row.k}</span>: <span className="s">{row.v}</span></div>
                ))}
                <div className="mt-2 text-lime">✓ {data.machineView.afterNote}</div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CTA — varies by audience */}
      <section className="print-hide bg-pine py-20 text-paper">
        {variant === "sample" ? (
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Want this for your website?</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Start with a free AI Search Snapshot. If your site needs deeper
                work, we&apos;ll recommend the paid AI Search Audit — a real
                scored report like this one, built on your verified details and
                scored against the{" "}
                <a href="/ai-visibility-stack" className="font-medium text-paper underline hover:text-lime">
                  AI Visibility Stack
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SnapshotCta href="/ai-visibility-audit#audit-cta">Request your free Snapshot</SnapshotCta>
              <Cta href="/scorecard" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                Score your own site
              </Cta>
              <Cta href="/ai-visibility-stack" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                See our method
              </Cta>
            </div>
          </Container>
        ) : (
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">Ready to put these fixes in place?</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                These are your prioritized next steps — biggest impact first. We can
                implement them with you, or hand your team a clear build plan. Either
                way, we work only from your real, verified details.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/contact">Talk through the fixes</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                See our method
              </Cta>
            </div>
          </Container>
        )}
      </section>
    </main>
  );
}
