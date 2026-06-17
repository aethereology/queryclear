"use client";

import { useState } from "react";
import { MonoLabel, Cta } from "@/components/ui";
import { SnapshotCta } from "@/components/SnapshotCta";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/lib/site";
import type { AuditReportData } from "@/lib/agent-runtime";

// Lowercase agent severities mapped to the site's chip palette (see AuditReport.tsx).
const SEV: Record<string, string> = {
  high: "border-amber-200 bg-amber-100 text-amber-900",
  medium: "border-line bg-paper-2 text-muted",
  low: "border-line bg-paper text-muted"
};

const CHIP = "inline-flex w-fit border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider";

function EstBadge() {
  return (
    <span
      className="inline-block border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted"
      title="Modeled estimate — a language model answering as this engine would, not a live query to the engine."
    >
      est.
    </span>
  );
}

export function AuditReportView({ report }: { report: AuditReportData }) {
  const invisible = report.queries.filter((q) => q.cited_count === 0).length;
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="card grid items-center gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <MonoLabel index="report">AI search readiness</MonoLabel>
          <h2 className="mt-3 text-2xl sm:text-3xl">{report.domain_url}</h2>
          <p className="mt-1.5 text-sm text-muted">{report.page_title || "(no page title found)"}</p>
        </div>
        <div className="flex gap-8">
          <Stat n={report.findings.length} label="Technical issues" />
          <Stat n={invisible} label="Invisible queries" />
        </div>
      </div>

      {report.detected_voice ? (
        <Reveal>
          <MonoLabel index="voice">Detected brand voice</MonoLabel>
          <blockquote className="card mt-3 p-6">
            <p className="font-display text-lg leading-relaxed text-ink">
              &ldquo;{report.detected_voice}&rdquo;
            </p>
            <p className="mt-2 text-xs text-muted">
              Inferred from your own site copy — the sample draft below is written in this voice.
            </p>
          </blockquote>
        </Reveal>
      ) : null}

      {report.recommendations.length > 0 ? (
        <section>
          <MonoLabel index="01">Prioritized recommendations</MonoLabel>
          <h3 className="mt-3 text-2xl sm:text-3xl">What to fix first.</h3>
          <Stagger className="mt-6 grid gap-3">
            {report.recommendations.map((r) => (
              <StaggerItem key={r.rank} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                <span className="font-display text-2xl leading-none text-lime-deep tnum">
                  {String(r.rank).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg">{r.title}</h4>
                    <span className={`${CHIP} border-line bg-paper-2 text-muted`}>{r.kind}</span>
                    {r.provenance === "estimated" ? <EstBadge /> : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{r.rationale}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink">Do: </span>
                    {r.action}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ) : null}

      <section>
        <MonoLabel index="02">Technical findings</MonoLabel>
        <h3 className="mt-3 text-2xl sm:text-3xl">On-page readiness.</h3>
        {report.findings.length === 0 ? (
          <p className="card mt-6 p-6 text-sm text-muted">
            No on-page issues found in the checks we run.
          </p>
        ) : (
          <Stagger className="mt-6 grid gap-3">
            {report.findings.map((f, i) => (
              <StaggerItem key={`${f.code}-${i}`} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                <span className={`${CHIP} ${SEV[f.severity] ?? SEV.low}`}>{f.severity}</span>
                <div>
                  <h4 className="text-lg">{f.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.detail}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink">Fix: </span>
                    {f.recommendation}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <section>
        <MonoLabel index="03">AI visibility</MonoLabel>
        <h3 className="mt-3 text-2xl sm:text-3xl">
          {report.queries.length} queries the answer engines were asked.
        </h3>
        {report.queries.some((q) => !q.measured) ? (
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
            Results marked <EstBadge /> are modeled estimates — a language model answering as that
            engine would, sampled repeatedly — not a live query to the engine itself. They show where
            you&apos;re likely invisible, not a measured citation rate. Direct per-engine measurement
            rolls out as each engine&apos;s API is connected.
          </p>
        ) : null}
        <div className="mt-6 overflow-hidden border border-dashed border-line">
          {report.queries.map((q, i) => {
            const notCited = q.cited_count === 0;
            return (
              <div
                key={`${q.engine}-${q.query}`}
                className={`flex items-center justify-between gap-3 p-5 ${i % 2 ? "bg-paper-2" : "bg-paper"}`}
              >
                <span className="min-w-0 text-sm text-ink">
                  <span className="mr-2 inline-flex items-center gap-1 border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                    {q.engine.replaceAll("_", " ")}
                    {!q.measured ? <EstBadge /> : null}
                  </span>
                  {q.query}
                </span>
                <span
                  className={`${CHIP} tnum ${notCited ? "border-red-200 bg-red-100 text-red-800" : "border-pine/20 bg-pine/5 text-pine"}`}
                  title={`95% confidence: ${(q.confidence_low * 100).toFixed(0)}%–${(q.confidence_high * 100).toFixed(0)}%`}
                >
                  {notCited ? "not cited" : `cited ${q.cited_count}/${q.samples}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {report.sample_draft ? (
        <section>
          <MonoLabel index="04">Sample fix</MonoLabel>
          <h3 className="mt-3 text-2xl sm:text-3xl">A ready-to-review draft.</h3>
          <p className="mt-2 text-sm text-muted">{report.sample_draft.title}</p>
          <Draft body={report.sample_draft.body} />
        </section>
      ) : null}

      <OffersCta />
    </div>
  );
}

// Conversion block shown at the bottom of the unlocked report. The free audit
// above is honest about being read-only/estimated; these are the paid next
// steps. Mirrors the homepage offer-ladder logic: `need === null` navigates
// (the $497 audit), otherwise the inquiry overlay opens in place (Upgrade/Build).
function OffersCta() {
  const offers = site.offers.slice(1); // drop the free audit itself
  return (
    <section className="card bg-pine p-7 text-paper sm:p-9">
      <MonoLabel index="05">Fix what we found</MonoLabel>
      <h3 className="mt-3 text-2xl text-paper sm:text-3xl">Ready to close the gaps?</h3>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/70">
        This free audit is an instant, read-only read. When you want it fixed —
        with full prompt testing, scoring, and done-for-you work — here&apos;s where to go.
      </p>
      <Stagger className="mt-7 grid gap-4 sm:grid-cols-3">
        {offers.map((o) => (
          <StaggerItem key={o.name} className="flex flex-col border border-paper/15 bg-pine-2/40 p-5">
            <p className="mono-label !text-lime">{o.price}</p>
            <h4 className="mt-2 text-lg text-paper">{o.name}</h4>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-paper/65">{o.desc}</p>
            <div className="mt-4">
              {o.need === null ? (
                <Cta href={o.href} className="w-full">
                  {o.cta}
                </Cta>
              ) : (
                <SnapshotCta href={site.inquiryAnchor} defaultNeed={o.need} className="w-full">
                  {o.cta}
                </SnapshotCta>
              )}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl leading-none text-lime-deep tnum">{n}</div>
      <div className="mono-label mt-1.5">{label}</div>
    </div>
  );
}

function Draft({ body }: { body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mono-label text-lime-deep underline print-hide"
      >
        {open ? "Hide draft" : "Show draft"}
      </button>
      {open ? <pre className="machine-panel mt-3 max-h-96 whitespace-pre-wrap">{body}</pre> : null}
    </div>
  );
}
