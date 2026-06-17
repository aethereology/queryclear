import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/site";

// Creates a Stripe Checkout Session for one of our one-time products:
//  - "stack-kit"        — Local AI Visibility Stack founding pre-order ($97, refundable)
//  - "ai-search-audit"  — the $497 AI Search Audit (human-delivered; captures the buyer's site)
// Selected via the POST body `{ product }`; defaults to "stack-kit" for back-compat.
// Env: STRIPE_SECRET_KEY. The page renders without it; only checkout needs it.

export const runtime = "nodejs";

// Per-product Checkout params. Keep stack-kit byte-for-byte as it was.
function checkoutParams(
  product: string,
  origin: string,
): Stripe.Checkout.SessionCreateParams | null {
  if (product === "stack-kit") {
    return {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: site.stackKit.currency,
            unit_amount: site.stackKit.unitAmount,
            product_data: {
              name: `${site.stackKit.name} — founding pre-order`,
              description: `Refundable pre-order. Ships within ${site.stackKit.shipDays} days of purchase; full refund anytime before delivery.`,
            },
          },
        },
      ],
      metadata: { product: "stack-kit" },
      payment_intent_data: { metadata: { product: "stack-kit" } },
      success_url: `${origin}/stack-kit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/stack-kit?canceled=1`,
    };
  }
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
                "A deep, scored AI-search readiness audit: prompt testing across engines, page review, technical findings, local visibility, and a prioritized fix roadmap. Delivered by a human.",
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
        },
      ],
      metadata: { product: "ai-search-audit" },
      payment_intent_data: { metadata: { product: "ai-search-audit" } },
      success_url: `${origin}/ai-visibility-audit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/ai-visibility-audit?canceled=1`,
    };
  }
  return null;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function isRateLimited(req: Request): boolean {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return true;
  }
  bucket.count += 1;
  return false;
}

export async function POST(req: Request) {
  if (isRateLimited(req)) {
    return NextResponse.json({ error: "Please try again in a few minutes." }, { status: 429 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[checkout] STRIPE_SECRET_KEY not set");
    return NextResponse.json(
      { error: `Checkout isn't available right now. Please email ${site.email} and we'll set up your pre-order.` },
      { status: 503 },
    );
  }

  const { product } = (await req.json().catch(() => ({}))) as { product?: string };
  const origin = req.headers.get("origin") || site.url;
  const params = checkoutParams(product ?? "stack-kit", origin);
  if (!params) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  const stripe = new Stripe(key);

  try {
    const session = await stripe.checkout.sessions.create(params);

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
