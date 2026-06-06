# Playbook — running a paid audit & producing the report

> How to deliver a paid AI-search readiness audit (the ~$750 front-door service)
> as a repeatable artifact. The report is a typed data file rendered by the
> `<AuditReport>` template, delivered as a private web link (and Save-as-PDF).
>
> Hard rules: **verified client details only** — never invent businesses, reviews,
> ratings, credentials, addresses, hours, or providers. **Readiness language only**
> — never promise rankings or AI citations. (See `CLAUDE.md` §4 + `seed_data.md`.)

---

## 0. What the client receives
A private report at `https://www.queryclear.com/reports/<slug>` — noindexed,
excluded from sitemap/llms.txt, and disallowed in robots. They (or we) can open it
and **Save as PDF** (Ctrl/Cmd-P → Save as PDF) to email; print styles drop the
site nav/footer and CTA automatically.

## 1. Run the audit (the analysis)
Work the client's **real** live site. Produce, in order:

1. **AI-visibility tests.** Ask the questions a real customer would, across the
   major answer engines, using the patterns in [`prompts.md`](../../prompts.md).
   For each: record the prompt, whether the business **surfaced**, and a one-line
   note on what happened (`Not surfaced` / `Vague / wrong` / `Unknown`, etc.).
2. **Score the seven layers (0–10 each).** Grade the actual site against each layer
   of the AI Visibility Stack. The rubric/questions live in
   [`lib/scorecard.ts`](../../lib/scorecard.ts) (layers + what each requires). Write
   a one- to two-sentence `finding` per layer describing what's there and what's missing.
   - The headline "current readiness" score is **derived** from these ten-point
     scores by `scoreFromLayers()` — you don't set it by hand, so it can never
     contradict the scorecard. Set `scoreAfter` (your honest estimate after the
     fixes land) yourself.
3. **Prioritized fixes.** For each material gap write a fix: `sev`
   (Critical/High/Medium), `title`, the `layer` it lifts, `why` it matters, the
   concrete `fix`, and `effort` (Low/Medium/High). They render biggest-impact-first
   automatically (`sortedFixes`).
4. **Before → after machine view.** A few "before" mono lines (what a machine finds
   today, e.g. `# llms.txt → 404`) + a one-line `beforeNote`, and the structured
   "after" key/values we'd make readable + a one-line `afterNote`. The "after" is
   illustrative but must be built from **real** details.

## 2. Produce the report (the deliverable)
1. **Pick an unguessable slug** — e.g. `acme-dental-7f3a2c` (business + short random
   suffix). This is the privacy boundary, so don't use a guessable name alone.
2. **Create the data file** `lib/reports/<slug>.ts` exporting an `AuditReport`. Copy
   the structure from the fictional example in
   [`lib/reports/index.ts`](../../lib/reports/index.ts) or the public sample
   [`lib/reports/goldleaf-demo.ts`](../../lib/reports/goldleaf-demo.ts). Set:
   - `slug` = the slug above · `variant: "client"` · **`demo: false`**
   - `business`, `market`, optional `sector`, optional `preparedOn` (a date string)
   - `scoreAfter`, `visibilityTests`, `scorecard` (all 7 layers), `fixes`, `machineView`
3. **Register it.** In `lib/reports/index.ts`, import the report and add it to the
   `reports` map. (Leave the fictional example in place.)
4. **Verify locally:** `npm run build && npm run lint && npm test`, then open
   `/reports/<slug>` in `npm run dev`. Confirm the page renders, view-source shows
   `<meta name="robots" content="noindex">`, and Ctrl/Cmd-P preview is clean.

## 3. Deliver
1. `git add` the new data file + the registry change, commit, push.
2. `vercel --prod --scope sparkcreativesinc` to deploy.
3. Send the client the private link. To attach a PDF, open the link → Save as PDF.

## Data-file skeleton

```ts
// lib/reports/<slug>.ts
import type { AuditReport } from "@/lib/audit-report";

export const report: AuditReport = {
  slug: "<unguessable-slug>",
  business: "<verified business name>",
  market: "<city / service area>",
  sector: "<optional sector line>",
  scoreAfter: 0,            // honest estimate after fixes (0–100)
  variant: "client",
  demo: false,
  preparedOn: "<e.g. June 2026>",
  visibilityTests: [
    { prompt: "…", result: "Not surfaced", note: "…" },
  ],
  scorecard: [
    { layer: "entity-clarity",       score: 0, finding: "…" },
    { layer: "service-specificity",  score: 0, finding: "…" },
    { layer: "proof-density",        score: 0, finding: "…" },
    { layer: "local-relevance",      score: 0, finding: "…" },
    { layer: "answer-coverage",      score: 0, finding: "…" },
    { layer: "machine-readability",  score: 0, finding: "…" },
    { layer: "conversion-path",      score: 0, finding: "…" },
  ],
  fixes: [
    { sev: "Critical", title: "…", layer: "Machine Readability", why: "…", fix: "…", effort: "Low" },
  ],
  machineView: {
    before: ["# llms.txt → 404", "# schema → none"],
    beforeNote: "AI can't confidently describe you",
    after: [{ k: "Business", v: "…" }, { k: "@type", v: "…" }],
    afterNote: "clear · structured · citable",
  },
};
```

Then in `lib/reports/index.ts`:

```ts
import { report as acmeDental } from "@/lib/reports/<slug>";
export const reports: Record<string, AuditReport> = {
  [rivermarkExample.slug]: rivermarkExample,
  [acmeDental.slug]: acmeDental,
};
```
