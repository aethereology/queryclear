import { get } from "@vercel/blob";
import type { AuditReport } from "@/lib/audit-report";

const MAX_REPORT_BYTES = 1_000_000;
const LAYER_IDS = new Set([
  "entity-clarity",
  "service-specificity",
  "proof-density",
  "local-relevance",
  "answer-coverage",
  "machine-readability",
  "conversion-path",
]);
const SEVERITIES = new Set(["Critical", "High", "Medium"]);
const EFFORTS = new Set(["Low", "Medium", "High"]);
const OBSERVATION_TYPES = new Set(["live", "modeled", "manual"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrivateAuditReport(value: unknown, slug: string): value is AuditReport {
  if (!isRecord(value)) return false;
  const visibilityTests = value.visibilityTests;
  const scorecard = value.scorecard;
  const fixes = value.fixes;
  const machineView = value.machineView;
  return (
    value.slug === slug &&
    value.demo === false &&
    value.variant === "client" &&
    typeof value.business === "string" && value.business.trim().length > 0 &&
    typeof value.market === "string" && value.market.trim().length > 0 &&
    typeof value.scoreAfter === "number" &&
    Number.isFinite(value.scoreAfter) && value.scoreAfter >= 0 && value.scoreAfter <= 100 &&
    Array.isArray(visibilityTests) &&
    visibilityTests.length > 0 &&
    visibilityTests.every(
      (item) =>
        isRecord(item) &&
        typeof item.prompt === "string" && item.prompt.trim().length > 0 &&
        typeof item.result === "string" && item.result.trim().length > 0 &&
        typeof item.note === "string" && item.note.trim().length > 0 &&
        typeof item.engine === "string" && item.engine.trim().length > 0 &&
        typeof item.observedAt === "string" && !Number.isNaN(Date.parse(item.observedAt)) &&
        typeof item.accessMethod === "string" && item.accessMethod.trim().length > 0 &&
        typeof item.observationType === "string" &&
        OBSERVATION_TYPES.has(item.observationType),
    ) &&
    Array.isArray(scorecard) &&
    scorecard.length === LAYER_IDS.size &&
    new Set(scorecard.map((item) => (isRecord(item) ? item.layer : undefined))).size === LAYER_IDS.size &&
    scorecard.every(
      (item) =>
        isRecord(item) &&
        typeof item.layer === "string" && LAYER_IDS.has(item.layer) &&
        typeof item.score === "number" && Number.isFinite(item.score) &&
        item.score >= 0 && item.score <= 10 &&
        typeof item.finding === "string",
    ) &&
    Array.isArray(fixes) &&
    fixes.every(
      (item) =>
        isRecord(item) &&
        typeof item.sev === "string" && SEVERITIES.has(item.sev) &&
        typeof item.title === "string" &&
        typeof item.layer === "string" &&
        typeof item.why === "string" &&
        typeof item.fix === "string" &&
        typeof item.effort === "string" && EFFORTS.has(item.effort),
    ) &&
    isRecord(machineView) &&
    Array.isArray(machineView.before) && machineView.before.every((line) => typeof line === "string") &&
    typeof machineView.beforeNote === "string" &&
    Array.isArray(machineView.after) &&
    machineView.after.every(
      (item) => isRecord(item) && typeof item.k === "string" && typeof item.v === "string",
    ) &&
    typeof machineView.afterNote === "string"
  );
}

/**
 * Real client reports live in Vercel Blob with private access. They are never
 * imported into the application bundle or committed to the repository.
 */
export async function getPrivateReport(slug: string): Promise<AuditReport | null> {
  if (!/^[a-z0-9][a-z0-9-]{2,160}$/i.test(slug)) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return null;

  try {
    const result = await get(`reports/${slug}.json`, {
      access: "private",
      useCache: false,
    });
    if (!result?.stream || (result.blob.size ?? 0) > MAX_REPORT_BYTES) return null;
    const raw = await new Response(result.stream).text();
    if (Buffer.byteLength(raw, "utf8") > MAX_REPORT_BYTES) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPrivateAuditReport(parsed, slug) ? parsed : null;
  } catch {
    return null;
  }
}
