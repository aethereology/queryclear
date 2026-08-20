import { NextResponse } from "next/server";
import { sendSocialDigest } from "@/lib/social/digest";
import { runEngage, runMetrics, runPublish, runResearch } from "@/lib/social/runtime";
import { verifySocialJobRequest } from "@/lib/social/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) {
  const rawBody = await request.text();
  if (!(await verifySocialJobRequest(request, rawBody))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { kind } = await context.params;
  try {
    if (kind === "research") return NextResponse.json(await runResearch());
    if (kind === "publish") return NextResponse.json(await runPublish());
    if (kind === "engage") return NextResponse.json(await runEngage());
    if (kind === "metrics") return NextResponse.json(await runMetrics());
    if (kind === "digest") return NextResponse.json(await sendSocialDigest());
    return NextResponse.json({ error: "Unknown social job." }, { status: 404 });
  } catch (error) {
    console.error("[social-job]", kind, error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Social job failed." }, { status: 500 });
  }
}
