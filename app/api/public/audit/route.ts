import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runAudit, AgentRuntimeError } from "@/lib/agent-runtime";
import { publicAuditConfig, publicAuditStore, summarize } from "@/lib/public-audit";

export const dynamic = "force-dynamic";

// Public org/domain the runtime meters audits against (a per-audit cost backstop
// beneath the web layer's daily cap). MUST equal QUERYCLEAR_DEV_ORG_ID on the
// agent-runtime project or every audit fails with BudgetExceeded.
const ORG_ID = process.env.PUBLIC_AUDIT_ORG_ID ?? "org_dev_queryclear";
const DOMAIN_ID = process.env.PUBLIC_AUDIT_DOMAIN_ID ?? "domain_dev_queryclear";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    fwd?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const cfg = publicAuditConfig();
  const store = publicAuditStore();

  const body = (await request.json().catch(() => ({}))) as { domainUrl?: string };
  const raw = (body.domainUrl ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Please enter a website URL." }, { status: 400 });
  }
  const domainUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

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
    await store.releaseSpend(cfg.costPerAuditUsd); // a failed audit shouldn't burn budget
    if (error instanceof AgentRuntimeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
