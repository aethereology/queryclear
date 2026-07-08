#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const VALID_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,6}$/;
const BAD_EMAIL_RE =
  /(^your@email\.com$|@example\.com|godaddy|noreply|no-reply|do-not-reply|reply\.google\.com|mailer-daemon|accounts?@|privacy@|compliance@|careers?@|jobs?@|hr@|billing@|notifications?@)/i;

function parseArgs(argv) {
  const args = {
    input: path.resolve("docs/marketing/outreach/leads/raw-2026-07-07-medspa-georgia.json"),
    csvOutput: path.resolve("docs/marketing/outreach/leads/2026-07-07-medspa-georgia.csv"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = path.resolve(argv[++i]);
    else if (arg === "--csv-output") args.csvOutput = path.resolve(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node tools/enrich-firecrawl-leads-from-web.mjs [--input <raw.json>] [--csv-output <file.csv>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function encodeCsvField(value) {
  const string = value == null ? "" : String(value).trim();
  if (string.includes(",") || string.includes("\"") || string.includes("\n")) {
    return `"${string.replace(/"/g, "\"\"")}"`;
  }
  return string;
}

function normalizeDomain(rawUrl) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function sanitizeEmails(values) {
  return [...new Set(values)]
    .map((email) => email.trim().replace(/^mailto:/i, "").replace(/[),.;:\s]+$/g, ""))
    .filter((email) => VALID_EMAIL_RE.test(email))
    .filter((email) => !BAD_EMAIL_RE.test(email))
    .filter((email) => !/\.(png|jpe?g|gif|svg|webp)$/i.test(email));
}

function extractEmails(text) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return sanitizeEmails(matches);
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let match = hrefRe.exec(html);
  const baseDomain = normalizeDomain(baseUrl);

  while (match) {
    const href = match[1];
    if (!/contact|about|location|book|consult/i.test(href)) {
      match = hrefRe.exec(html);
      continue;
    }
    try {
      const url = href.startsWith("http") ? new URL(href) : new URL(href, baseUrl);
      const value = url.toString();
      if (normalizeDomain(value) === baseDomain && !/\.(png|jpe?g|gif|svg|webp|pdf)(\?|$)/i.test(value)) {
        links.add(value);
      }
    } catch {
      // ignore invalid links
    }
    match = hrefRe.exec(html);
  }

  try {
    const root = new URL(baseUrl);
    for (const pathname of ["/contact", "/contact-us", "/about", "/locations"]) {
      links.add(new URL(pathname, root).toString());
    }
  } catch {
    // ignore
  }

  return [...links].slice(0, 5);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; queryclear-lead-enricher/1.0)",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function chooseBestEmail(emails, website) {
  const domain = normalizeDomain(website);
  const exact = emails.find((email) => email.toLowerCase().endsWith(`@${domain}`));
  return exact ?? emails[0] ?? "";
}

function isOutreachReady(row) {
  const domain = normalizeDomain(row.website ?? "");
  if (!row.goodFit || !row.hasEmail) return false;
  if (/github\.io$/i.test(domain)) return false;
  if (/(^|\.)booksy\.com$/i.test(domain)) return false;
  return true;
}

async function enrichRow(row) {
  if (!row.goodFit || !row.website) return row;

  const seedEmails = sanitizeEmails([...(row.emails ?? []), row.bestEmail ?? ""]);
  if (seedEmails.length > 0) {
    return {
      ...row,
      emails: seedEmails,
      bestEmail: chooseBestEmail(seedEmails, row.website),
      hasEmail: true,
    };
  }

  const home = await fetchText(row.website);
  const homeEmails = extractEmails(home);
  let allEmails = [...homeEmails];

  if (allEmails.length === 0 && home) {
    const links = extractLinks(home, row.website);
    for (const link of links) {
      const text = await fetchText(link);
      const emails = extractEmails(text);
      if (emails.length > 0) {
        allEmails = emails;
        break;
      }
    }
  }

  const merged = sanitizeEmails([...(row.emails ?? []), ...allEmails]);
  const bestEmail = chooseBestEmail(merged, row.website);
  return {
    ...row,
    emails: merged,
    bestEmail,
    hasEmail: Boolean(bestEmail),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const enriched = [];

  for (const row of rows) {
    enriched.push(await enrichRow(row));
  }

  fs.writeFileSync(args.input, JSON.stringify(enriched, null, 2) + "\n", "utf8");

  const csvLines = ["business_name,website,email,city"];
  const outreachRows = enriched
    .filter((row) => isOutreachReady(row))
    .sort(
      (a, b) =>
        String(a.city ?? "").localeCompare(String(b.city ?? "")) ||
        String(a.business_name ?? a.title ?? "").localeCompare(String(b.business_name ?? b.title ?? "")),
    );

  for (const row of outreachRows) {
    csvLines.push(
      [
        encodeCsvField(row.business_name ?? row.title),
        encodeCsvField(row.website),
        encodeCsvField(row.bestEmail),
        encodeCsvField(row.city),
      ].join(","),
    );
  }

  fs.mkdirSync(path.dirname(args.csvOutput), { recursive: true });
  fs.writeFileSync(args.csvOutput, csvLines.join("\n") + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        total: enriched.length,
        outreachRows: outreachRows.length,
        csvOutput: args.csvOutput,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
