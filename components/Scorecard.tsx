"use client";

import { useRef, useState } from "react";
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
} from "@/lib/scorecard";

const ANSWER_OPTIONS: Answer[] = ["yes", "partial", "no"];
type LeadStatus = "idle" | "submitting" | "success" | "error";

// Conic-gradient readiness ring — same visual language as the sample audit.
function ScoreRing({ score }: { score: number }) {
  const deg = (score / 100) * 360;
  return (
    <div
      className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--color-lime) ${deg}deg, var(--color-paper-2) 0)` }}
      role="img"
      aria-label={`AI-visibility readiness score ${score} out of 100`}
    >
      <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-paper">
        <span className="font-display text-4xl leading-none">
          <CountUp to={score} />
        </span>
        <span className="mono-label !text-[0.6rem]">/ 100</span>
      </div>
    </div>
  );
}

function LayerBar({ percent }: { percent: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden border border-line bg-paper-2"
      role="img"
      aria-label={`${percent}% of this layer's points`}
    >
      <div className="h-full bg-lime" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Scorecard() {
  const [answers, setAnswers] = useState<Answers>({});
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<LeadStatus>("idle");
  const [error, setError] = useState("");

  const answered = answeredCount(answers);
  const complete = answered === TOTAL_QUESTIONS;

  function setAnswer(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function reveal() {
    setRevealed(true);
    // Let the result render, then bring it into view.
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

  const total = scoreTotal(answers);
  const layerScores = scoreAllLayers(answers);
  const weakest = weakestLayers(answers, 2);
  const b = band(total);

  return (
    <div>
      {/* Questions, grouped by layer */}
      <div className="grid gap-4">
        {layers.map((layer) => {
          const layerQuestions = questions.filter((q) => q.layer === layer.id);
          return (
            <fieldset key={layer.id} className="card p-6 sm:p-8">
              <legend className="float-none mb-4 w-full">
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-2xl text-lime-deep">{layer.n}</span>
                  <span className="text-lg">{layer.name}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">{layer.blurb}</span>
              </legend>

              <div className="grid gap-5">
                {layerQuestions.map((q) => (
                  <fieldset key={q.id}>
                    <legend className="mb-2 text-sm font-medium text-ink">{q.text}</legend>
                    <div className="flex flex-wrap gap-2" role="presentation">
                      {ANSWER_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className="cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswer(q.id, opt)}
                            className="peer sr-only"
                          />
                          <span className="inline-flex items-center border border-dashed border-line bg-paper px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-ink/40 peer-checked:border-lime-deep peer-checked:bg-lime peer-checked:text-pine-2 peer-focus-visible:ring-2 peer-focus-visible:ring-lime-deep peer-focus-visible:ring-offset-2">
                            {ANSWER_LABELS[opt]}
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

      {/* Progress + reveal */}
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {answered} of {TOTAL_QUESTIONS} answered
          {!complete && revealed && " — answer them all for your most accurate score."}
        </p>
        <button
          type="button"
          onClick={reveal}
          className="btn-hex group inline-flex w-full items-center justify-center gap-2 border border-lime bg-lime px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime sm:w-auto"
        >
          {revealed ? "Update my score" : "See my score"}
          <span aria-hidden="true" className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1">→</span>
        </button>
      </div>

      {/* Result */}
      {revealed && (
        <div ref={resultRef} className="mt-12 scroll-mt-24">
          <section className="card grid-texture p-6 sm:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <ScoreRing score={total} />
              <div>
                <p className="mono-label text-lime-deep">[ your readiness ]</p>
                <h3 className="mt-2 text-2xl">{b.label}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{b.note}</p>
              </div>
            </div>

            {/* Per-layer breakdown */}
            <div className="mt-8 grid gap-4">
              {layerScores.map((s) => (
                <div key={s.layer.id} className="grid gap-2 sm:grid-cols-[1fr_minmax(160px,240px)] sm:items-center sm:gap-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-lg text-lime-deep">{s.layer.n}</span>
                    <span className="text-sm font-medium">{s.layer.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LayerBar percent={s.percent} />
                    <span className="mono-label tnum w-12 shrink-0 text-right">{Math.round(s.earned)}/{s.possible}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Weakest layers → method */}
            <div className="mt-8 border-t border-line pt-6">
              <p className="mono-label">Start with your weakest layers</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {weakest.map((s) => (
                  <div key={s.layer.id} className="border border-dashed border-line bg-paper p-4">
                    <p className="text-sm font-medium">{s.layer.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.layer.blurb}</p>
                    <a
                      href="/ai-visibility-stack"
                      className="mt-2 inline-block text-sm font-medium text-ink underline hover:text-lime-deep"
                    >
                      How this layer works →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted">
              This is a self-assessment of how <span className="text-ink">ready</span> your
              site is for AI search — not a promise of rankings or citations. No one can
              credibly guarantee those. A real audit verifies these answers against your
              actual live site.
            </p>
          </section>

          {/* Optional lead capture, score attached */}
          {status === "success" ? (
            <div role="status" className="card mt-6 flex flex-col items-start gap-3 p-8 text-ink">
              <p className="mono-label text-lime-deep">[ received ]</p>
              <h3 className="text-2xl">Thanks — we&apos;ve got your scorecard.</h3>
              <p className="text-muted">
                We&apos;ll review your site against these answers and reply with a real,
                verified AI search audit. No spam, no obligation.
              </p>
            </div>
          ) : (
            <form onSubmit={onLeadSubmit} noValidate className="card mt-6 p-6 text-ink sm:p-8">
              <h3 className="text-xl">Want this verified? Get a free audit.</h3>
              <p className="mt-1.5 text-sm text-muted">
                We&apos;ll check these answers against your live site and send a scored,
                prioritized fix list. Your self-scorecard comes with it — no obligation.
              </p>

              {/* honeypot */}
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
                className="btn-hex mt-6 inline-flex w-full items-center justify-center gap-2 border border-lime bg-lime px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime disabled:opacity-70 sm:w-auto"
              >
                {status === "submitting" ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2" />
                    Sending…
                  </>
                ) : (
                  "Email me my scorecard + book a free audit"
                )}
              </button>
              <p className="mt-3 text-xs text-muted">
                Free, no obligation. We reply with a real audit, not a sales bot.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
