import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSession, verifyCsrf } from "@/lib/social/security";
import { ownerAuditHistory } from "@/lib/owner-audits";
import { publicAuditConfig, publicAuditStore } from "@/lib/public-audit";
import { POST as runAudit } from "@/app/api/public/audit/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" } });
async function session() { return (await cookies()).get("social_admin")?.value ?? ""; }
export async function GET(request: Request) {
  if (!verifyAdminSession(await session())) return respond({ error: "Sign in to access owner audits." }, 401);
  try {
    const history = await ownerAuditHistory().list();
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return respond({ history });
    if (!history.some(entry => entry.token === token)) return respond({ error: "This report is unavailable or has expired. Run a fresh audit." }, 404);
    const report = await publicAuditStore().getReport(token);
    return report ? respond({ report }) : respond({ error: "This report has expired. Run a fresh audit." }, 404);
  } catch { return respond({ error: "Recent audits are temporarily unavailable. Try again shortly." }, 503); }
}
export async function POST(request: Request) {
  const value = await session();
  if (!verifyAdminSession(value)) return respond({ error: "Your session has expired. Sign in again." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin || !verifyCsrf(value, request.headers.get("x-owner-csrf") ?? "")) return respond({ error: "Refresh the page before trying again." }, 403);
  // Reuse URL validation, shared rate limits, cost reservations and runtime diagnostics.
  const result = await runAudit(request);
  if (!result.ok) return result;
  const body = await result.json();
  if (body.gated) return respond({ error: "The daily audit allowance has been reached. Try again tomorrow.", requestId: body.requestId }, 429);
  try {
    const report = await publicAuditStore().getReport(body.summary.token);
    if (!report) throw new Error("Report unavailable");
    const recordedAt = report.audited_at ? Date.parse(report.audited_at) : NaN;
    const createdAt = Number.isFinite(recordedAt) ? Math.min(recordedAt, Date.now()) : Date.now();
    const entry = { token: body.summary.token, domainUrl: report.domain_url, createdAt, expiresAt: createdAt + publicAuditConfig().reportTtlMs };
    let historySaved = true;
    try { await ownerAuditHistory().add(entry); } catch { historySaved = false; }
    return respond({ report, entry, historySaved, requestId: body.requestId });
  } catch { return respond({ error: "The audit finished, but its report could not be loaded. Try again shortly.", requestId: body.requestId }, 503); }
}
