import { readJsonRequest } from "@/lib/json-request";
import { createHash, randomUUID } from "node:crypto";
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
export const maxDuration = 60;

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
  const respond = (body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) =>
    NextResponse.json({ ...body, requestId }, {
      status, headers: { "cache-control": "no-store", "x-request-id": requestId, ...headers },
    });
  const parsed = await readJsonRequest(request, 8_192);
  if (!parsed.ok) {
    logOutcome("invalid_request", parsed.status);
    return respond({ error: parsed.error }, parsed.status);
  }
  const attemptId = request.headers.get("x-audit-attempt");
  if (attemptId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    return respond({ error: "Refresh the page before trying again." }, 400);
  }
  const cfg = publicAuditConfig();
  let store: PublicAuditStore;
  try {
    store = publicAuditStore();
  } catch {
    logOutcome("storage_unavailable", 503);
    return respond({ error: "The preview is temporarily unavailable. Please try again later." }, 503);
  }

  const body: unknown = parsed.value;
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
      return respond({ error: error.message }, 400);
    }
    throw error;
  }

  const attemptKey = attemptId ? createHash("sha256").update(JSON.stringify([clientIp(request), domainUrl, attemptId])).digest("hex") : null;
  let claimed = false;
  let workStarted = false;
  let reserved = false;
  try {
    const rl = await store.rateLimit(clientIp(request), cfg.ipLimit, cfg.ipWindowMs);
    if (!rl.allowed) {
      logOutcome("rate_limited", 429);
      return respond({ error: "You've run a few audits already — please try again later." }, 429,
        { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) });
    }
    if (attemptKey) {
      const attempt = await store.claimAttempt(attemptKey, requestId);
      if (attempt === "pending") {
        logOutcome("attempt_pending", 409);
        return respond({ error: "This audit may still be running. Wait two minutes, then retry the same website to recover its result." }, 409, { "retry-after": "120" });
      }
      if (attempt !== "claimed") {
        const existing = await store.getReport(attempt.token);
        if (!existing) return respond({ error: "The saved result has expired. Submit again to start a new audit." }, 410);
        logOutcome("attempt_recovered", 200);
        return respond({ summary: summarize(attempt.token, existing), recovered: true });
      }
      claimed = true;
    }
    const spend = await store.reserveSpend(cfg.costPerAuditUsd, cfg.dailyCapUsd);
    if (!spend.allowed) {
      logOutcome("budget_gated", 200);
      return respond({ gated: true, domainUrl });
    }
    reserved = true;
    // samples: 1 keeps the public audit well under the Vercel Hobby 60s cap.
    workStarted = true;
    const report = await runAudit({
      orgId: ORG_ID,
      domainId: DOMAIN_ID,
      domainUrl,
      samples: 1
    });
    const token = randomUUID();
    await store.putReport(token, report, cfg.reportTtlMs);
    if (attemptKey) await store.finishAttempt(attemptKey, requestId, token, Math.min(cfg.reportTtlMs, 600_000)).catch(() => {
      logOutcome("recovery_cache_unavailable", 200);
    });
    logOutcome("success", 200);
    return respond({ summary: summarize(token, report) });
  } catch (error) {
    // Once work may have reached the runtime, keep the reservation: a timeout or
    // malformed success response can still have consumed model budget upstream.
    if (reserved && error instanceof AgentRuntimeError && !error.costMayHaveBeenIncurred) {
      workStarted = false;
      await store.releaseSpend(cfg.costPerAuditUsd).catch(() => undefined);
    }
    if (error instanceof AgentRuntimeError) {
      logOutcome("runtime_failure", error.status);
      return respond({ error: error.message }, error.status);
    }
    logOutcome("storage_or_unexpected_failure", 503);
    return respond({ error: "The preview is temporarily unavailable. Please try again later." }, 503);
  } finally {
    if (attemptKey && claimed && !workStarted) await store.releaseAttempt(attemptKey, requestId).catch(() => undefined);
  }
}
