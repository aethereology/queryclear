#!/usr/bin/env node
// One-time/periodic migration: push a curated CSV of prospects into the cloud
// prospect queue (Redis, via /api/outreach `ingest-prospects`) so the
// autonomous cron (app/api/cron/outreach-send) has something to send from.
// This replaces feeding CSVs to the founder-run `tools/outreach-audit.mjs`
// batch mode for NEW cold sends — the autonomous cron owns sending now.
//
// Usage:
//   node --env-file=.env.local tools/ingest-prospects.mjs --file <csv>
//   node --env-file=.env.local tools/ingest-prospects.mjs --status
//
// Env:
//   OUTREACH_SECRET   (required) — must match the server's OUTREACH_SECRET
//   OUTREACH_BASE_URL (optional) — default http://localhost:3000
//
// CSV columns expected: email, website (-> domainUrl), business_name (optional),
// city (optional), vertical (optional). Same shape as the existing outreach
// leads CSVs in docs/marketing/outreach/leads/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { batchSize: 200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") out.file = argv[++i];
    else if (a === "--status") out.status = true;
    else if (a === "--batch-size") out.batchSize = Number(argv[++i]);
    else throw new Error(`Unknown flag: ${a}`);
  }
  return out;
}

// Same minimal CSV parser as tools/outreach-audit.mjs (handles quoted fields).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.length > 0)) rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const secret = process.env.OUTREACH_SECRET;
  if (!secret) {
    console.error("✖ OUTREACH_SECRET is not set. Run: node --env-file=.env.local tools/ingest-prospects.mjs");
    process.exit(1);
  }
  const baseUrl = (process.env.OUTREACH_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const call = async (payload) => {
    const res = await fetch(`${baseUrl}/api/outreach`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  };

  if (args.status) {
    const { queueDepth, quarantineCount, quarantineSample } = await call({ action: "queue-status" });
    console.log(`\nQueue depth: ${queueDepth}   Quarantined: ${quarantineCount}\n`);
    for (const q of quarantineSample) {
      console.log(`  • ${q.prospect.email}  [${q.reasons.join(", ")}]`);
    }
    console.log("");
    return;
  }

  if (!args.file) throw new Error("Pass --file <csv> or --status.");
  const csvPath = path.resolve(args.file);
  if (!fs.existsSync(csvPath)) {
    console.error(`✖ CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8")).filter((r) => r.website && r.email);
  const prospects = rows.map((r) => ({
    email: r.email,
    domainUrl: r.website,
    businessName: r.business_name || undefined,
    city: r.city || undefined,
    vertical: r.vertical || undefined,
    source: path.basename(csvPath),
  }));

  console.log(`\nIngesting ${prospects.length} row(s) from ${path.relative(projectRoot, csvPath)}\n`);

  let ingested = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  for (const batch of chunk(prospects, args.batchSize)) {
    const res = await call({ action: "ingest-prospects", prospects: batch });
    ingested += res.ingested;
    skippedDuplicate += res.skippedDuplicate;
    skippedInvalid += res.skippedInvalid;
  }

  console.log(`Done. ${ingested} ingested · ${skippedDuplicate} already-contacted/queued · ${skippedInvalid} invalid.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
