#!/usr/bin/env node
// Builds the "I'll fix your top issue free" call pack for every contact who has
// READ their audit report (status=opened) — the only proven-engaged segment.
//
// Joins three sources:
//   oc:contact:*        live ledger (who, how many emails, report token)
//   pa:report:<token>   the actual audit → their real #1 recommendation
//   call-list.csv       phone numbers enriched on 2026-08-10
//
// Output: docs/marketing/outreach/telephone/free-fix-pack.{csv,md}
//
// Usage: node --env-file=.env.local tools/build-free-fix-pack.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs/marketing/outreach/telephone");
const U = process.env.KV_REST_API_URL, T = process.env.KV_REST_API_TOKEN;
if (!U || !T) throw new Error("missing KV_REST_API_URL / KV_REST_API_TOKEN");

const redis = async (...a) => {
  const res = await fetch(U, {
    method: "POST",
    headers: { Authorization: `Bearer ${T}`, "Content-Type": "application/json" },
    body: JSON.stringify(a),
  });
  const j = await res.json();
  if (j.error) throw new Error(`${a.slice(0, 2).join(" ")}: ${j.error}`);
  return j.result;
};

// --- minimal CSV parse/serialise (quoted fields with commas) ---
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ""));
}
const cell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// --- load the live ledger ---
const emails = await redis("SMEMBERS", "oc:contacts");
const contacts = [];
for (let i = 0; i < emails.length; i += 40) {
  const b = emails.slice(i, i + 40);
  (await redis("MGET", ...b.map((e) => `oc:contact:${e}`))).forEach((v) => {
    if (v) try { contacts.push(JSON.parse(v)); } catch {}
  });
}
const openers = contacts.filter((c) => c.status === "opened");
console.log(`ledger: ${contacts.length} contacts → ${openers.length} have read their report`);

// --- phone numbers from the 08-10 enrichment ---
const phoneByEmail = new Map(), phoneByBiz = new Map();
const clPath = path.join(OUT_DIR, "call-list.csv");
if (fs.existsSync(clPath)) {
  const rows = parseCsv(fs.readFileSync(clPath, "utf8"));
  const head = rows[0].map((h) => h.trim());
  const ix = (n) => head.indexOf(n);
  for (const r of rows.slice(1)) {
    const rec = { phone: r[ix("phone")], rating: r[ix("google_rating")], reviews: r[ix("google_reviews")], address: r[ix("address")] };
    if (r[ix("email")]) phoneByEmail.set(r[ix("email")].toLowerCase(), rec);
    if (r[ix("business")]) phoneByBiz.set(r[ix("business")].toLowerCase().trim(), rec);
  }
}
const dnc = new Set();
const dncPath = path.join(OUT_DIR, "do-not-call.csv");
if (fs.existsSync(dncPath)) {
  for (const r of parseCsv(fs.readFileSync(dncPath, "utf8")).slice(1)) r.forEach((v) => { if (v.includes("@")) dnc.add(v.toLowerCase()); });
}
// Never call anyone who unsubscribed or bounced, whatever the CSV says.
for (const c of contacts) if (c.status === "unsubscribed") dnc.add(c.email.toLowerCase());


// The free fix must be ONE concrete deliverable we can hand over in minutes —
// not "win visibility for query X", which is the whole paid service. Ranked by
// perceived value + how well it demonstrates what we actually sell. Schema
// leads: 30 of 31 report-readers are missing it and it IS the specialty.
const OFFERS = [
  { code: "missing_structured_data", deliverable: "JSON-LD structured data (Organization + LocalBusiness + Service) written for your site",
    say: "I'll write the structured-data markup for your homepage and send you the code block. Your developer pastes it in, or I'll show them where." },
  { code: "missing_meta_description", deliverable: "A meta description written for your homepage",
    say: "I'll write your homepage meta description — the line that shows up under your name in results." },
  { code: "missing_llms_txt", deliverable: "An llms.txt file written for your site",
    say: "I'll write you an llms.txt — a short plain-text summary of the business that AI crawlers read." },
  { code: "missing_title", deliverable: "A page title written for your homepage",
    say: "Your homepage has no title tag at all. I'll write one and send it over." },
  { code: "duplicated_title", deliverable: "A rewritten page title (the current one repeats itself)",
    say: "Your title repeats itself. I'll rewrite it and send it over." },
  { code: "missing_h1", deliverable: "A proper H1 heading for your homepage",
    say: "I'll write a proper main heading for the page and send it over." },
  { code: "thin_content", deliverable: "A rewritten homepage intro with enough substance to be quotable",
    say: "I'll draft a homepage intro with enough substance for an assistant to quote." },
  { code: "title_too_long", deliverable: "A shortened page title that won't get cut off",
    say: "I'll rewrite your page title so it stops getting truncated." },
  { code: "title_too_short", deliverable: "A fuller page title",
    say: "I'll rewrite your page title with the detail it's missing." },
  { code: "missing_robots_txt", deliverable: "A robots.txt written for your site",
    say: "I'll write you a robots.txt so crawlers get clear instructions." },
];
const offerRank = new Map(OFFERS.map((o, i) => [o.code, i]));


// ── phone enrichment (Google Places) ───────────────────────────────────────
// The 08-10 call-list only covers contacts that existed then; newer opens have
// no number. Look those up once and cache to disk so re-running this script is
// free. A wrong number means calling a stranger's business, so a result is only
// accepted when its own displayName shares a significant token with ours.
const CACHE_PATH = path.join(OUT_DIR, "phone-cache.json");
const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) : {};
const STOP = new Set(["the","and","of","inc","llc","pa","pllc","p.a.","co","group","center","centre",
  "clinic","law","dental","dentistry","spa","med","medical","health","associates","office","offices","&"]);
const tokens = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
  .filter((w) => w.length > 2 && !STOP.has(w));

async function lookupPhone(business, city) {
  const key = process.env.AGENT_REACH_GOOGLE_MAPS_API_KEY;
  const ck = `${business}|${city}`;
  if (ck in cache) return cache[ck];
  if (!key) return null;
  let out = null;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.displayName,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: `${business} ${city}`, maxResultCount: 3 }),
    });
    const j = await res.json();
    const mine = tokens(business);
    for (const pl of j.places ?? []) {
      if (!pl.nationalPhoneNumber) continue;
      const theirs = tokens(pl.displayName?.text ?? "");
      const overlap = mine.filter((t) => theirs.includes(t)).length;
      if (overlap === 0) continue; // different business — never dial it
      out = {
        phone: pl.nationalPhoneNumber,
        rating: pl.rating ?? "",
        reviews: pl.userRatingCount ?? "",
        address: pl.formattedAddress ?? "",
        matched: pl.displayName?.text ?? "",
      };
      break;
    }
  } catch {}
  cache[ck] = out;
  return out;
}


// Slipped past lib/prospect-curate.ts (national chains + sell-to-our-market
// vendors are supposed to be dropped at sourcing). Calling these wastes the
// founder's time, so they are held out of the dial order rather than silently
// mixed in. Fix the root cause in prospect-curate.ts, then this list shrinks.
const NOT_A_PROSPECT = [
  { match: /dental directory services/i, why: "sells dental marketing — a competitor, not a prospect" },
  { match: /massage envy/i, why: "national franchise location — no local site control" },
  { match: /patriot health/i, why: "national dental-savings-plan seller, not a local service business" },
];
const notAProspect = (biz) => NOT_A_PROSPECT.find((x) => x.match.test(biz))?.why ?? "";

// --- join each opener to their real audit ---
const out = [];
for (const c of openers) {
  const token = (c.touches ?? []).find((t) => t.reportToken)?.reportToken ?? null;
  let pick = null, findings = [], topQuery = "", bigOpportunity = "";
  if (token) {
    const raw = await redis("GET", `pa:report:${token}`);
    if (raw) {
      const rep = typeof raw === "string" ? JSON.parse(raw) : raw;
      // Dedupe: the crawler reports the same defect once per URL variant.
      const seen = new Set();
      findings = (rep.findings ?? []).filter((f) => !seen.has(f.code) && seen.add(f.code));
      const ranked = [...findings].sort(
        (a, b) => (offerRank.get(a.code) ?? 99) - (offerRank.get(b.code) ?? 99));
      const best = ranked[0];
      if (best) pick = { ...best, ...OFFERS[offerRank.get(best.code) ?? -1] };
      const sortedRecs = [...(rep.recommendations ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
      bigOpportunity = sortedRecs[0]?.title ?? "";
      const uncited = (rep.queries ?? []).filter((q) => q.cited_count === 0);
      topQuery = (uncited.find((q) => q.measured) ?? uncited[0])?.query ?? "";
    }
  }
  let ph = phoneByEmail.get(c.email.toLowerCase())
    ?? phoneByBiz.get(String(c.business ?? "").toLowerCase().trim()) ?? {};
  if (!ph.phone) ph = (await lookupPhone(c.business ?? c.domain, c.city ?? "")) ?? ph;
  out.push({
    business: c.business ?? c.domain,
    phone: ph.phone ?? "",
    city: c.city ?? "",
    emails_sent: (c.touches ?? []).length,
    last_email: String(c.lastTouchAt ?? "").slice(0, 10),
    free_fix: pick?.deliverable ?? "",
    say_on_call: pick?.say ?? "",
    fix_code: pick?.code ?? "",
    severity: pick?.severity ?? "",
    evidence: pick?.detail ?? "",
    other_issues: Math.max(0, findings.length - 1),
    big_opportunity: bigOpportunity,
    their_query: topQuery,
    report_url: token ? `https://www.queryclear.com/r/${token}` : "",
    website: c.domain ?? "",
    email: c.email,
    rating: ph.rating ?? "",
    reviews: ph.reviews ?? "",
    do_not_call: dnc.has(c.email.toLowerCase()) ? "YES" : "",
    skip_reason: notAProspect(String(c.business ?? "")),
  });
}

// Dial order: has a phone, has a concrete measured fix, most engaged first.
const SEV = { high: 0, medium: 1, low: 2 };
out.sort((a, b) =>
  (a.skip_reason ? 1 : 0) - (b.skip_reason ? 1 : 0) ||
  (b.phone ? 1 : 0) - (a.phone ? 1 : 0) ||
  (b.free_fix ? 1 : 0) - (a.free_fix ? 1 : 0) ||
  (SEV[a.severity] ?? 9) - (SEV[b.severity] ?? 9) ||
  b.other_issues - a.other_issues ||
  b.emails_sent - a.emails_sent);

const callable = out.filter((r) => r.phone && !r.do_not_call);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
const enriched = Object.values(cache).filter(Boolean).length;
console.log(`phone lookups cached . ${Object.keys(cache).length} (${enriched} resolved, ${Object.keys(cache).length - enriched} not found)`);
const cols = Object.keys(out[0] ?? {});
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "free-fix-pack.csv"),
  [["call_order", ...cols].join(","), ...out.map((r, i) => [i + 1, ...cols.map((k) => cell(r[k]))].join(","))].join("\n") + "\n");

console.log(`report-readers ....... ${out.length}`);
console.log(`with a phone number .. ${callable.length}`);
console.log(`with a concrete fix .. ${out.filter((r) => r.free_fix).length}`);
console.log(`no findings at all ... ${out.filter((r) => !r.free_fix).length}  (use their uncited query instead)`);
const mix = out.reduce((a, r) => ((a[r.fix_code || "(none)"] = (a[r.fix_code || "(none)"] ?? 0) + 1), a), {});
console.log(`offer mix ............ ${JSON.stringify(mix)}`);
console.log(`missing phone ........ ${out.filter((r) => !r.phone).length}`);
console.log(`do-not-call .......... ${out.filter((r) => r.do_not_call).length}`);
console.log(`\nwrote free-fix-pack.csv (${out.length} rows)`);

// ── The call pack the founder actually reads while dialling ────────────────
const dialable = out.filter((r) => !r.do_not_call && !r.skip_reason);
const withPhone = dialable.filter((r) => r.phone);
const noPhone = dialable.filter((r) => !r.phone);
const skipped = out.filter((r) => r.skip_reason);
const stamp = new Date().toISOString().slice(0, 10);

const card = (r, i) => `
### ${i}. ${r.business} — ${r.city}
**${r.phone}** · ${r.emails_sent} emails, last ${r.last_email} · ${r.rating ? `${r.rating}★ (${r.reviews})` : "no rating on file"}
Report (open this before you dial): ${r.report_url}

- **Free fix to offer:** ${r.free_fix || "— no technical defect found; lead with the query below"}
- **Say it like this:** ${r.say_on_call || `"When I checked, you weren't coming up for \u201c${r.their_query}\u201d \u2014 want me to look at why?"`}
${r.evidence ? `- **Evidence (they can verify it):** ${r.evidence}\n` : ""}- **Plus:** ${r.other_issues} other issue${r.other_issues === 1 ? "" : "s"} in the report
${r.their_query ? `- **A question they don't come up for:** \u201c${r.their_query}\u201d\n` : ""}${r.big_opportunity ? `- **The paid conversation:** ${r.big_opportunity}\n` : ""}`;

const md = `# Free-fix call pack — the 31 who read their report

Generated ${stamp} by \`tools/build-free-fix-pack.mjs\` from the live ledger
(\`oc:contact:*\`), their real stored audits (\`pa:report:*\`), and the phone
numbers enriched 2026-08-10.

## Why these 31 and nobody else

**747 emails to 255 businesses have produced 0 replies.** But **31 of them
opened their personalised audit and read it.** That is a 12.2% click-through on
cold email — high. Interest is real; the *reply* is what never happens.

These 31 already know who we are and have seen their own report. The call is a
follow-up to something they engaged with, not a cold call.

## The ask has changed

We are no longer asking "is this on your radar?" — that asks a stranger to open
a sales conversation for no payoff, and it went 0 for 255.

**The new ask: we fix their single biggest issue for free, no strings.**

It works because it is small, concrete, provably useful, and it demonstrates the
exact thing we sell. The paid conversation comes after they have something in
hand and can see it worked.

**Do not** promise rankings, citations, or traffic. The honest claim is
readiness: their site becomes easier for assistants to parse, trust, and quote.

## The 20-second opener

> "Hi, is ${"{owner or manager}"} around? — This is Kyle from queryclear. I sent
> ${"{business}"} an AI-search audit a few weeks back and I saw someone on your side
> opened it, so I figured I'd just call instead of emailing again.
>
> I'm not calling to sell you anything. The report flagged
> ${"{the free fix}"} — I'd like to just write it for you and send it over. Free,
> no strings. Takes me about ten minutes. Want me to?"

Then stop talking. Let them respond.

**If yes** → confirm the best email, send it same day, and ask one question:
*"Once this is in, do you want me to look at the rest of what the report found?"*

**If "who are you again"** → "queryclear, a SparkCreatives Inc. brand. We make
sites easier for AI assistants like ChatGPT and Google's AI answers to read and
quote. Your report is at ${"{report_url}"} — I can wait while you pull it up."

**If "we already have an SEO guy"** → "Good — this isn't a replacement. Send him
the markup, it's his to use. That's genuinely why it's free."

**If "not interested"** → "Understood, I'll take you off the list. Thanks for
your time." Then log it and add them to \`do-not-call.csv\`.

**Voicemail** → "Kyle from queryclear. I sent ${"{business}"} an AI-search audit and
someone opened it, so I wanted to follow up by phone. There's one fix in there
I'll write for you for free — no strings. ${"{phone}"}. I'll email it over too."

## Log every call

Fill a row in \`call-log.csv\` per attempt. The objection column is the input for
the next revision of this script — with 0 email replies, calls are the only
channel currently producing information.

---

# Tier A — read the report, has a phone (${withPhone.length})

Call these first, in this order.
${withPhone.map((r, i) => card(r, i + 1)).join("")}
---

# Tier B — read the report, no phone number yet (${noPhone.length})

These ${noPhone.length} opened their report but weren't in the 2026-08-10 phone
enrichment (they're the newest opens — mostly St. Petersburg and West Palm Beach).
Worth enriching, they are the freshest signal in the pipeline.
${noPhone.map((r) => `\n- **${r.business}** — ${r.city} · ${r.website}\n  Free fix: ${r.free_fix || `(none found — use \u201c${r.their_query}\u201d)`}\n  Report: ${r.report_url}`).join("")}
`;

const skipMd = skipped.length
  ? `
---

# Do not call — not real prospects (${skipped.length})

These reached the ledger through sourcing but should have been filtered out.
Fix \`lib/prospect-curate.ts\` so future sweeps drop them.
${skipped.map((r) => `
- **${r.business}** (${r.city}) — ${r.skip_reason}`).join("")}
`
  : "";
fs.writeFileSync(path.join(OUT_DIR, "free-fix-pack.md"), md + skipMd);
console.log(`held out (not prospects) ${skipped.length}`);
console.log(`wrote free-fix-pack.md  (Tier A ${withPhone.length}, Tier B ${noPhone.length})`);
