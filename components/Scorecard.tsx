"use client";

import { useMemo, useRef, useState } from "react";
import { CountUp } from "@/components/CountUp";
import {
  ANSWER_LABELS,
  TOTAL_QUESTIONS,
  answeredCount,
  band,
  layers,
  questions,
  scoreAllLayers,
  scoreSummary,
  scoreTotal,
  weakestLayers,
  type Answer,
  type Answers,
  type LayerId,
  type LayerScore,
} from "@/lib/scorecard";

const ANSWER_OPTIONS: Array<{ value: Answer; detail: string }> = [
  { value: "yes", detail: "Visible on the site" },
  { value: "partial", detail: "Needs verification" },
  { value: "no", detail: "Missing or unclear" },
];

const LAYER_FIXES: Record<LayerId, readonly string[]> = {
  "entity-clarity": [
    "Put business name, category, location, and service area in crawlable homepage text.",
    "Add or tighten an About page with the real people, credentials, and contact details behind the business.",
    "Align name, category, phone, and address across the site and Google Business Profile.",
  ],
  "service-specificity": [
    "Give each core service its own crawlable page with the service name in the title and main heading.",
    "Explain who the service is for, what happens, what it costs or affects, and the area served.",
    "Link related services together so machines can understand the service map.",
  ],
  "proof-density": [
    "Move reviews, credentials, before/after examples, licenses, and named staff proof onto the site.",
    "Tie proof to specific services instead of leaving it as generic brand claims.",
    "Replace vague trust language with verifiable details a person could check.",
  ],
  "local-relevance": [
    "State the real service area in page copy, not only in footer text or metadata.",
    "Make sure the Google Business Profile matches the website exactly.",
    "Build genuine area pages only where there is useful, non-duplicated local context.",
  ],
  "answer-coverage": [
    "Answer buyer questions directly: pricing ranges, timing, process, safety, comparisons, and fit.",
    "Turn common questions into plain-language FAQ blocks with one question per heading.",
    "Add decision-making details before the contact form, not after a sales call.",
  ],
  "machine-readability": [
    "Add valid JSON-LD schema for the business, services, location, and breadcrumbs.",
    "Check unique titles, meta descriptions, sitemap.xml, robots.txt, headings, and crawlability.",
    "Create a concise machine-readable business summary, optionally supported by llms.txt.",
  ],
  "conversion-path": [
    "Make the primary next step visible on every key page without hunting.",
    "Keep the mobile form short, labeled, and easy to complete.",
    "Make phone, booking, and contact routes consistent across the site.",
  ],
};

type LeadStatus = "idle" | "submitting" | "success" | "error";
type CopyStatus = "idle" | "success" | "error";

const primaryButton =
  "btn-hex group inline-flex items-center justify-center gap-2 border border-lime bg-lime px-5 py-3 font-mono text-xs font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime disabled:opacity-60";
const secondaryButton =
  "btn-hex inline-flex items-center justify-center gap-2 border border-line bg-transparent px-5 py-3 font-mono text-xs font-medium uppercase tracking-wider text-ink hover:border-lime hover:bg-lime hover:text-pine-2 active:border-lime active:bg-lime active:text-pine-2 focus-visible:border-lime focus-visible:bg-lime focus-visible:text-pine-2 disabled:opacity-45";

function answerBreakdown(answers: Answers): Record<Answer, number> {
  return questions.reduce(
    (acc, q) => {
      const answer = answers[q.id];
      if (answer) acc[answer] += 1;
      return acc;
    },
    { yes: 0, partial: 0, no: 0 } as Record<Answer, number>,
  );
}

function layerStatus(score: LayerScore) {
  if (score.answered === 0) {
    return {
      label: "Not started",
      className: "border-line bg-paper-2 text-muted",
      dotClassName: "bg-muted/50",
    };
  }
  if (score.answered < score.total) {
    return {
      label: `${score.answered}/${score.total} answered`,
      className: "border-line bg-paper-2 text-muted",
      dotClassName: "bg-lime-deep",
    };
  }
  if (score.percent >= 80) {
    return {
      label: "Strong",
      className: "border-lime-deep bg-lime text-pine-2",
      dotClassName: "bg-pine-2",
    };
  }
  if (score.percent >= 50) {
    return {
      label: "Needs tightening",
      className: "border-line bg-paper-2 text-ink",
      dotClassName: "bg-lime-deep",
    };
  }
  if (score.percent > 0) {
    return {
      label: "Thin",
      className: "border-amber-200 bg-amber-100 text-amber-900",
      dotClassName: "bg-amber-600",
    };
  }
  return {
    label: "Missing",
    className: "border-red-200 bg-red-100 text-red-800",
    dotClassName: "bg-red-700",
  };
}

function ScoreRing({
  score,
  size = "md",
  label = "AI-visibility readiness score",
}: {
  score: number;
  size?: "md" | "lg";
  label?: string;
}) {
  const deg = (score / 100) * 360;
  const outer = size === "lg" ? "h-40 w-40" : "h-32 w-32";
  const inner = size === "lg" ? "h-[128px] w-[128px]" : "h-[104px] w-[104px]";
  const scoreText = size === "lg" ? "text-5xl" : "text-4xl";

  return (
    <div
      className={`relative grid ${outer} shrink-0 place-items-center rounded-full`}
      style={{ background: `conic-gradient(var(--color-lime) ${deg}deg, var(--color-paper-2) 0)` }}
      role="img"
      aria-label={`${label} ${score} out of 100`}
    >
      <div className={`grid ${inner} place-items-center rounded-full bg-paper shadow-[inset_0_0_0_1px_var(--color-line)]`}>
        <span className={`font-display ${scoreText} leading-none`}>
          <CountUp to={score} />
        </span>
        <span className="mono-label !text-[0.6rem]">/ 100</span>
      </div>
    </div>
  );
}

function ProgressMeter({
  value,
  label,
  tone = "lime",
}: {
  value: number;
  label: string;
  tone?: "lime" | "pine";
}) {
  return (
    <div
      className="h-2 w-full overflow-hidden border border-line bg-paper-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full ${tone === "lime" ? "bg-lime" : "bg-pine"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function LayerBar({ percent, label }: { percent: number; label: string }) {
  return <ProgressMeter value={percent} label={label} />;
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border border-dashed border-line bg-paper px-4 py-3">
      <p className="mono-label !text-[0.62rem]">{label}</p>
      <p className="tnum mt-1 font-display text-2xl leading-none">{value}</p>
      {note && <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>}
    </div>
  );
}

function jumpToElement(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  const input = el.querySelector<HTMLInputElement>("input[type='radio']");
  input?.focus({ preventScroll: true });
}

export function Scorecard() {
  const [answers, setAnswers] = useState<Answers>({});
  const [revealed, setRevealed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resultRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<LeadStatus>("idle");
  const [error, setError] = useState("");

  const layerScores = useMemo(() => scoreAllLayers(answers), [answers]);
  const scoreByLayer = useMemo(
    () => new Map(layerScores.map((score) => [score.layer.id, score])),
    [layerScores],
  );
  const answered = answeredCount(answers);
  const complete = answered === TOTAL_QUESTIONS;
  const completion = Math.round((answered / TOTAL_QUESTIONS) * 100);
  const unanswered = TOTAL_QUESTIONS - answered;
  const total = scoreTotal(answers);
  const weakest = weakestLayers(answers, complete ? 3 : 2);
  const hasPriorityGaps = weakest.some((s) => s.percent < 80);
  const b = band(total);
  const breakdown = answerBreakdown(answers);

  function setAnswer(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setCopyStatus("idle");
  }

  function reviewMissing() {
    const missing = questions.find((q) => !answers[q.id]);
    if (missing) jumpToElement(`question-${missing.id}`);
  }

  function reset() {
    setAnswers({});
    setRevealed(false);
    setCopyStatus("idle");
    requestAnimationFrame(() => jumpToElement("scorecard-console"));
  }

  function reveal() {
    setRevealed(true);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function copySummaryText() {
    const priorityLabel = hasPriorityGaps ? "First fixes" : "First verification checks";
    const priorityFixes = weakest
      .map((s) => {
        const fixes = LAYER_FIXES[s.layer.id].slice(0, 2).join("; ");
        return `- ${s.layer.name}: ${fixes}`;
      })
      .join("\n");
    const text = `${scoreSummary(answers)}\n\n${priorityLabel}:\n${priorityFixes}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  async function onLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(e.currentTarget);
    const note = String(form.get("message") ?? "").trim();
    const data = {
      name: form.get("name"),
      email: form.get("email"),
      website: form.get("website"),
      business: form.get("business"),
      service: form.get("service"),
      city: form.get("city"),
      company: form.get("company"), // honeypot
      message: note ? `${scoreSummary(answers)}\n\nNote from visitor: ${note}` : scoreSummary(answers),
    };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div id="scorecard-console" className="grid gap-8 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <section className="border border-dashed border-line bg-paper p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
            <ScoreRing score={total} size="lg" label={complete ? "Final self-assessed readiness score" : "Draft self-assessed readiness score"} />
            <div className="min-w-0 flex-1">
              <p className="mono-label text-lime-deep">[ live readout ]</p>
              <h2 className="mt-2 text-2xl">{complete ? "Final self-score" : "Draft self-score"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {complete
                  ? "All questions are answered. Use the report below as your working priority list."
                  : "Missing answers count as zero for now, so this tightens as you finish the rubric."}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="mono-label">Completion</span>
              <span className="mono-label tnum">{answered}/{TOTAL_QUESTIONS}</span>
            </div>
            <ProgressMeter value={completion} label={`${completion}% of the scorecard answered`} tone="pine" />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {complete ? (
                "Ready to compare against a live-site audit."
              ) : (
                <>
                  <span className="tnum font-mono text-ink">{unanswered}</span> unanswered{" "}
                  {unanswered === 1 ? "question" : "questions"} left.
                </>
              )}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric label="Yes" value={String(breakdown.yes)} />
            <Metric label="Not sure" value={String(breakdown.partial)} />
            <Metric label="No" value={String(breakdown.no)} />
          </div>

          <nav aria-label="Scorecard layers" className="mt-6 grid gap-2">
            {layerScores.map((score) => {
              const statusInfo = layerStatus(score);
              return (
                <button
                  key={score.layer.id}
                  type="button"
                  onClick={() => jumpToElement(`layer-${score.layer.id}`)}
                  className="group grid gap-2 border border-dashed border-line bg-paper px-3 py-3 text-left transition-colors hover:border-lime hover:bg-lime/20 focus-visible:border-lime"
                >
                  <span className="grid gap-1.5">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="font-display text-lg text-lime-deep">{score.layer.n}</span>
                      <span className="text-sm font-medium leading-tight">{score.layer.name}</span>
                    </span>
                    <span className={`inline-flex w-fit items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider ${statusInfo.className}`}>
                      <span className={`h-1.5 w-1.5 ${statusInfo.dotClassName}`} aria-hidden="true" />
                      {statusInfo.label}
                    </span>
                  </span>
                  <LayerBar percent={score.percent} label={`${score.layer.name} score ${score.percent}%`} />
                </button>
              );
            })}
          </nav>
        </section>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-16 z-20 border-y border-dashed border-line bg-paper/95 px-4 py-3 backdrop-blur sm:border sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono-label">Assessment progress</p>
              <p className="mt-1 text-sm text-muted" aria-live="polite">
                <span className="tnum font-mono text-ink">{answered}</span> of{" "}
                <span className="tnum font-mono text-ink">{TOTAL_QUESTIONS}</span> answered
                {!complete && revealed && " — finish the missing items for the cleanest score."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reviewMissing}
                disabled={complete}
                className={secondaryButton}
              >
                Review missing
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={answered === 0}
                className={secondaryButton}
              >
                Reset
              </button>
              <button type="button" onClick={reveal} className={primaryButton}>
                {revealed ? "Update report" : complete ? "Build report" : "Show draft report"}
                <span aria-hidden="true" className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {layers.map((layer) => {
            const layerQuestions = questions.filter((q) => q.layer === layer.id);
            const score = scoreByLayer.get(layer.id);
            if (!score) return null;
            const statusInfo = layerStatus(score);

            return (
              <fieldset key={layer.id} id={`layer-${layer.id}`} className="card scroll-mt-32 p-5 sm:p-7">
                <legend className="float-none mb-5 w-full">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="flex items-baseline gap-3">
                        <span className="font-display text-3xl text-lime-deep">{layer.n}</span>
                        <span className="text-xl">{layer.name}</span>
                      </span>
                      <span className="mt-1.5 block max-w-2xl text-sm leading-relaxed text-muted">{layer.blurb}</span>
                    </div>
                    <div className="w-full shrink-0 sm:w-52">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wider ${statusInfo.className}`}>
                          <span className={`h-1.5 w-1.5 ${statusInfo.dotClassName}`} aria-hidden="true" />
                          {statusInfo.label}
                        </span>
                        <span className="mono-label tnum !text-[0.62rem]">{Math.round(score.earned)}/{score.possible}</span>
                      </div>
                      <LayerBar percent={score.percent} label={`${layer.name} layer score ${score.percent}%`} />
                    </div>
                  </div>
                </legend>

                <div className="grid gap-5">
                  {layerQuestions.map((q) => (
                    <fieldset
                      key={q.id}
                      id={`question-${q.id}`}
                      className="scroll-mt-32 border-t border-dashed border-line pt-5 first:border-t-0 first:pt-0"
                    >
                      <legend className="mb-3 text-sm font-medium leading-relaxed text-ink">{q.text}</legend>
                      <div className="grid grid-cols-3 gap-2" role="presentation">
                        {ANSWER_OPTIONS.map((opt) => (
                          <label key={opt.value} className="min-w-0 cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.value}
                              checked={answers[q.id] === opt.value}
                              onChange={() => setAnswer(q.id, opt.value)}
                              className="peer sr-only"
                            />
                            <span className="flex min-h-12 flex-col justify-center border border-dashed border-line bg-paper px-3 py-2 text-left transition-colors hover:border-ink/40 peer-checked:border-pine-2 peer-checked:bg-lime peer-checked:text-pine-2 peer-focus-visible:ring-2 peer-focus-visible:ring-lime-deep peer-focus-visible:ring-offset-2 sm:min-h-16">
                              <span className="truncate font-mono text-xs font-medium uppercase tracking-wider">
                                {ANSWER_LABELS[opt.value]}
                              </span>
                              <span className="mt-1 hidden text-xs leading-snug text-muted peer-checked:text-pine-2/75 sm:block">
                                {opt.detail}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>

        {revealed && (
          <div ref={resultRef} className="mt-10 scroll-mt-28">
            <section className="card grid-texture p-5 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
                <ScoreRing score={total} size="lg" label={complete ? "Final readiness score" : "Draft readiness score"} />
                <div>
                  <p className="mono-label text-lime-deep">
                    {complete ? "[ final self-assessment ]" : "[ draft self-assessment ]"}
                  </p>
                  <h3 className="mt-2 text-3xl">{b.label}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{b.note}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Metric label="Readiness" value={`${total}/100`} note={complete ? "Self-scored total" : "Missing answers count as zero"} />
                    <Metric label="Confidence" value={`${completion}%`} note="Rubric completion" />
                    <Metric label={hasPriorityGaps ? "First focus" : "Verify first"} value={weakest[0]?.layer.n ?? "01"} note={weakest[0]?.layer.name ?? "Entity Clarity"} />
                  </div>
                </div>
              </div>

              {!complete && (
                <div className="mt-6 border border-dashed border-amber-200 bg-amber-100 px-4 py-3 text-sm leading-relaxed text-amber-900">
                  This is still a draft. Answer the remaining{" "}
                  <span className="tnum font-mono">{unanswered}</span>{" "}
                  {unanswered === 1 ? "question" : "questions"} before treating the score as final.
                </div>
              )}

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="mono-label">Layer breakdown</p>
                    <span className="mono-label tnum">{answered}/{TOTAL_QUESTIONS} answered</span>
                  </div>
                  <div className="grid gap-3">
                    {layerScores.map((s) => {
                      const statusInfo = layerStatus(s);
                      return (
                        <div key={s.layer.id} className="grid gap-3 border border-dashed border-line bg-paper p-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-lg text-lime-deep">{s.layer.n}</span>
                              <span className="text-sm font-medium">{s.layer.name}</span>
                              <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider ${statusInfo.className}`}>
                                <span className={`h-1.5 w-1.5 ${statusInfo.dotClassName}`} aria-hidden="true" />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{s.layer.blurb}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <LayerBar percent={s.percent} label={`${s.layer.name} result ${s.percent}%`} />
                            <span className="mono-label tnum w-12 shrink-0 text-right">{Math.round(s.earned)}/{s.possible}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-dashed border-line bg-paper-2 p-5">
                  <p className="mono-label">{hasPriorityGaps ? "Fix these first" : "Verify these first"}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {hasPriorityGaps
                      ? "Lower layers come first. These are the places most likely to keep an answer engine from understanding or trusting the site."
                      : "Your self-score is strong. In a live audit, verify the lower layers first because they anchor everything above them."}
                  </p>
                  <div className="mt-5 grid gap-5">
                    {weakest.map((s, index) => (
                      <div key={s.layer.id} className="border-t border-dashed border-line pt-5 first:border-t-0 first:pt-0">
                        <div className="flex items-baseline gap-3">
                          <span className="mono-label text-lime-deep">0{index + 1}</span>
                          <h4 className="font-display text-xl">{s.layer.name}</h4>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{s.layer.blurb}</p>
                        <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted">
                          {LAYER_FIXES[s.layer.id].slice(0, 2).map((fix) => (
                            <li key={fix} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-lime-deep" aria-hidden="true" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-dashed border-line pt-6 sm:flex-row sm:flex-wrap sm:items-center">
                <button type="button" onClick={copySummaryText} className={secondaryButton}>
                  {copyStatus === "success" ? "Copied" : "Copy summary"}
                </button>
                <a href="/free-audit" className={primaryButton}>
                  Verify with free audit
                  <span aria-hidden="true" className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1">→</span>
                </a>
                <a href="/ai-visibility-stack" className={secondaryButton}>
                  See the method
                </a>
              </div>

              {copyStatus === "error" && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  Copy failed in this browser. You can still select the report text manually.
                </p>
              )}
              {copyStatus === "success" && (
                <p role="status" className="mt-3 text-sm text-muted">
                  Summary copied to your clipboard.
                </p>
              )}

              <p className="mt-6 text-xs leading-relaxed text-muted">
                This is a self-assessment of how <span className="text-ink">ready</span> your
                site is for AI search, not a promise of rankings or citations. No one can
                credibly guarantee those. A real audit verifies these answers against your
                actual live site.
              </p>
            </section>

            {status === "success" ? (
              <div role="status" className="card mt-6 flex flex-col items-start gap-3 p-8 text-ink">
                <p className="mono-label text-lime-deep">[ received ]</p>
                <h3 className="text-2xl">Thanks. We&apos;ve got your scorecard.</h3>
                <p className="text-muted">
                  We&apos;ll review your site against these answers and follow up
                  about your project. No spam, no obligation.
                </p>
              </div>
            ) : (
              <form onSubmit={onLeadSubmit} noValidate className="card mt-6 p-6 text-ink sm:p-8">
                <h3 className="text-xl">Want a human-verified version?</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Send the scorecard to queryclear and run the{" "}
                  <a href="/free-audit" className="font-medium text-ink underline hover:text-lime-deep">
                    instant free audit
                  </a>{" "}
                  to check these answers against your live site.
                </p>

                <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                  <label htmlFor="sc-company">Company</label>
                  <input id="sc-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sc-name" className="mb-1.5 block text-sm font-medium">
                      Your name<span className="text-lime-deep"> *</span>
                    </label>
                    <input id="sc-name" name="name" type="text" required autoComplete="name"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="sc-email" className="mb-1.5 block text-sm font-medium">
                      Email<span className="text-lime-deep"> *</span>
                    </label>
                    <input id="sc-email" name="email" type="email" required autoComplete="email"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="sc-website" className="mb-1.5 block text-sm font-medium">
                      Website URL<span className="text-lime-deep"> *</span>
                    </label>
                    <input id="sc-website" name="website" type="url" required defaultValue="https://" placeholder="https://" autoComplete="url"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="sc-business" className="mb-1.5 block text-sm font-medium">
                      Business name<span className="text-lime-deep"> *</span>
                    </label>
                    <input id="sc-business" name="business" type="text" required autoComplete="organization"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="sc-city" className="mb-1.5 block text-sm font-medium">City / market</label>
                    <input id="sc-city" name="city" type="text" autoComplete="address-level2"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="sc-service" className="mb-1.5 block text-sm font-medium">Main service</label>
                    <input id="sc-service" name="service" type="text" placeholder="e.g. lip filler"
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="sc-message" className="mb-1.5 block text-sm font-medium">Anything else?</label>
                    <textarea id="sc-message" name="message" rows={3}
                      className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors" />
                  </div>
                </div>

                {status === "error" && (
                  <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`${primaryButton} mt-6 w-full sm:w-auto`}
                >
                  {status === "submitting" ? (
                    <>
                      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2" />
                      Sending...
                    </>
                  ) : (
                    "Request human check"
                  )}
                </button>
                <p className="mt-3 text-xs text-muted">
                  Free, no obligation. We&apos;ll follow up in plain English,
                  and we do not sell your information.
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
