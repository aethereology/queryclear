import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runAudit, AgentRuntimeError } from "@/lib/agent-runtime";
import {
  publicAuditConfig,
  publicAuditStore,
  summarize,
  type PublicAuditStore,
} from "@/lib/public-audit";
import { normalizePublicAuditUrl, PublicAuditUrlError } from "@/lib/public-audit-url";

export const dynamic = "force-dynamic";

// Public org/domain the runtime meters audits against (a per-audit cost backstop
// beneath the web layer's daily cap). MUST equal QUERYCLEAR_DEV_ORG_ID on the
// agent-runtime project or every audit fails with BudgetExceeded.
const ORG_ID = process.env.PUBLIC_AUDIT_ORG_ID ?? "org_public_queryclear";
const DOMAIN_ID = process.env.PUBLIC_AUDIT_DOMAIN_ID ?? "domain_public_queryclear";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    fwd?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const cfg = publicAuditConfig();
  let store: PublicAuditStore;
  try {
    store = publicAuditStore();
  } catch {
    console.error("[public-audit] shared storage unavailable");
    return NextResponse.json(
      { error: "The preview is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const raw =
    body && typeof body === "object" && !Array.isArray(body) &&
    "domainUrl" in body && typeof body.domainUrl === "string"
      ? body.domainUrl.trim()
      : "";
  let domainUrl: string;
  try {
    domainUrl = normalizePublicAuditUrl(raw);
  } catch (error) {
    if (error instanceof PublicAuditUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  // Gate 1 — per-IP rate limit (abuse).
  const rl = await store.rateLimit(clientIp(request), cfg.ipLimit, cfg.ipWindowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "You've run a few audits already — please try again later." },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // Gate 2 — global daily spend cap. When hit, don't call OpenAI; offer email capture.
  const spend = await store.reserveSpend(cfg.costPerAuditUsd, cfg.dailyCapUsd);
  if (!spend.allowed) {
    return NextResponse.json({ gated: true, domainUrl });
  }

  try {
    // samples: 1 keeps the public audit well under the Vercel Hobby 60s cap.
    const report = await runAudit({
      orgId: ORG_ID,
      domainId: DOMAIN_ID,
      domainUrl,
      samples: 1
    });
    const token = randomUUID();
    await store.putReport(token, report, cfg.reportTtlMs);
    return NextResponse.json({ summary: summarize(token, report) });
  } catch (error) {
    // Once work may have reached the runtime, keep the reservation: a timeout or
    // malformed success response can still have consumed model budget upstream.
    if (error instanceof AgentRuntimeError && !error.costMayHaveBeenIncurred) {
      await store.releaseSpend(cfg.costPerAuditUsd).catch(() => undefined);
    }
    if (error instanceof AgentRuntimeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
