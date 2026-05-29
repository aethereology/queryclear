import { NextResponse } from "next/server";

// Lead capture endpoint.
// Phase 1: validate + log on the server. Delivery (email via Resend, or a CRM)
// is a fast follow — see Decisions.md. We never silently drop a lead.

type Lead = {
  name?: string;
  email?: string;
  website?: string;
  business?: string;
  service?: string;
  city?: string;
  message?: string;
};

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  let body: Lead;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Please add your name." }, { status: 422 });
  }
  if (!isEmail(body.email)) {
    return NextResponse.json({ error: "Please add a valid email." }, { status: 422 });
  }
  if (!body.website?.trim()) {
    return NextResponse.json({ error: "Please add your website URL." }, { status: 422 });
  }

  // TODO(delivery): wire to email/CRM. For now, ensure the lead is recorded in
  // server logs so nothing is lost before delivery is connected.
  console.log("[lead]", JSON.stringify({ ...body, at: new Date().toISOString() }));

  return NextResponse.json({ ok: true });
}
