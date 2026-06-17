# Stack Kit demand test — go-to-market playbook

> The page (`/stack-kit`) is the instrument. The **test** is driving qualified traffic
> and counting real pre-orders. The page being live ≠ the test running. This doc is the
> motion: how customers reach it, ready-to-use copy, and the rule that decides whether
> we build the kit. Honesty guardrails apply to everything here — "founding pre-order,"
> refundable, no guaranteed rankings/citations.

Live page: https://www.queryclear.com/stack-kit · Price: $97 · Ships ≤30 days, refundable.

## How customers reach it (channels, fastest-validating first)

1. **Direct outreach** — DM/email/post the link to real local-business owners and
   relevant communities (local-biz subreddits, FB groups, Slack/Discords, your network).
   10–30 targeted touches is enough to read interest. Fastest, free, highest-signal.
2. **Small paid smoke test** — $50–150 on Google/Meta/Reddit ads pointed at the page;
   measure cost-per-pre-order. Cleanest quantitative read.
3. **On-site cross-links** (passive) — footer "Resources", the method-page CTA button,
   and FAQ mentions on the homepage + audit page. Captures visitors who'd rather DIY.
4. **Organic/SEO** (slow) — it's in the sitemap; can rank over months for "DIY AI
   visibility / local AI search kit" intent.

Tag every outreach/ad link with a UTM so you can tell channels apart, e.g.
`https://www.queryclear.com/stack-kit?utm_source=outreach` /`?utm_source=reddit_ad`.
(The page doesn't parse UTMs yet — Stripe order count + a manual tally per channel is
enough for a first test.)

## Cold outreach template (DM / email)

Subject: quick one — would you pre-order this?

> Hi [name] — I run queryclear; I help local businesses show up when people ask AI tools
> (ChatGPT, Google's AI answers, Perplexity) for recommendations. I'm putting together a
> **$97 do-it-yourself kit**: a step-by-step playbook + copy-paste templates so you can
> make your own site clearer to those AI engines — no agency needed.
>
> It's a **founding pre-order**: ships within 30 days, fully refundable anytime before
> then. Would you actually use something like this? Page here: [link]
>
> An honest yes/no genuinely helps me decide whether to build it. Thanks either way.

Keep it 1:1 and specific. Personalize the first line to their business/trade.

## Ad copy starters (test 2–3)

1. **"Get your [business] found in AI answers — DIY, $97"**
   Playbook + templates to make your site clear to ChatGPT, Google AI & more. Founding
   pre-order, fully refundable.
2. **"When people ask AI for a [trade] near them, do you show up?"**
   The $97 DIY kit to get your local business AI-search-ready. Refundable pre-order.
3. **"Do your own AI search optimization — $97"**
   Playbook, schema templates, llms.txt, and a scorecard from queryclear. Ships in 30
   days or full refund.

No guarantee language. Lead with the customer's fear (being invisible in AI answers),
not hype.

## Success bar — the decision rule

Run a focused 2–4 week push, then decide:

- **GREENLIGHT (build the kit):** ≥ **10 pre-orders**, OR an ad smoke test showing
  click→pre-order ≥ ~**1–2%** at cost-per-pre-order ≤ ~**$30**.
- **PARK/KILL:** ≤ **3 pre-orders** (or near-zero CTR) after ~**300–500** qualified
  visits → refund everyone, shelve the kit, stay audit-first. A weak result is a *win* —
  it saved you from building something nobody wanted.
- **MIDDLE (4–9 pre-orders):** real but soft. Consider a second outreach round, or pivot
  the offer toward the $497 done-for-you audit (warm leads who almost bought).

Measure pre-orders in the **Stripe Dashboard**; tally by channel via the UTM tags above.
Whatever happens, honor the page's promise: ship ≤30 days or refund automatically.

## Guardrails

- Never promise rankings or AI citations.
- "Pre-order," not "buy now." Always restate refundable + ship window.
- The kit is the funnel, not the headline — the free AI Search Audit (`/free-audit`)
  → $497 audit motion stays primary (GATE-MODEL). Don't let kit promotion crowd out
  the audit.
