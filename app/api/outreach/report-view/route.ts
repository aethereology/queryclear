import { NextResponse } from "next/server";
import { after } from "next/server";
import { handleOutreachReportView } from "@/lib/outreach-open";

export const dynamic = "force-dynamic";

const TOKEN = /^[a-zA-Z0-9-]{16,128}$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof body.token === "string" ? body.token : "";

  // Return the same response for malformed, expired, and valid tokens so this
  // endpoint cannot be used to enumerate live outreach reports.
  if (TOKEN.test(token)) {
    after(async () => {
      try {
        await handleOutreachReportView(token);
      } catch {
        // Best-effort signal; a failed acknowledgement never affects the report.
      }
    });
  }

  return NextResponse.json({ accepted: true }, { status: 202 });
}
