#!/usr/bin/env node
// Cold-outreach batch runner. Reads a CSV of prospects and, for each NEW one (deduped
// against the server-side masterlist), calls /api/outreach to run a read-only audit
// and either PREVIEW (default — writes the rendered email to an HTML file you review)
// or SEND (--send — emails the prospect; the server records the contact so reruns
// never double-send).
//
// Thin HTTP driver: all audit/render/send/dedup logic lives in the API route + lib/.
//
// Usage:
//   node --env-file=.env.local tools/outreach-audit.mjs [flags]
//   node --env-file=.env.local tools/outreach-audit.mjs --list
//   node --env-file=.env.local tools/outreach-audit.mjs --mark someone@biz.com replied
//
// Env:
//   OUTREACH_SECRET   (required) — must match the server's OUTREACH_SECRET
//   OUTREACH_BASE_URL (optional) — default http://localhost:3000
//
// Flags:
//   --file <path>   CSV to read (default docs/marketing/outreach/leads/medspa.csv)
//   --send          actually send (default is preview-only)
//   --limit <n>     process at most n NEW rows
//   --only <text>   only rows whose website/business contains <text>
//   --delay <ms>    delay between rows (default 4000)
//   --list          print the masterlist and exit
//   --mark <email> <status>   set a contact's status and exit
//                   (cold|opened|replied|unsubscribed|bounced|customer)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { send: false, delay: 4000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--send") out.send = true;
    else if (a === "--file") out.file = argv[++i];
    else if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "--only") out.only = argv[++i];
    else if (a === "--delay") out.delay = Number(argv[++i]);
    else if (a === "--list") out.list = true;
    else if (a === "--mark") {
      out.mark = { email: argv[++i], status: argv[++i] };
    } else throw new Error(`Unknown flag: ${a}`);
  }
  return out;
}

// Minimal CSV parser (handles quoted fields with commas/newlines).
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

function slug(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeClient(baseUrl, secret) {
  return async function call(payload) {
    const res = await fetch(`${baseUrl}/api/outreach`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const secret = process.env.OUTREACH_SECRET;
  if (!secret) {
    console.error("✖ OUTREACH_SECRET is not set. Run: node --env-file=.env.local tools/outreach-audit.mjs");
    process.exit(1);
  }
  const baseUrl = (process.env.OUTREACH_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const call = makeClient(baseUrl, secret);

  // ── --list: print the masterlist ─────────────────────────────────────────────
  if (args.list) {
    const { contacts } = await call({ action: "list" });
    contacts.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    console.log(`\nMasterlist — ${contacts.length} contact(s)\n`);
    for (const c of contacts) {
      console.log(
        `  ${c.status.padEnd(12)} ${(c.email ?? "").padEnd(34)} ${c.touches?.length ?? 0} touch(es)  ${c.domain ?? ""}`,
      );
    }
    console.log("");
    return;
  }

  // ── --mark: set a contact's status ───────────────────────────────────────────
  if (args.mark) {
    const { email, status } = args.mark;
    const { contact } = await call({ action: "set-status", email, status });
    console.log(`✓ ${contact.email} → ${contact.status}`);
    return;
  }

  // ── batch run ────────────────────────────────────────────────────────────────
  const csvPath = args.file
    ? path.resolve(args.file)
    : path.join(projectRoot, "docs/marketing/outreach/leads/medspa.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`✖ CSV not found: ${csvPath}`);
    process.exit(1);
  }
  const sourceCsv = path.basename(csvPath);

  const outDir = path.join(projectRoot, "docs/marketing/outreach/previews");
  fs.mkdirSync(outDir, { recursive: true });

  let rows = parseCsv(fs.readFileSync(csvPath, "utf8")).filter((r) => r.website && r.email);
  if (args.only) {
    const needle = args.only.toLowerCase();
    rows = rows.filter(
      (r) => r.website.toLowerCase().includes(needle) || (r.business_name ?? "").toLowerCase().includes(needle),
    );
  }

  // Dedup against the masterlist before doing anything expensive.
  const { results } = await call({ action: "check", emails: rows.map((r) => r.email) });
  const statusByEmail = new Map(results.map((x) => [x.email, x.status]));
  const isFresh = (r) => statusByEmail.get(r.email.trim().toLowerCase()) == null;
  const already = rows.filter((r) => !isFresh(r));
  let fresh = rows.filter(isFresh);
  if (args.limit) fresh = fresh.slice(0, args.limit);

  console.log(
    `\n${args.send ? "SEND" : "PREVIEW"} mode · ${csvPath}\n` +
      `  ${fresh.length} new · ${already.length} already-contacted (skipped)\n` +
      (args.send ? "" : "  (no emails will be sent — review the HTML, then re-run with --send)\n"),
  );

  const manifest = [];
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < fresh.length; i++) {
    const r = fresh[i];
    const label = `${r.business_name || r.website} <${r.email}>`;
    process.stdout.write(`  • ${label} … `);
    try {
      const data = await call({
        action: "send-cold",
        domainUrl: r.website,
        email: r.email,
        businessName: r.business_name || undefined,
        city: r.city || undefined,
        vertical: r.vertical || undefined,
        sourceCsv,
        mode: args.send ? "send" : "preview",
      });
      if (data.skipped) {
        console.log(`skipped (${data.skipped})`);
      } else if (args.send) {
        console.log(`sent ✓  ${data.reportUrl ?? ""}`);
        ok++;
      } else {
        const file = `${slug(r.website)}.html`;
        fs.writeFileSync(path.join(outDir, file), data.html ?? "");
        manifest.push({ file, label, subject: data.subject ?? "", reportUrl: data.reportUrl ?? "" });
        console.log(`preview → ${file}`);
        ok++;
      }
    } catch (err) {
      console.log(`FAILED — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
    if (i < fresh.length - 1 && args.delay > 0) await sleep(args.delay);
  }

  if (!args.send && manifest.length) {
    const indexHtml =
      `<!doctype html><meta charset="utf-8"><title>Outreach previews</title>` +
      `<body style="font-family:system-ui;max-width:720px;margin:40px auto;padding:0 16px">` +
      `<h1>Outreach previews (${manifest.length})</h1><ol>` +
      manifest
        .map(
          (m) =>
            `<li style="margin:10px 0"><a href="./${m.file}">${m.label}</a><br>` +
            `<small style="color:#666">${m.subject}</small><br>` +
            `<small style="color:#666">report: ${m.reportUrl}</small></li>`,
        )
        .join("") +
      `</ol></body>`;
    fs.writeFileSync(path.join(outDir, "index.html"), indexHtml);
    console.log(`\n  manifest → docs/marketing/outreach/previews/index.html`);
  }

  console.log(`\nDone. ${ok} ok · ${failed} failed.\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
