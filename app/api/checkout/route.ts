import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/site";
import { operationsStore } from "@/lib/operations-store";
import { readJsonRequest } from "@/lib/json-request";

// Creates a Stripe Checkout Session for the human-delivered paid audit:
//  - "ai-search-audit"  — the $497 AI Search Audit (human-delivered; captures the buyer's site; one-time)
// Selected via the POST body. Checkout also requires recorded Terms assent.
// Env: STRIPE_SECRET_KEY and AUDIT_CHECKOUT_PAUSED. Paid-audit checkout opens
// only when the capacity switch is explicitly `false`; missing/invalid values
// fail closed. The page renders without either value.

export const runtime = "nodejs";

function checkoutParams(
  product: string,
  origin: string,
  termsVersion: string,
  termsAcceptedAt: string,
  requestId: string,
): Stripe.Checkout.SessionCreateParams | null {
  const legalMetadata = {
    checkout_request_id: requestId,
    terms_accepted: "true",
    terms_accepted_at: termsAcceptedAt,
    terms_version: termsVersion,
  };
  if (product === "ai-search-audit") {
    return {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: site.auditProduct.currency,
            unit_amount: site.auditProduct.unitAmount,
            product_data: {
              name: site.auditProduct.name,
              description:
                "A human-delivered AI-search readiness audit: up to 10 public URLs and 12 total prompt-engine observations distributed across up to 3 named engines, plus evidence-linked scoring and a prioritized roadmap.",
            },
          },
        },
      ],
      // Capture the site to audit so we can fulfill (Stripe collects the email).
      custom_fields: [
        {
          key: "website",
          label: { type: "custom", custom: "Your website URL" },
          type: "text",
          optional: false,
        },
      ],
      metadata: { product: "ai-search-audit", ...legalMetadata },
      payment_intent_data: { metadata: { product: "ai-search-audit", ...legalMetadata } },
      success_url: `${origin}/ai-visibility-audit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/ai-visibility-audit?canceled=1`,
    };
  }
  return null;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const MAX_REQUEST_BYTES = 2 * 1024;

function getClientIp(req: Request) {
  const trusted =
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim();
  if (trusted) return trusted;
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

function checkoutOrigin(req: Request): string {
  const configured = new URL(site.url).origin;
  if (process.env.NODE_ENV === "production") return configured;

  const requestOrigin = req.headers.get("origin");
  if (!requestOrigin) return configured;
  try {
    const parsed = new URL(requestOrigin);
    if (
      ["http:", "https:"].includes(parsed.protocol) &&
      ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
    ) {
      return parsed.origin;
    }
  } catch {
    // Ignore malformed or attacker-controlled origins and use the canonical URL.
  }
  return configured;
}

function isAllowedRequestOrigin(req: Request): boolean {
  const value = req.headers.get("origin");
  if (!value) return true; // Non-browser clients have no ambient browser credentials.
  try {
    const origin = new URL(value);
    if (origin.origin === new URL(site.url).origin) return true;
    return (
      process.env.NODE_ENV !== "production" &&
      ["http:", "https:"].includes(origin.protocol) &&
      ["localhost", "127.0.0.1", "::1"].includes(origin.hostname)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!isAllowedRequestOrigin(req)) {
    return NextResponse.json({ error: "Checkout origin is not allowed." }, { status: 403 });
  }
  try {
    const rateLimit = await operationsStore().rateLimit(
      "checkout",
      getClientIp(req),
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Please try again in a few minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))) },
        },
      );
    }
  } catch {
    console.error("[checkout] shared rate-limit storage unavailable");
    return NextResponse.json(
      { error: `Checkout isn't available right now. Please email ${site.email}.` },
      { status: 503 },
    );
  }

  const parsedBody = await readJsonRequest(req, MAX_REQUEST_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = parsedBody.value as {
    product?: string;
    termsAccepted?: boolean;
    termsVersion?: string;
    requestId?: string;
  };
  const requestId = (req.headers.get("idempotency-key") ?? body.requestId ?? "").trim();
  if (!/^[a-z\d_-]{20,120}$/i.test(requestId)) {
    return NextResponse.json({ error: "Missing or invalid checkout request ID." }, { status: 400 });
  }
  if (body.product === "stack-kit") {
    return NextResponse.json({ error: "This product is no longer available." }, { status: 410 });
  }
  if (body.product === "care-plan") {
    return NextResponse.json(
      { error: "The Care Plan requires an eligibility review. Please contact us first." },
      { status: 403 },
    );
  }
  if (body.product !== "ai-search-audit") {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  if (process.env.AUDIT_CHECKOUT_PAUSED?.trim().toLowerCase() !== "false") {
    return NextResponse.json(
      {
        error: `Paid audit checkout is temporarily paused while we confirm delivery capacity. Please email ${site.email} for the next available opening.`,
      },
      { status: 503 },
    );
  }
  if (
    body.termsAccepted !== true ||
    body.termsVersion !== site.legal.termsVersion
  ) {
    return NextResponse.json(
      { error: "Please accept the current Terms of Service before checkout." },
      { status: 422 },
    );
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[checkout] STRIPE_SECRET_KEY not set");
    return NextResponse.json(
      { error: `Checkout isn't available right now. Please email ${site.email}.` },
      { status: 503 },
    );
  }

  const origin = checkoutOrigin(req);
  const params = checkoutParams(
    body.product,
    origin,
    body.termsVersion,
    new Date().toISOString(),
    requestId,
  );
  if (!params) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  const stripe = new Stripe(key);

  try {
    const session = await stripe.checkout.sessions.create(params, { idempotencyKey: requestId });

    if (!session.url) {
      throw new Error("Stripe returned no checkout URL");
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(
      "[checkout] create session failed",
      err instanceof Error ? err.name : typeof err,
    );
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again, or email us." },
      { status: 502 },
    );
  }
}
