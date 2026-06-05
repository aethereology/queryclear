import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { site } from "@/lib/site";

// Stripe webhook. On a completed pre-order checkout we email the order to the team
// so we know who pre-ordered. Signature is verified against STRIPE_WEBHOOK_SECRET.
// Must read the raw body for verification, so do NOT parse JSON first.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, LEAD_TO, LEAD_FROM.

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

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

  try {
    const response = await resend.emails.send({
      from,
      to,
      ...(email !== "unknown" ? { replyTo: email } : {}),
      subject: `New Stack Kit pre-order — ${name === "—" ? email : name}`.slice(0, 140),
      html: `<h2>New pre-order: ${escapeHtml(site.stackKit.name)}</h2>
        <table>
          <tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">Amount</td><td>$${escapeHtml(amount)} ${escapeHtml(currency)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">Name</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">Email</td><td>${escapeHtml(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#5b5a4d">Session</td><td>${escapeHtml(session.id ?? "")}</td></tr>
        </table>
        <p style="color:#5b5a4d">Founding pre-order — ships within ${site.stackKit.shipDays} days or auto-refund.</p>`,
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
