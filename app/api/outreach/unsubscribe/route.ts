import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { outreachStore } from "@/lib/outreach-store";

// One-click unsubscribe (RFC 8058) target for the List-Unsubscribe header on
// every autonomous send. Stateless token verification (no DB round-trip) —
// mail clients hit this automatically and expect a fast, reliable response.
// This is the mechanical fulfillment of the "reply 'unsubscribe' and I'll
// remove you" promise every outreach email makes, for the case where nobody
// is reading replies.
export const dynamic = "force-dynamic";

async function unsubscribe(token: string | null): Promise<{ ok: boolean; status: number; message: string }> {
  if (!token) return { ok: false, status: 400, message: "Missing unsubscribe token." };
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false, status: 400, message: "Invalid or expired unsubscribe link." };
  const updated = await outreachStore().setStatus(email, "unsubscribed");
  if (!updated) return { ok: false, status: 404, message: "Contact not found." };
  return { ok: true, status: 200, message: "You have been unsubscribed and will not receive further emails." };
}

// Mail clients (Gmail/Outlook one-click unsubscribe) POST this per RFC 8058.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const result = await unsubscribe(token);
  return NextResponse.json({ unsubscribed: result.ok }, { status: result.status });
}

// A human opening the link directly in a browser gets a plain confirmation page.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const result = await unsubscribe(token);
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>` +
      `<body style="font-family:system-ui;max-width:480px;margin:80px auto;padding:0 20px;color:#17180f">` +
      `<p>${result.message}</p></body>`,
    { status: result.status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
