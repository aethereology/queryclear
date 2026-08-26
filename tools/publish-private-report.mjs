import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const [, , fileArg, ...flags] = process.argv;
if (!fileArg) {
  throw new Error(
    "Usage: node --env-file=.env.local tools/publish-private-report.mjs <report.json> [--days 7] [--overwrite]",
  );
}

const daysIndex = flags.indexOf("--days");
const days = daysIndex >= 0 ? Number(flags[daysIndex + 1]) : 7;
if (!Number.isInteger(days) || days < 1 || days > 30) {
  throw new Error("--days must be a whole number from 1 through 30.");
}

const secret = process.env.REPORT_ACCESS_SECRET ?? "";
if (secret.length < 32) throw new Error("REPORT_ACCESS_SECRET must be at least 32 characters.");
if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
  throw new Error("BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID is required.");
}

const absoluteFile = path.resolve(fileArg);
const raw = await readFile(absoluteFile, "utf8");
if (Buffer.byteLength(raw, "utf8") > 1_000_000) throw new Error("Report exceeds 1 MB.");

const report = JSON.parse(raw);
const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
const layers = new Set([
  "entity-clarity",
  "service-specificity",
  "proof-density",
  "local-relevance",
  "answer-coverage",
  "machine-readability",
  "conversion-path",
]);
const observationTypes = new Set(["live", "modeled", "manual"]);
const scorecardLayers = new Set(
  Array.isArray(report?.scorecard) ? report.scorecard.map((item) => item?.layer) : [],
);
if (
  !isRecord(report) ||
  !/^[a-z0-9][a-z0-9-]{2,160}$/i.test(report.slug ?? "") ||
  report.demo !== false ||
  report.variant !== "client" ||
  typeof report.business !== "string" || !report.business.trim() ||
  typeof report.market !== "string" || !report.market.trim() ||
  typeof report.scoreAfter !== "number" || !Number.isFinite(report.scoreAfter) ||
  report.scoreAfter < 0 || report.scoreAfter > 100 ||
  !Array.isArray(report.visibilityTests) ||
  report.visibilityTests.length === 0 ||
  !report.visibilityTests.every(
    (item) => isRecord(item) &&
      [item.prompt, item.result, item.note, item.engine, item.observedAt, item.accessMethod]
        .every((field) => typeof field === "string" && field.trim().length > 0) &&
      !Number.isNaN(Date.parse(item.observedAt)) &&
      observationTypes.has(item.observationType),
  ) ||
  !Array.isArray(report.scorecard) || report.scorecard.length !== layers.size ||
  scorecardLayers.size !== layers.size ||
  !report.scorecard.every(
    (item) => isRecord(item) && layers.has(item.layer) &&
      typeof item.score === "number" && Number.isFinite(item.score) &&
      item.score >= 0 && item.score <= 10 && typeof item.finding === "string",
  ) ||
  !Array.isArray(report.fixes) ||
  !report.fixes.every(
    (item) => isRecord(item) && ["Critical", "High", "Medium"].includes(item.sev) &&
      [item.title, item.layer, item.why, item.fix].every((field) => typeof field === "string") &&
      ["Low", "Medium", "High"].includes(item.effort),
  ) ||
  !isRecord(report.machineView) ||
  !Array.isArray(report.machineView.before) ||
  !report.machineView.before.every((line) => typeof line === "string") ||
  typeof report.machineView.beforeNote !== "string" ||
  !Array.isArray(report.machineView.after) ||
  !report.machineView.after.every(
    (item) => isRecord(item) && typeof item.k === "string" && typeof item.v === "string",
  ) ||
  typeof report.machineView.afterNote !== "string"
) {
  throw new Error("Report JSON is missing required client-report fields.");
}

await put(`reports/${report.slug}.json`, JSON.stringify(report), {
  access: "private",
  addRandomSuffix: false,
  allowOverwrite: flags.includes("--overwrite"),
  cacheControlMaxAge: 60,
  contentType: "application/json",
});

const expiresAt = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
const signature = createHmac("sha256", secret)
  .update(`v1:${report.slug}:${expiresAt}`)
  .digest("base64url");
const token = `v1.${expiresAt}.${signature}`;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.queryclear.com").replace(/\/$/, "");

process.stdout.write(
  `${siteUrl}/api/reports/access?slug=${encodeURIComponent(report.slug)}&access=${encodeURIComponent(token)}\n`,
);
