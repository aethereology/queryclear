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
  const requestId = randomUUID();
  const startedAt = Date.now();
  const logOutcome = (outcome: string, status: number) => {
    console.info("[public-audit]", JSON.stringify({ requestId, outcome, status, durationMs: Date.now() - startedAt }));
  };
  const cfg = publicAuditConfig();
  let store: PublicAuditStore;
  try {
    store = publicAuditStore();
  } catch {
    console.error("[public-audit]", JSON.stringify({ requestId, outcome: "storage_unavailable", status: 503 }));
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
      logOutcome("invalid_url", 400);
      return NextResponse.json({ error: error.message, requestId }, { status: 400 });
    }
    throw error;
  }

  // Gate 1 — per-IP rate limit (abuse).
  const rl = await store.rateLimit(clientIp(request), cfg.ipLimit, cfg.ipWindowMs);
  if (!rl.allowed) {
    logOutcome("rate_limited", 429);
    return NextResponse.json(
      { error: "You've run a few audits already — please try again later." },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // Gate 2 — global daily spend cap. When hit, don't call OpenAI; offer email capture.
  const spend = await store.reserveSpend(cfg.costPerAuditUsd, cfg.dailyCapUsd);
  if (!spend.allowed) {
    logOutcome("budget_gated", 200);
    return NextResponse.json({ gated: true, domainUrl, requestId });
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
    logOutcome("success", 200);
    return NextResponse.json({ summary: summarize(token, report), requestId });
  } catch (error) {
    // Once work may have reached the runtime, keep the reservation: a timeout or
    // malformed success response can still have consumed model budget upstream.
    if (error instanceof AgentRuntimeError && !error.costMayHaveBeenIncurred) {
      await store.releaseSpend(cfg.costPerAuditUsd).catch(() => undefined);
    }
    if (error instanceof AgentRuntimeError) {
      logOutcome("runtime_failure", error.status);
      return NextResponse.json({ error: error.message, requestId }, { status: error.status });
    }
    console.error("[public-audit]", JSON.stringify({ requestId, outcome: "unexpected_failure", status: 500, durationMs: Date.now() - startedAt }));
    throw error;
  }
}
