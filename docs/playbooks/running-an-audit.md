# Playbook — running a paid audit & producing the report

> How to deliver a paid AI Search Audit (the $497 front-door service)
> as a repeatable artifact. The report is a typed data file rendered by the
> `<AuditReport>` template, delivered as a private web link (and Save-as-PDF).
>
> Hard rules: **verified client details only** — never invent businesses, reviews,
> ratings, credentials, addresses, hours, or providers. **Readiness language only**
> — never promise rankings or AI citations. (See `CLAUDE.md` §4 + `seed_data.md`.)

---

## 0. What the client receives
A private, expiring link at
`https://www.queryclear.com/reports/<slug>?access=<signed-token>`. Real reports
are stored in private Vercel Blob storage, require a valid HMAC token, send
`Cache-Control: private, no-store`, and are noindexed/excluded from discovery.
The client can **Save as PDF** (Ctrl/Cmd-P → Save as PDF); print styles drop the
site nav/footer and CTA automatically. Never send the bare slug as access.

## 1. Run the audit (the analysis)
Work the client's **real** live site. Produce, in order:

1. **Prompt-engine observations.** Freeze up to 12 total observations distributed
   across no more than three named answer engines selected at kickoff, using buyer
   questions based on the patterns in [`prompts.md`](../../prompts.md). One exact
   prompt checked in one engine is one observation; checking the same prompt in
   three engines consumes three observations, and a repeat consumes another.
   Record the complete allocation before testing. For each observation, record the
   prompt, whether the business **surfaced**, and a one-line note on what happened
   (`Not surfaced` / `Vague / wrong` / `Unknown`, etc.). A failed or blocked check
   remains a documented observation and is not silently replaced.
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
1. **Pick a non-identifying slug** — e.g. `client-7f3a2c9d`. The signed token is
   the access boundary, but the slug should still avoid exposing the client name.
2. **Create a JSON file outside the repository** using the skeleton below. Never
   put a real client's data in `lib/reports`, Git, a pull request, or a build
   artifact. Set:
   - `slug` = the slug above · `variant: "client"` · **`demo: false`**
   - `business`, `market`, optional `sector`, optional `preparedOn` (a date string)
   - `scoreAfter`, `visibilityTests`, `scorecard` (all 7 layers), `fixes`, `machineView`
   - For every answer sample, record `engine`, ISO `observedAt`, concrete
     `accessMethod`, and `observationType` (`live`, `modeled`, or `manual`). A
     modeled or transcribed result must never be labeled live.
3. **Configure private delivery.** Set the same strong (32+ character)
   `REPORT_ACCESS_SECRET` in `.env.local` and Vercel production. Configure
   `BLOB_READ_WRITE_TOKEN` (or Vercel OIDC with `BLOB_STORE_ID`) in both places.
4. **Upload and create the expiring link:**

   ```sh
   npm run report:publish -- "C:/secure-client-files/report.json" --days 7
   ```

   The command uploads with private access and prints the signed link. The link
   exchanges the expiring signature for a report-scoped, HttpOnly cookie and
   redirects to a clean `/reports/<slug>` URL; the Blob itself remains private.
   It refuses to overwrite an existing report unless `--overwrite` is explicitly
   supplied.
5. **Verify:** run `npm run build && npm run lint && npm test`, open the printed
   signed link, confirm the address bar is cleaned after the redirect, confirm a
   missing/tampered/expired token returns 404, inspect `Cache-Control`,
   `Referrer-Policy: no-referrer`, and `X-Robots-Tag`, and confirm print preview
   is clean.

## 3. Deliver
1. Send the client only the signed link through an approved channel.
2. To attach a PDF, open the signed link → Save as PDF; store/send it as a
   confidential client deliverable.
3. Reissue a shorter-lived link when needed. Do not reuse expired links or paste
   access tokens into tickets, analytics fields, or public chat.
4. Treat the original signed URL as a bearer credential even though the report
   page removes it from the address bar. To revoke access early, remove the
   private Blob; rotating `REPORT_ACCESS_SECRET` revokes every outstanding link
   and cookie and therefore requires an intentional client reissue plan.

## Data-file skeleton

```json
{
  "slug": "<non-identifying-slug>",
  "business": "<verified business name>",
  "market": "<city / service area>",
  "sector": "<optional sector line>",
  "scoreAfter": 0,
  "variant": "client",
  "demo": false,
  "preparedOn": "<e.g. August 2026>",
  "visibilityTests": [
    {
      "prompt": "…",
      "result": "Not surfaced",
      "note": "…",
      "engine": "<named product>",
      "observedAt": "2026-08-25T14:30:00-04:00",
      "accessMethod": "Logged-out browser session",
      "observationType": "live"
    }
  ],
  "scorecard": [
    { "layer": "entity-clarity", "score": 0, "finding": "…" },
    { "layer": "service-specificity", "score": 0, "finding": "…" },
    { "layer": "proof-density", "score": 0, "finding": "…" },
    { "layer": "local-relevance", "score": 0, "finding": "…" },
    { "layer": "answer-coverage", "score": 0, "finding": "…" },
    { "layer": "machine-readability", "score": 0, "finding": "…" },
    { "layer": "conversion-path", "score": 0, "finding": "…" }
  ],
  "fixes": [
    { "sev": "Critical", "title": "…", "layer": "Machine Readability", "why": "…", "fix": "…", "effort": "Low" }
  ],
  "machineView": {
    "before": ["# llms.txt → 404", "# schema → none"],
    "beforeNote": "AI can't confidently describe you",
    "after": [{ "k": "Business", "v": "…" }, { "k": "@type", "v": "…" }],
    "afterNote": "clear · structured · citable"
  }
}
```
