import { NextResponse } from "next/server";
import Stripe from "stripe";
import { site } from "@/lib/site";

// Creates a Stripe Checkout Session for the Local AI Visibility Stack founding
// pre-order ($97, refundable). The product is not built yet — this is a demand test.
// Env: STRIPE_SECRET_KEY. The page renders without it; only checkout needs it.

export const runtime = "nodejs";

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

  const origin = req.headers.get("origin") || site.url;
  const stripe = new Stripe(key);

  try {
    const session = await stripe.checkout.sessions.create({
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
    });

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
