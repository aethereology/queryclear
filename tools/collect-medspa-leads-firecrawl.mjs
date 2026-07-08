#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SEARCH_ENDPOINT = "https://api.firecrawl.dev/v1/search";
const SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const PROJECT_ROOT = process.cwd();
const DEFAULT_CITIES = [
  "Atlanta",
  "Sandy Springs",
  "Alpharetta",
  "Roswell",
  "Marietta",
  "Decatur",
  "Savannah",
  "Augusta",
  "Athens",
  "Macon",
  "Columbus",
];
const SEARCH_TERMS = ["med spa", "medical spa", "aesthetics"];
const SKIP_DOMAIN_RE =
  /(^|\.)((instagram|facebook|linkedin|yelp|groupon|vagaro|fresha|styleseat|classpass|mapquest|yellowpages|whatclinic|spafinder|realself|allure|alle|youtube|tiktok|x|booksy)\.com)$/i;
const BAD_TITLE_RE =
  /\b(hotel|resort|marriott|massage envy|school|academy|training|supply|jobs?|career|dermatopathology|hospital)\b/i;
const BAD_EMAIL_RE =
  /(^your@email\.com$|@example\.com|godaddy|noreply|no-reply|do-not-reply|reply\.google\.com|mailer-daemon|accounts?@|privacy@|compliance@|careers?@|jobs?@|hr@|billing@|booking@|notifications?@)/i;
const MEDSPA_RE =
  /\b(med\s*spa|medical\s*spa|aesthetic|aesthetics|botox|dysport|filler|fillers|injectable|injectables|microneedling|laser hair removal|hydrafacial|wellness)\b/i;
const VALID_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,6}$/;

function parseArgs(argv) {
  const args = {
    state: "GA",
    stateName: "Georgia",
    cities: DEFAULT_CITIES,
    limitPerQuery: 8,
    maxCandidates: 90,
    maxRows: 60,
    rawOutput: path.join(
      PROJECT_ROOT,
      "docs",
      "marketing",
      "outreach",
      "leads",
      "raw-2026-07-07-medspa-georgia.json",
    ),
    csvOutput: path.join(
      PROJECT_ROOT,
      "docs",
      "marketing",
      "outreach",
      "leads",
      "2026-07-07-medspa-georgia.csv",
    ),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--state") args.state = argv[++i];
    else if (arg === "--state-name") args.stateName = argv[++i];
    else if (arg === "--cities") args.cities = argv[++i].split(",").map((city) => city.trim()).filter(Boolean);
    else if (arg === "--limit-per-query") args.limitPerQuery = Number(argv[++i]);
    else if (arg === "--max-candidates") args.maxCandidates = Number(argv[++i]);
    else if (arg === "--max-rows") args.maxRows = Number(argv[++i]);
    else if (arg === "--raw-output") args.rawOutput = path.resolve(argv[++i]);
    else if (arg === "--csv-output") args.csvOutput = path.resolve(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printUsage() {
  console.log(`Usage: node --env-file=.env.local tools/collect-medspa-leads-firecrawl.mjs [options]

Options:
  --state <code>             State code to keep (default GA)
  --state-name <name>        State name used in search queries (default Georgia)
  --cities <a,b,c>           Comma-separated metro/city list
  --limit-per-query <n>      Search result count per query (default 8)
  --max-candidates <n>       Max candidate pages to scrape (default 90)
  --max-rows <n>             Max outreach CSV rows to emit (default 60)
  --raw-output <path>        Raw JSON output path
  --csv-output <path>        Outreach CSV output path
`);
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
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function scoreResult(result, city, stateName) {
  const text = `${result.title ?? ""} ${result.description ?? ""} ${result.url ?? ""}`;
  let score = 0;
  if (MEDSPA_RE.test(text)) score += 3;
  if (new RegExp(`\\b${escapeRegex(city)}\\b`, "i").test(text)) score += 2;
  if (new RegExp(`\\b${escapeRegex(stateName)}\\b|\\bGA\\b`, "i").test(text)) score += 1;
  if (/contact|about|location|book|services/i.test(result.url ?? "")) score += 0.5;
  return score;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function firecrawlPost(url, body) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is required in the environment.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl ${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

async function searchCandidates({ cities, stateName, limitPerQuery }) {
  const seenUrls = new Set();
  const candidates = [];

  for (const city of cities) {
    for (const term of SEARCH_TERMS) {
      const query = `${term} ${city} ${stateName}`;
      const response = await firecrawlPost(SEARCH_ENDPOINT, {
        query,
        limit: limitPerQuery,
      });

      for (const item of response.data ?? []) {
        const url = normalizeUrl(item.url);
        const domain = normalizeDomain(url);
        const title = item.title ?? "";
        const description = item.description ?? "";
        if (!url || !domain) continue;
        if (seenUrls.has(url)) continue;
        if (SKIP_DOMAIN_RE.test(domain)) continue;
        if (BAD_TITLE_RE.test(`${title} ${description}`)) continue;
        if (!MEDSPA_RE.test(`${title} ${description} ${url}`)) continue;

        seenUrls.add(url);
        candidates.push({
          title,
          url,
          description,
          domain,
          searchQuery: query,
          searchCity: city,
          searchTerm: term,
          score: scoreResult(item, city, stateName),
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return candidates;
}

function getContactLikeUrls(markdown, baseUrl) {
  const urls = new Set();
  const baseDomain = normalizeDomain(baseUrl);
  const pattern = /\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let match = pattern.exec(markdown);
  while (match) {
    const raw = match[1];
    if (/contact|about|location|visit|book|consult/i.test(raw)) {
      try {
        const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, baseUrl);
        const href = url.toString();
        const domain = normalizeDomain(href);
        if (!domain || domain !== baseDomain) {
          match = pattern.exec(markdown);
          continue;
        }
        if (/\.(png|jpe?g|gif|svg|webp|pdf)(\?|$)/i.test(href)) {
          match = pattern.exec(markdown);
          continue;
        }
        if (SKIP_DOMAIN_RE.test(domain)) {
          match = pattern.exec(markdown);
          continue;
        }
        urls.add(url.toString());
      } catch {
        // ignore bad links
      }
    }
    match = pattern.exec(markdown);
  }
  return [...urls].slice(0, 3);
}

function extractEmailsFromMarkdown(markdown) {
  const emails = new Set();
  const matches = markdown.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const email of matches) {
    const clean = email.trim().replace(/[),.;:]+$/, "");
    if (VALID_EMAIL_RE.test(clean) && !BAD_EMAIL_RE.test(clean) && !/\.(png|jpe?g|gif|svg|webp)$/i.test(clean)) {
      emails.add(clean);
    }
  }
  return [...emails];
}

function isGoodFit(record, stateCode, stateName) {
  const state = String(record.state ?? "").trim().toUpperCase();
  const text = `${record.business_name ?? ""} ${record.categoryName ?? ""} ${record.siteSummary ?? ""}`;
  const domain = String(record.domain ?? "");
  if (state && state !== stateCode.toUpperCase() && state !== stateName.toUpperCase()) return false;
  if (SKIP_DOMAIN_RE.test(domain) || /github\.io$/i.test(domain)) return false;
  if (!MEDSPA_RE.test(text)) return false;
  if (BAD_TITLE_RE.test(text)) return false;
  return true;
}

function chooseBestEmail(emails, domain) {
  const normalizedDomain = domain.toLowerCase();
  const filtered = emails
    .map((email) => email.trim())
    .filter(Boolean)
    .filter((email) => !BAD_EMAIL_RE.test(email));

  const domainMatch = filtered.find((email) => email.toLowerCase().endsWith(`@${normalizedDomain}`));
  return domainMatch ?? filtered[0] ?? "";
}

function buildFallbackContactUrls(baseUrl, discovered) {
  const options = [...discovered];
  try {
    const url = new URL(baseUrl);
    for (const pathname of ["/contact", "/contact-us", "/about", "/locations"]) {
      options.push(new URL(pathname, url).toString());
    }
  } catch {
    return [...new Set(discovered)];
  }

  return [...new Set(options)].slice(0, 5);
}

async function scrapeCandidate(candidate, stateCode, stateName) {
  const schema = {
    type: "object",
    properties: {
      business_name: { type: "string" },
      city: { type: "string" },
      state: { type: "string" },
      address: { type: "string" },
      phone: { type: "string" },
      categoryName: { type: "string" },
      siteSummary: { type: "string" },
      emails: {
        type: "array",
        items: { type: "string" },
      },
    },
    additionalProperties: false,
  };

  const initial = await firecrawlPost(SCRAPE_ENDPOINT, {
    url: candidate.url,
    formats: [
      "markdown",
      {
        type: "json",
        prompt:
          "Extract the local business identity for this page. Return the business name, city, state, street address if visible, phone number, a short med spa/aesthetics summary, a simple category label, and any public contact email addresses shown on the page. Keep only real business contact emails.",
        schema,
      },
    ],
    onlyMainContent: true,
    location: {
      country: "US",
      languages: ["en-US"],
    },
  });

  const data = initial.data ?? {};
  const contactLikeUrls = getContactLikeUrls(data.markdown ?? "", candidate.url);
  const pageEmails = extractEmailsFromMarkdown(data.markdown ?? "");
  const extractedEmails = Array.isArray(data.json?.emails) ? data.json.emails : [];
  const mergedEmails = [...new Set([...extractedEmails, ...pageEmails])];

  let fallbackEmails = [];
  if (!mergedEmails.length) {
    const fallbackUrls = buildFallbackContactUrls(candidate.url, contactLikeUrls);
    for (const fallbackUrl of fallbackUrls) {
      const contact = await firecrawlPost(SCRAPE_ENDPOINT, {
        url: fallbackUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        location: {
          country: "US",
          languages: ["en-US"],
        },
      });
      fallbackEmails = extractEmailsFromMarkdown(contact.data?.markdown ?? "");
      if (fallbackEmails.length > 0) break;
    }
  }

  const emails = [...new Set([...mergedEmails, ...fallbackEmails])];
  const record = {
    title: candidate.title,
    website: candidate.url,
    emails,
    phone: data.json?.phone ?? "",
    address: data.json?.address ?? "",
    city: data.json?.city ?? candidate.searchCity,
    state: data.json?.state ?? stateCode,
    categoryName: data.json?.categoryName ?? "Medical spa",
    siteSummary: data.json?.siteSummary ?? candidate.description,
    searchString: candidate.searchTerm,
    searchQuery: candidate.searchQuery,
    discoverySource: "Firecrawl search + scrape",
    domain: candidate.domain,
    contactUrls: contactLikeUrls,
  };

  record.bestEmail = chooseBestEmail(record.emails, record.domain);
  record.goodFit = isGoodFit(record, stateCode, stateName);
  record.hasEmail = Boolean(record.bestEmail);
  return record;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = await searchCandidates(args);
  const limitedCandidates = candidates.slice(0, args.maxCandidates);
  const rawRows = [];
  const seenKeys = new Set();

  for (const candidate of limitedCandidates) {
    const row = await scrapeCandidate(candidate, args.state, args.stateName);
    const key = `${row.domain}|${row.city}|${row.bestEmail || row.website}`;
    if (!seenKeys.has(key)) {
      rawRows.push(row);
      seenKeys.add(key);
    }
    if (rawRows.filter((item) => item.goodFit && item.hasEmail).length >= args.maxRows) {
      break;
    }
  }

  const outreachRows = rawRows
    .filter((row) => row.goodFit && row.hasEmail)
    .sort(
      (a, b) =>
        String(a.city ?? "").localeCompare(String(b.city ?? "")) ||
        String(a.business_name ?? a.title ?? "").localeCompare(String(b.business_name ?? b.title ?? "")),
    )
    .slice(0, args.maxRows);

  const csvLines = ["business_name,website,email,city"];
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

  fs.mkdirSync(path.dirname(args.rawOutput), { recursive: true });
  fs.mkdirSync(path.dirname(args.csvOutput), { recursive: true });
  fs.writeFileSync(args.rawOutput, JSON.stringify(rawRows, null, 2) + "\n", "utf8");
  fs.writeFileSync(args.csvOutput, csvLines.join("\n") + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        searchedCandidates: candidates.length,
        scrapedCandidates: rawRows.length,
        outreachRows: outreachRows.length,
        rawOutput: args.rawOutput,
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
