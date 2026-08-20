import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("report GET does not treat link-scanner traffic as a human open", () => {
  const page = source("app/r/[token]/page.tsx");
  assert.doesNotMatch(page, /markViewedOnce|handleOutreachReportView/);
  assert.match(page, /OutreachOpenTracker/);
});

test("client requires a visible ten-second dwell before signaling engagement", () => {
  const tracker = source("components/OutreachOpenTracker.tsx");
  assert.match(tracker, /MEANINGFUL_VIEW_MS\s*=\s*10_000/);
  assert.match(tracker, /document\.visibilityState\s*!==\s*"visible"/);
  assert.match(tracker, /\/api\/outreach\/report-view/);
});

test("first-view workflow is idempotent and only acknowledges before another follow-up", () => {
  const handler = source("lib/outreach-open.ts");
  assert.match(handler, /markViewedOnce/);
  assert.match(handler, /openedContact\.touches\.length\s*!==\s*1/);
  assert.match(handler, /reserveSend\(1,\s*dailySendCap\(\)\)/);
  assert.match(handler, /qaSend/);
  assert.match(handler, /:\s*20;/, "defaults to a 20-minute delay");
  assert.match(handler, /scheduledAt/, "uses provider-side scheduling");
  assert.match(handler, /type:\s*"opened-ack"/);
});
