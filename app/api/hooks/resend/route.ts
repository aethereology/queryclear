import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { outreachStore } from "@/lib/outreach-store";

// Resend bounce/complaint webhook — the deliverability circuit-breaker for
// unattended sending. A bounce or spam complaint flips the contact to
// terminal "bounced" so the autonomous cron never touches it again. Without
// this, autonomous sending has no way to learn a send failed.
export const dynamic = "force-dynamic";

// Resend signs webhooks the Svix way: base64(HMAC-SHA256(secret,
// "{id}.{timestamp}.{body}")), checked against one of the space-separated
// "v1,<sig>" entries in svix-signature. This is the documented algorithm,
// implemented directly with node:crypto rather than pulling in the svix SDK
// for one check.
function verifySignature(body: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${body}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest();

  return signatureHeader.split(" ").some((entry) => {
    const [, sig] = entry.split(",");
    if (!sig) return false;
    try {
      const given = Buffer.from(sig, "base64");
      return given.length === expected.length && timingSafeEqual(given, expected);
    } catch {
      return false;
    }
  });
}

interface ResendWebhookEvent {
  type?: string;
  data?: { to?: string[] | string; email?: string };
}

function recipientEmail(payload: ResendWebhookEvent): string | null {
  const to = payload.data?.to;
  if (Array.isArray(to) && to.length) return to[0];
  if (typeof to === "string") return to;
  if (typeof payload.data?.email === "string") return payload.data.email;
  return null;
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!verifySignature(body, request.headers)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(body) as ResendWebhookEvent;
  const email = recipientEmail(payload);

  if (email && (payload.type === "email.bounced" || payload.type === "email.complained")) {
    await outreachStore().setStatus(email, "bounced");
  }

  return NextResponse.json({ received: true });
}
