# Prompts — queryclear

Two kinds: (1) **AI-visibility test prompts** we run against answer engines as
part of a client audit (a deliverable), and (2) **internal prompts** we use to
produce audits/reports.

> STATUS: seeded with starter templates. Refine as we run real audits.

---

## 1. AI-visibility test prompts (client-facing deliverable)

Run these against ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews,
Bing Copilot. Record: does the client's business surface? Cited? Accurate?
Who shows up instead?

Replace `{SERVICE}`, `{CITY}`, `{BUSINESS}`, `{CATEGORY}`.

- "Who are the best `{SERVICE}` providers in `{CITY}`?"
- "I need a `{SERVICE}` in `{CITY}` — who should I call?"
- "Recommend a trustworthy `{CATEGORY}` business near `{CITY}`."
- "What should I look for when hiring a `{SERVICE}` in `{CITY}`?"
- "Compare top `{CATEGORY}` options in `{CITY}`."
- "Tell me about `{BUSINESS}`." (entity clarity / accuracy check)
- "Does `{BUSINESS}` offer `{SERVICE}`?" (service clarity check)
- "What are `{BUSINESS}`'s hours / service area?" (factual readiness — only if real data exists)

**Scoring per prompt:** Surfaced? (Y/N) · Cited with link? (Y/N) ·
Info accurate? (Y/N) · Competitors named instead · Notes.

---

## 2. Internal audit/report prompts (our tooling)

> Keep these honest — no invented facts, no guaranteed outcomes.

**Audit synthesis prompt (template):**
> "You are a GEO analyst. Given this site's crawl data, schema, content, and the
> AI-visibility test results, produce a prioritized fix list. For each finding:
> what's wrong, why it hurts AI understanding/citation, the concrete fix, and
> effort (low/med/high). Only state what the evidence supports. Do not promise
> rankings or citations."

**llms.txt generation prompt (template):**
> "Given this business's real, verified details, draft an `llms.txt` that
> summarizes who they are, what they offer, service area, and key pages. Plain,
> accurate, no marketing hype, no invented facts."

**Schema generation prompt (template):**
> "Generate valid JSON-LD for {types} using ONLY the verified fields provided.
> Omit any field we don't have real data for. Output must validate."
