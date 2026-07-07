import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import {
  renderStackKitOrderEmail,
  renderAuditOrderEmail,
  renderCarePlanOrderEmail,
} from "@/lib/email";
import { site } from "@/lib/site";

// Stripe webhook. On a completed checkout we email the order to the team so we
// know who bought (stack-kit pre-order, the $497 AI Search Audit, or the $997/mo
// AI Search Care Plan subscription — dispatched off session.metadata.product).
// Signature is verified against STRIPE_WEBHOOK_SECRET. Must read the raw body for
// verification, so do NOT parse JSON first.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, LEAD_TO, LEAD_FROM.

export const runtime = "nodejs";

async function notifyOrder(session: Stripe.Checkout.Session) {
  const key = process.env.RESEND_API_KEY;
  const email = session.customer_details?.email ?? "unknown";
  const name = session.customer_details?.name ?? "—";
  const amount = ((session.amount_total ?? site.stackKit.unitAmount) / 100).toFixed(2);
  const currency = (session.currency ?? site.stackKit.currency).toUpperCase();

  if (!key) {
    // Order is recorded in Stripe regardless; just note delivery isn't configured.
    console.log("[stripe-webhook] pre-order received (email not configured)");
    return;
  }

  const resend = new Resend(key);
  const to = process.env.LEAD_TO ?? site.email;
  const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
  const who = name === "—" ? email : name;
  const website =
    session.custom_fields?.find((f) => f.key === "website")?.text?.value ?? "";

  // Dispatch by product. Default (no/other metadata) stays the stack-kit path.
  const product = session.metadata?.product;
  let subject: string;
  let html: string;
  if (product === "ai-search-audit") {
    subject = `New AI Search Audit purchase — ${who}`.slice(0, 140);
    html = renderAuditOrderEmail(
      { amount, currency, name, email, sessionId: session.id ?? "", website },
      site,
    );
  } else if (product === "care-plan") {
    // Subscriptions may report amount_total = 0 (trial/coupon); fall back to the
    // configured monthly price so the team email always shows the real number.
    const careAmount =
      session.amount_total && session.amount_total > 0
        ? amount
        : (site.carePlan.unitAmount / 100).toFixed(2);
    subject = `New AI Search Care Plan subscriber — ${who}`.slice(0, 140);
    html = renderCarePlanOrderEmail(
      {
        planName: site.carePlan.name,
        amount: careAmount,
        currency,
        name,
        email,
        sessionId: session.id ?? "",
        subscriptionId:
          typeof session.subscription === "string" ? session.subscription : "",
        website,
      },
      site,
    );
  } else {
    subject = `New Stack Kit pre-order — ${who}`.slice(0, 140);
    html = renderStackKitOrderEmail(
      {
        kitName: site.stackKit.name,
        amount,
        currency,
        name,
        email,
        sessionId: session.id ?? "",
        shipDays: site.stackKit.shipDays,
      },
      site,
    );
  }

  try {
    const response = await resend.emails.send({
      from,
      to,
      ...(email !== "unknown" ? { replyTo: email } : {}),
      subject,
      html,
    });
    if (response.error) {
      throw response.error;
    }
  } catch (err) {
    console.error(
      "[stripe-webhook] order email failed",
      err instanceof Error ? err.name : typeof err,
    );
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    console.error("[stripe-webhook] not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error(
      "[stripe-webhook] signature verification failed",
      err instanceof Error ? err.name : typeof err,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await notifyOrder(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
