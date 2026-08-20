// Guards the send-cap accounting and the report-link lifecycle — the two things
// that let outreach quietly over-send (cap leak) or quietly stop sending (report
// links expiring mid-cadence). Both were live defects found 2026-07-26.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadTs(relPath, stubs = {}) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    if (spec in stubs) return stubs[spec];
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { InMemoryOutreachStore } = loadTs("lib/outreach-store.ts", {
  "./outreach-store-redis": { RedisOutreachStore: class {} },
});

const FIXED = Date.parse("2026-07-26T12:00:00.000Z");
const newStore = () => new InMemoryOutreachStore(() => FIXED);

// ── send cap ────────────────────────────────────────────────────────────────

test("reserveSend enforces the cap", async () => {
  const s = newStore();
  for (let i = 0; i < 3; i++) {
    assert.equal((await s.reserveSend(1, 3)).allowed, true, `reservation ${i + 1} allowed`);
  }
  const over = await s.reserveSend(1, 3);
  assert.equal(over.allowed, false, "4th is refused");
  assert.equal(over.sentToday, 3);
});

test("reserveSend(0) peeks without consuming a slot", async () => {
  const s = newStore();
  await s.reserveSend(1, 2);
  const peek = await s.reserveSend(0, 2);
  assert.equal(peek.sentToday, 1, "peek reports the count");
  assert.equal((await s.reserveSend(1, 2)).allowed, true, "the free slot survived the peek");
});

// The cap leak: reserve happens BEFORE audit+QA, so every bail-out path must
// hand the slot back or quarantined mail permanently eats the day's budget.
test("releaseSend returns a reserved slot so a quarantine does not burn budget", async () => {
  const s = newStore();
  assert.equal((await s.reserveSend(1, 2)).allowed, true);
  assert.equal((await s.reserveSend(1, 2)).allowed, true);
  assert.equal((await s.reserveSend(1, 2)).allowed, false, "cap reached");

  await s.releaseSend(1); // pretend one of those was quarantined, never sent
  assert.equal((await s.reserveSend(1, 2)).allowed, true, "released slot is reusable");
});

test("releaseSend never drives the count below zero", async () => {
  const s = newStore();
  await s.releaseSend(5); // more releases than reservations
  const peek = await s.reserveSend(0, 10);
  assert.equal(peek.sentToday, 0, "clamped at zero, not negative");
});

// ── report-link lifecycle ───────────────────────────────────────────────────

test("setReportToken re-points touch 1 at a re-minted report", async () => {
  const s = newStore();
  await s.upsertContact({ email: "a@biz.com", domain: "biz.com", status: "cold" });
  await s.recordTouch("a@biz.com", { n: 1, type: "cold-audit", at: "x", reportToken: "old" });

  const updated = await s.setReportToken("a@biz.com", "fresh");
  assert.equal(updated.touches[0].reportToken, "fresh");
  assert.equal(updated.touches[0].n, 1, "the rest of the touch is preserved");
  assert.equal(updated.touches.length, 1, "no touch was added");
});

test("setReportToken is a no-op for a contact with no touches", async () => {
  const s = newStore();
  await s.upsertContact({ email: "b@biz.com", status: "cold" });
  assert.equal(await s.setReportToken("b@biz.com", "t"), null);
});

// The regression that quarantined 28 real prospects: the report TTL has to
// outlast the longest gap between two consecutive cadence steps, because every
// follow-up reuses touch 1's link.
test("report TTL outlasts the longest cadence gap", () => {
  const { outreachReportTtlMs } = loadTs("lib/outreach.ts", {
    "node:crypto": { randomUUID: () => "uuid" },
    "./agent-runtime": { runAudit: async () => ({}) },
    "./email": { renderOutreachAuditEmail: () => "", renderOutreachFollowupEmail: () => "" },
    "./public-audit": { publicAuditStore: () => ({}) },
    "./site": { site: { url: "https://www.queryclear.com", name: "queryclear" } },
  });
  const { NURTURE_FOLLOWUPS, COLD_FOLLOWUPS } = loadTs("lib/outreach-cadence.ts");

  const DAY_MS = 24 * 60 * 60 * 1000;
  const longestGapDays = Math.max(
    ...[...COLD_FOLLOWUPS, ...NURTURE_FOLLOWUPS].map((s) => s.afterDays),
  );
  assert.ok(
    outreachReportTtlMs() > longestGapDays * DAY_MS,
    `TTL ${outreachReportTtlMs() / DAY_MS}d must exceed the longest cadence gap ${longestGapDays}d`,
  );
});

// ── shared daily cap ────────────────────────────────────────────────────────

test("dailySendCap defaults conservatively and never reads as unlimited", () => {
  const { dailySendCap, DEFAULT_DAILY_SEND_CAP } = loadTs("lib/outreach-send.ts", {
    resend: { Resend: class {} },
    "./site": { site: { email: "hello@queryclear.com" } },
  });

  const prev = process.env.OUTREACH_DAILY_SEND_CAP;
  try {
    delete process.env.OUTREACH_DAILY_SEND_CAP;
    assert.equal(dailySendCap(), DEFAULT_DAILY_SEND_CAP, "unset → conservative default");

    process.env.OUTREACH_DAILY_SEND_CAP = "0";
    assert.equal(dailySendCap(), DEFAULT_DAILY_SEND_CAP, "0 is not 'unlimited'");

    process.env.OUTREACH_DAILY_SEND_CAP = "not-a-number";
    assert.equal(dailySendCap(), DEFAULT_DAILY_SEND_CAP, "junk falls back");

    process.env.OUTREACH_DAILY_SEND_CAP = "25";
    assert.equal(dailySendCap(), 25, "a real value is honoured");
  } finally {
    if (prev === undefined) delete process.env.OUTREACH_DAILY_SEND_CAP;
    else process.env.OUTREACH_DAILY_SEND_CAP = prev;
  }
});

// ── pause kill switch ───────────────────────────────────────────────────────
// Added 2026-08-20. There was no way to stop the autonomous sender short of a
// deploy, and the obvious guess (OUTREACH_DAILY_SEND_CAP=0) silently sends 10/day
// because every numeric knob falls back on `n > 0`. These cases pin the switch
// to string parsing so that trap can't come back.

test("sendingPaused only pauses on an explicit truthy string", () => {
  const { sendingPaused } = loadTs("lib/outreach-send.ts", {
    resend: { Resend: class {} },
    "./site": { site: { email: "hello@queryclear.com" } },
  });

  const prev = process.env.OUTREACH_PAUSED;
  try {
    delete process.env.OUTREACH_PAUSED;
    assert.equal(sendingPaused(), false, "unset → sending allowed (fail-open)");

    for (const v of ["true", "TRUE", " True ", "1", "yes"]) {
      process.env.OUTREACH_PAUSED = v;
      assert.equal(sendingPaused(), true, `${JSON.stringify(v)} pauses`);
    }
    for (const v of ["false", "0", "no", "", "off", "junk"]) {
      process.env.OUTREACH_PAUSED = v;
      assert.equal(sendingPaused(), false, `${JSON.stringify(v)} does not pause`);
    }
  } finally {
    if (prev === undefined) delete process.env.OUTREACH_PAUSED;
    else process.env.OUTREACH_PAUSED = prev;
  }
});

// The trap this switch exists to avoid: a zeroed cap is NOT a pause.
test("a zeroed send cap is not a pause — only OUTREACH_PAUSED is", () => {
  const { dailySendCap, sendingPaused, DEFAULT_DAILY_SEND_CAP } = loadTs("lib/outreach-send.ts", {
    resend: { Resend: class {} },
    "./site": { site: { email: "hello@queryclear.com" } },
  });

  const prevCap = process.env.OUTREACH_DAILY_SEND_CAP;
  const prevPause = process.env.OUTREACH_PAUSED;
  try {
    process.env.OUTREACH_DAILY_SEND_CAP = "0";
    delete process.env.OUTREACH_PAUSED;
    assert.equal(dailySendCap(), DEFAULT_DAILY_SEND_CAP, "cap=0 still sends the default");
    assert.equal(sendingPaused(), false, "cap=0 alone does not pause");

    process.env.OUTREACH_PAUSED = "true";
    assert.equal(sendingPaused(), true, "the switch is the only real stop");
  } finally {
    if (prevCap === undefined) delete process.env.OUTREACH_DAILY_SEND_CAP;
    else process.env.OUTREACH_DAILY_SEND_CAP = prevCap;
    if (prevPause === undefined) delete process.env.OUTREACH_PAUSED;
    else process.env.OUTREACH_PAUSED = prevPause;
  }
});
