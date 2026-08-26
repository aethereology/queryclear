import Stripe from "stripe";
import { site } from "@/lib/site";
import { normalizePublicAuditUrl } from "@/lib/public-audit-url";

export type CheckoutProduct = "ai-search-audit";

export interface VerifiedCheckoutSession {
  sessionId: string;
  product: CheckoutProduct;
  amountTotal: number;
  currency: string;
  paymentIntentId: string;
  customerEmail: string;
  customerName?: string;
  website: string;
  termsVersion: string;
  termsAcceptedAt: string;
  checkoutRequestId: string;
  checkoutCreatedAt: string;
}

const CHECKOUT_SESSION_ID = /^cs_(?:test_|live_)?[a-zA-Z0-9_]{8,200}$/;
const CHECKOUT_REQUEST_ID = /^[a-z\d_-]{20,120}$/i;

function normalizedCustomerEmail(value: string | null | undefined): string | null {
  const email = value?.trim();
  if (
    !email ||
    email.length > 254 ||
    /\s/.test(email) ||
    !/^[^@]+@[^@]+\.[^@]+$/.test(email)
  ) {
    return null;
  }
  return email;
}

function normalizedCustomerName(value: string | null | undefined): string | undefined {
  const name = value
    ?.replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return name || undefined;
}

function expandableId(value: string | { id: string } | null): string | null {
  const id = typeof value === "string" ? value : value?.id;
  return id && /^pi_[a-zA-Z0-9_]{8,200}$/.test(id) ? id : null;
}

/**
 * Pure fulfillment validator shared by the webhook and success-page verifier.
 * The signed webhook payload is authoritative, but it still has to match the
 * one currently enabled self-serve offer before it can create fulfillment.
 */
export function validateCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedProduct: CheckoutProduct,
  expectedSessionId?: string,
): VerifiedCheckoutSession | null {
  if (
    expectedProduct !== "ai-search-audit" ||
    !CHECKOUT_SESSION_ID.test(session.id) ||
    (expectedSessionId !== undefined && session.id !== expectedSessionId)
  ) {
    return null;
  }

  const termsAcceptedAtRaw = session.metadata?.terms_accepted_at ?? "";
  const termsAcceptedAt = Date.parse(termsAcceptedAtRaw);
  const checkoutRequestId = session.metadata?.checkout_request_id ?? "";
  const customerEmail = normalizedCustomerEmail(session.customer_details?.email);
  const paymentIntentId = expandableId(session.payment_intent);
  const created = Number(session.created);
  const checkoutCreatedAt = new Date(created * 1000);
  let website: string;
  try {
    const rawWebsite = session.custom_fields?.find(
      (field) => field.key === "website",
    )?.text?.value;
    website = normalizePublicAuditUrl(rawWebsite ?? "");
  } catch {
    return null;
  }

  if (
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid" ||
    session.metadata?.product !== expectedProduct ||
    session.metadata.terms_accepted !== "true" ||
    session.metadata.terms_version !== site.legal.termsVersion ||
    !Number.isFinite(termsAcceptedAt) ||
    termsAcceptedAt > Date.now() + 5 * 60 * 1000 ||
    termsAcceptedAt < checkoutCreatedAt.getTime() - 15 * 60 * 1000 ||
    termsAcceptedAt > checkoutCreatedAt.getTime() + 5 * 60 * 1000 ||
    !CHECKOUT_REQUEST_ID.test(checkoutRequestId) ||
    session.amount_total !== site.auditProduct.unitAmount ||
    session.currency?.toLowerCase() !== site.auditProduct.currency.toLowerCase() ||
    !paymentIntentId ||
    !customerEmail ||
    !Number.isFinite(created) ||
    created <= 0 ||
    Number.isNaN(checkoutCreatedAt.getTime())
  ) {
    return null;
  }

  return {
    sessionId: session.id,
    product: expectedProduct,
    amountTotal: session.amount_total,
    currency: session.currency.toUpperCase(),
    paymentIntentId,
    customerEmail,
    customerName: normalizedCustomerName(session.customer_details?.name),
    website,
    termsVersion: session.metadata.terms_version,
    termsAcceptedAt: new Date(termsAcceptedAt).toISOString(),
    checkoutRequestId,
    checkoutCreatedAt: checkoutCreatedAt.toISOString(),
  };
}

/**
 * Server-only purchase confirmation. Browser query strings are never treated as
 * proof: the session is retrieved from Stripe and checked against the expected
 * product, amount, currency, recorded assent, and paid/complete state.
 */
export async function verifyCheckoutSession(
  sessionId: string | undefined,
  expectedProduct: CheckoutProduct,
): Promise<VerifiedCheckoutSession | null> {
  if (!sessionId || !CHECKOUT_SESSION_ID.test(sessionId)) return null;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;

  let session: Stripe.Checkout.Session;
  try {
    session = await new Stripe(key).checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }

  return validateCheckoutSession(session, expectedProduct, sessionId);
}
