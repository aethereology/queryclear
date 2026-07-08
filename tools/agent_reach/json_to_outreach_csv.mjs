#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log(`Usage: node json_to_outreach_csv.mjs --input <file.json> --output <file.csv>

Converts a raw Agent-Reach JSON prospect dump into a queryclear outreach CSV.
The output CSV will have the exact header: business_name,website,email,city

Options:
  --input <file.json>   Required input JSON file path
  --output <file.csv>   Required output CSV file path
  --force               Write output even if email or website fields are missing
`);
}

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--output") args.output = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage();
      process.exit(1);
    }
  }
  if (!args.input || !args.output) {
    usage();
    process.exit(1);
  }
  return args;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function encodeCsvField(value) {
  if (value == null) return "";
  const string = String(value).trim();
  if (string.includes(",") || string.includes("\"") || string.includes("\n")) {
    return `"${string.replace(/"/g, '""')}"`;
  }
  return string;
}

function guessField(record, candidates) {
  for (const candidate of candidates) {
    if (typeof record[candidate] === "string" && record[candidate].trim().length > 0) {
      return record[candidate].trim();
    }
  }
  return "";
}

function normalizeUrl(raw) {
  if (typeof raw !== "string") return "";
  let url = raw.trim();
  if (!url) return "";
  if (url.startsWith("www.")) url = `https://${url}`;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

const args = parseArgs(process.argv.slice(2));
const data = JSON.parse(fs.readFileSync(args.input, "utf-8"));
const rows = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];

if (!rows.length) {
  console.error("No prospect records found in the input JSON.");
  process.exit(1);
}

const output = [];
let skipped = 0;
let incomplete = 0;

for (const item of rows) {
  const businessName = guessField(item, [
    "business_name",
    "businessName",
    "company",
    "name",
    "title",
    "organization",
  ]);
  const website = normalizeUrl(guessField(item, ["website", "url", "domain", "site", "company_website"]));
  const email = guessField(item, ["email", "email_address", "contact_email", "emailAddress", "contactEmail", "email1"]);
  const city = guessField(item, ["city", "location", "city_name", "region", "state", "municipality"]);

  if (!businessName && !website && !email && !city) {
    skipped += 1;
    continue;
  }

  const validEmail = isValidEmail(email);
  if (!validEmail && !args.force) {
    skipped += 1;
    continue;
  }

  output.push({ businessName, website, email, city });
  if (!validEmail) incomplete += 1;
}

if (!output.length) {
  console.error("No valid prospect rows were converted. Check the input JSON and field mapping.");
  process.exit(1);
}

const csvLines = ["business_name,website,email,city"];
for (const row of output) {
  csvLines.push([
    encodeCsvField(row.businessName),
    encodeCsvField(row.website),
    encodeCsvField(row.email),
    encodeCsvField(row.city),
  ].join(","));
}

const outputPath = path.resolve(args.output);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, csvLines.join("\n") + "\n", "utf-8");

console.log(`Converted ${output.length} rows to ${outputPath}.`);
if (skipped > 0) console.log(`Skipped ${skipped} rows with missing or invalid data.`);
if (incomplete > 0) console.log(`Note: ${incomplete} rows were included with non-standard emails because --force was used.`);
