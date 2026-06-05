# Design — T14 `/stack-kit` $97 offer-test page

> Status: approved 2026-06-05. Implements BUILD_QUEUE **T14** (Phase 5 demand test).
> GATE-MODEL: audit-first stays primary; this validates demand for "The Local AI
> Visibility Stack" BEFORE the product is built. Do not build kit contents until
> this test shows real demand.

## Goal

A single landing page that measures real demand for a $97 DIY product by taking a
**refundable pre-order** via Stripe. Strongest possible demand signal (people pay),
while staying honest (no charging for a product that exists — it's a clearly-labeled
pre-order with a hard ship date and an easy refund).

## The offer

**Product:** "The Local AI Visibility Stack" — a $97 DIY kit that lets a local
business owner apply queryclear's 7-layer method themselves. Positioned as the cheap
end of the money ladder and a funnel into the $750 done-for-you audit.

**What's inside (described on the page; built only if it sells):**
1. The 7-layer playbook — step-by-step, one section per layer.
2. Copy-paste schema templates — Organization, LocalBusiness, Service, FAQPage.
3. An `llms.txt` template + how to publish it.
4. The AI-visibility prompt set — exact prompts to ask ChatGPT/Claude/Perplexity/
   Gemini to see how they describe your business today.
5. A self-scoring scorecard — the 100-point rubric to grade your own site.
6. A service-page structure template.

## Pre-order terms (the honesty commitment — shown on page + receipt)

> Founding pre-order. The Local AI Visibility Stack ships within **30 days** of
> purchase. Full refund anytime before delivery — just email info@queryclear.com.
> If we miss 30 days, we refund you automatically.

No guarantee language. The kit is DIY guidance, not a ranking/citation guarantee.
Readers who'd rather we do it are routed to the $750 audit.

## Page structure (`/stack-kit`, follows `page-template.md`)

Server Component page + one small client component for the pre-order button.

1. Hero — "The Local AI Visibility Stack — do the work yourself, $97" + founding
   pre-order badge + primary pre-order CTA.
2. What's inside — the 6 items above.
3. Who it's for / who should skip it (skip → buy the audit instead).
4. Pre-order terms — stated plainly (ship window + refund).
5. Price + pre-order CTA (repeated).
6. FAQ (FAQPage schema).
7. No-guarantee disclaimer + link to the $750 audit.

CTA top + bottom. Schema: WebPage + Product (with Offer) + FAQPage + BreadcrumbList.
Added to `app/sitemap.ts` + `app/llms.txt/route.ts`. New shared strings (product
name, price, ship window, kit contents) go in `lib/site.ts`.

## Technical approach

- **Stripe Checkout Sessions (hosted).** Best-practice for a one-time $97 charge:
  least code, PCI handled by Stripe, mobile-ready.
- **`POST /api/checkout`** — route handler creates a Checkout Session
  (`mode: "payment"`, one line item $97 USD, `metadata.product = "stack-kit"`,
  success_url `/stack-kit/success`, cancel_url `/stack-kit?canceled=1`). Returns the
  session URL; the client button redirects to it. Rate-limited (reuse the lead
  route's IP bucket pattern). Returns a clear error if `STRIPE_SECRET_KEY` is unset.
- **`POST /api/stripe/webhook`** — verifies the Stripe signature with
  `STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed`, and emails the order
  (name/email/amount) to `info@queryclear.com` via the existing Resend setup so we
  know who pre-ordered. Must read the raw body for signature verification.
- **`/stack-kit/success`** page — thank-you + restates the 30-day ship + refund
  promise + what happens next.
- **Env (already set in `.env.local`):** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`. The page renders without keys; only checkout needs them.
  These must also be added to Vercel production env before the page goes live.
- **Dependency:** add `stripe` (Node SDK).

## Honesty guardrails

"Pre-order," never "buy now." Refund/ship promise on page AND Stripe receipt. No
guarantee language. Kit clearly DIY. "Rather we do it?" → `/ai-visibility-audit`.

## Testing (extend `tests/`)

- Checkout route: rejects when `STRIPE_SECRET_KEY` unset; creates a session with the
  correct amount/currency/metadata (Stripe client stubbed); rate-limit works.
- Webhook route: rejects bad/missing signature; on `checkout.session.completed`
  triggers the Resend notification (Resend + Stripe stubbed).
- `npm run build` + `npm run lint` + `npm test` all green.

## Out of scope (YAGNI)

No customer account, no digital-file delivery (product isn't built), no subscription,
no automated refund flow (refunds handled manually in Stripe Dashboard for now), no
inventory/quantity. This is a demand test.

## Deploy / founder dependencies

- Add the three `STRIPE_*` env vars to Vercel production.
- Register the webhook endpoint in the Stripe Dashboard
  (`https://www.queryclear.com/api/stripe/webhook`) and confirm the signing secret
  matches `STRIPE_WEBHOOK_SECRET`.
- Keys are currently test or live per what the founder entered; verify before launch.
