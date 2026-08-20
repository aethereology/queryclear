#!/usr/bin/env node
// Emails the telephone call pack (docs/marketing/outreach/telephone/) to the founder as
// one phone-readable HTML email: tap-to-call rows for the warm tiers, a compact list for
// the rest, the full script inline, and the CSVs attached.
//
// Regenerate the CSVs first if the ledger has moved on — this only reads what's on disk.
//
// Usage:
//   node --env-file=.env.local tools/email-call-pack.mjs            # send
//   node --env-file=.env.local tools/email-call-pack.mjs --preview  # write HTML, don't send
//
// Env: RESEND_API_KEY (required), LEAD_FROM, CALL_PACK_TO (default kyle@sparkcreativesinc.org)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "docs/marketing/outreach/telephone");
const PREVIEW = process.argv.includes("--preview");

// ── brand tokens (mirrors lib/email.ts; single-quoted fonts only — double quotes
// break style="" attributes in several clients) ──────────────────────────────────
const C = {
  paper: "#f7f4ee",
  paper2: "#efeae0",
  ink: "#17180f",
  muted: "#5b5a4d",
  pine: "#12352a",
  pine2: "#0c2a21",
  lime: "#b6f03c",
  limeDeep: "#8fcf1f",
  line: "#e5e2da",
};
const F = {
  sans: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); if (row.some((v) => v.length)) rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const telHref = (p) => {
  const d = String(p).replace(/[^\d]/g, "");
  return `tel:+1${d.length === 11 && d.startsWith("1") ? d.slice(1) : d}`;
};

const rows = parseCsv(fs.readFileSync(path.join(DIR, "call-list.csv"), "utf8"));
const noPhone = parseCsv(fs.readFileSync(path.join(DIR, "no-phone-number.csv"), "utf8"));
const dnc = parseCsv(fs.readFileSync(path.join(DIR, "do-not-call.csv"), "utf8"));

const tierA = rows.filter((r) => r.tier.startsWith("A"));
const tierC = rows.filter((r) => r.tier.startsWith("C"));
const tierB = rows.filter((r) => r.tier.startsWith("B"));

// ── building blocks ──────────────────────────────────────────────────────────────
// `t` and `sub` are author-controlled HTML (they carry entities) — not escaped.
const h2 = (t, sub) =>
  `<tr><td style="padding:34px 0 10px"><p style="margin:0;font-family:${F.mono};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${C.limeDeep};font-weight:600">${t}</p>` +
  (sub ? `<p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:${C.muted}">${sub}</p>` : "") +
  `</td></tr>`;

// Everything composed into the body MUST be a <tr>. A bare <p> or <table> placed as a
// sibling of <tr> gets foster-parented out of the table by the HTML parser and renders
// above the entire email — so p() and say() each return a complete row, never a fragment.
const p = (html, extra = "") =>
  `<tr><td><p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${C.ink};${extra}">${html}</p></td></tr>`;

const say = (html) =>
  `<tr><td style="padding:0 0 14px">` +
  `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
  `<td style="width:3px;background:${C.limeDeep};font-size:0;line-height:0">&nbsp;</td>` +
  `<td style="padding:12px 16px;background:${C.paper2};font-size:15px;line-height:1.7;color:${C.pine}">${html}</td>` +
  `</tr></table></td></tr>`;

// Card styles are emitted once per card, so each one is written as short as it can be
// while staying legible: the cell sets colour and size, the children inherit, and the
// gap between cards is a paper-coloured bottom border rather than a spacer row.
const CARD_TD =
  `padding:14px 16px 15px;background:${C.paper2};border-left:3px solid ${C.pine};` +
  `border-bottom:12px solid ${C.paper};font-size:14px;line-height:1.55;color:${C.ink}`;
const CARD_BTN =
  `display:inline-block;padding:11px 20px;background:${C.pine};color:${C.paper};` +
  `font-family:${F.mono};font-size:18px;font-weight:700;text-decoration:none`;

/** A full card for the warm tiers: everything you need on screen mid-dial. */
function card(r, i) {
  const bits = [r.city, r.vertical, `${r.emails_sent} email${r.emails_sent === "1" ? "" : "s"}`]
    .filter(Boolean)
    .map(esc)
    .join(" &middot; ");
  const extra = [];
  if (r.technical_finding)
    extra.push(`<p style="margin:8px 0 0"><strong>Measured &mdash; say it flat:</strong> ${esc(r.technical_finding)}</p>`);
  if (r.their_question_1)
    extra.push(
      `<p style="margin:8px 0 0;color:${C.muted}">Their question: &ldquo;<span style="color:${C.ink}">${esc(r.their_question_1)}</span>&rdquo;</p>`,
    );
  const links = [];
  if (r.report_url)
    links.push(`<a href="${esc(r.report_url)}" style="color:${C.pine};font-weight:700">Their report</a>`);
  if (r.website) links.push(`<a href="${esc(r.website)}" style="color:${C.muted}">Their site</a>`);

  return (
    `<tr><td style="${CARD_TD}">` +
    `<p style="margin:0;font-size:11px;color:${C.muted}">${i + 1}</p>` +
    `<p style="margin:2px 0 0;font-size:17px;line-height:1.3;font-weight:700">${esc(r.business)}</p>` +
    `<p style="margin:3px 0 10px;font-size:13px;color:${C.muted}">${bits}${r.google_rating ? ` &middot; ${esc(r.google_rating)}&#9733; (${esc(r.google_reviews)})` : ""}</p>` +
    `<a href="${telHref(r.phone)}" style="${CARD_BTN}">&#9742;&nbsp; ${esc(r.phone)}</a>` +
    extra.join("") +
    (links.length ? `<p style="margin:10px 0 0;font-size:13px">${links.join(" &middot; ")}</p>` : "") +
    `</td></tr>`
  );
}

// Tier B rows are 122 of the ~146, so their markup dominates the email's byte size —
// and Gmail clips anything over ~102 KB behind a "View entire message" link. Two cells,
// no nested table, styles hoisted into the shared constants below.
// Font, size and colour are set once on the wrapping table and inherited, so a row
// carries only what cannot be inherited: cell padding, the rule above it, alignment,
// and the link's own colour (clients force their own blue on <a> otherwise).
const TD = `padding:8px 0;border-top:1px solid ${C.line}`;
// nowrap is not optional: without it a narrow phone breaks "(561) 258-9737" across two
// lines, which looks broken and shrinks the tap target.
const TD_R = `${TD};text-align:right;white-space:nowrap`;
const A_TEL = `color:${C.pine};font-weight:700;text-decoration:none;border-bottom:2px solid ${C.lime}`;

function compact(r) {
  return (
    `<tr><td style="${TD}"><strong>${esc(r.business)}</strong></td>` +
    `<td style="${TD_R}"><a href="${telHref(r.phone)}" style="${A_TEL}">${esc(r.phone)}</a></td></tr>`
  );
}

// Tier B grouped by city so a sitting is one market at a time.
function tierBHtml() {
  const byCity = {};
  for (const r of tierB) {
    const k = r.city.replace(/,\s*FL$/, "") || "Unknown";
    (byCity[k] ??= []).push(r);
  }
  return Object.entries(byCity)
    .sort((a, b) => b[1].length - a[1].length)
    .map(
      ([city, list]) =>
        `<tr><td style="padding:18px 0 4px"><p style="margin:0;font-size:15px;font-weight:700;color:${C.pine}">${esc(city)} <span style="color:${C.muted};font-weight:400">&mdash; ${list.length}</span></p></td></tr>` +
        `<tr><td><table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;line-height:1.4;color:${C.ink}">${list.map(compact).join("")}</table></td></tr>`,
    )
    .join("");
}

// ── the script, written for reading on a phone ───────────────────────────────────
const SCRIPT = [
  h2("The script", "Three openers &mdash; use the one matching the row&rsquo;s tier."),

  p(`<strong>Tier A &mdash; they read their report (20).</strong>`),
  say(
    `&ldquo;Hi, is this [name]? Kyle here &mdash; I&rsquo;m the one who sent over that AI search report for <em>[business]</em> a couple weeks back. I saw you&rsquo;d had a look at it, and I never followed up properly, so I figured I&rsquo;d just call. <strong>Did any of it actually land, or was it not really your problem?</strong>&rdquo;`,
  ),
  p(`Then <strong>stop talking.</strong> The question does the work.`, `color:${C.muted}`),

  p(`<strong>Tier B &mdash; emailed, never opened (122).</strong>`),
  say(
    `&ldquo;Hi, is this [name]? Kyle here &mdash; I run queryclear, small shop in Florida. I sent you an email a couple weeks ago that I&rsquo;m guessing went straight past you, which is fair. It ended with one question and I never got an answer, so I&rsquo;m just going to ask it out loud: <strong>when someone asks ChatGPT &lsquo;best [their service] in [their city]&rsquo; &mdash; do you know whether [business] comes up, or is that not on the radar yet?</strong>&rdquo;`,
  ),
  p(`Almost nobody knows. &ldquo;No idea&rdquo; is the answer you want &mdash; it&rsquo;s permission to keep going.`, `color:${C.muted}`),

  p(`<strong>Tier C &mdash; their email bounced, they never got a thing (4).</strong>`),
  say(
    `&ldquo;Hi, is this [name]? Kyle here, I run queryclear. Slightly odd reason for calling: I tried to email <em>[business]</em> a couple weeks ago and it <strong>bounced straight back</strong>, so the address on your listing may be dead &mdash; which you&rsquo;d want to know, because if it bounced for me it&rsquo;s bouncing for customers too. That&rsquo;s worth two minutes on its own. And while I&rsquo;ve got you &mdash; the reason I was emailing is I&rsquo;d run a free check on how your site shows up when people ask ChatGPT for a [service] recommendation. Want the short version?&rdquo;`,
  ),
  p(`Lead with the bounce. Have the dead address ready &mdash; reading it back is the moment they believe you.`, `color:${C.muted}`),

  h2("The 30 seconds", "Only after they&rsquo;ve said yes."),
  say(
    `&ldquo;So when someone asks ChatGPT &lsquo;[their question]&rsquo; &mdash; the assistant doesn&rsquo;t crawl the whole web live, it pulls from sites it can read clearly and trusts enough to name. When I looked at your site, <strong>[the finding]</strong>. Which means for a question like that, your site isn&rsquo;t set up to be the answer it hands back yet. It&rsquo;s not a ranking thing, and it&rsquo;s not complicated to fix &mdash; mostly it&rsquo;s how the pages are structured and labelled so the machine can tell what you do, where, and for who.&rdquo;`,
  ),
  p(
    `<strong>[the finding]</strong> = the <em>Measured</em> line on their card if it has one &mdash; else something you saw on their site (thin service pages, no FAQ, treatments buried in an image, no city named) &mdash; else: &ldquo;your services are there for a human reading the page, but they&rsquo;re not labelled in a way these tools can parse.&rdquo;`,
    `color:${C.muted}`,
  ),

  h2("Discovery", "Four questions, then shut up."),
  p(
    `1. &ldquo;How do people find you today &mdash; referrals, Google, Instagram?&rdquo;<br>` +
    `2. &ldquo;Who looks after the website &mdash; you, someone in-house, or an agency?&rdquo;<br>` +
    `3. &ldquo;When did it last get properly worked on?&rdquo; <span style="color:${C.muted}">(3+ yrs = Upgrade; just rebuilt = Audit only)</span><br>` +
    `4. &ldquo;If someone found you through ChatGPT tomorrow, what would you want them to do &mdash; call, book online, fill in a form?&rdquo;`,
  ),

  h2("The ask", "A booked 20 minutes. Not a sale."),
  say(
    `&ldquo;Here&rsquo;s what I&rsquo;d suggest. I&rsquo;ve already got the report &mdash; nothing more to run. Give me twenty minutes on a screen share and I&rsquo;ll walk you through what I found, in your language, and tell you what I&rsquo;d fix first and what I&rsquo;d ignore. No charge, and if the answer is &lsquo;this isn&rsquo;t worth it for us,&rsquo; I&rsquo;ll tell you that. Are mornings or afternoons better?&rdquo;`,
  ),
  p(
    `Then offer <strong>two slots</strong> &mdash; &ldquo;Thursday 10 or Thursday 2?&rdquo; Never &ldquo;does that work?&rdquo; Confirm their email, the day, the time, and say you&rsquo;ll send the invite in five minutes. Then actually send it before the next call.`,
    `color:${C.muted}`,
  ),
  p(`<strong>If they&rsquo;re hot</strong> (asking price, timing, can you fix it):`),
  say(
    `&ldquo;Two ways in. Paid audit at <strong>$497</strong> &mdash; a scored report I walk you through live with a prioritised roadmap. If you go ahead with the work, <strong>that $497 comes straight off the build</strong>. The work itself starts at <strong>$2,500</strong> for improving the site you&rsquo;ve got, <strong>$6,500</strong> if it needs a full rebuild. Monthly care after that is <strong>$997/mo</strong>, cancel anytime, no contract. But I&rsquo;d rather do the free twenty minutes first so we both know which one you actually need.&rdquo;`,
  ),

  h2("Objections", "The short versions."),
  ...[
    ["&ldquo;How much?&rdquo; (asked early)", `&ldquo;Depends what you need and I don&rsquo;t know that yet. Range is $2,500 to $6,500. The twenty minutes is free and that&rsquo;s what tells us which end you&rsquo;re at &mdash; or whether you need anything at all.&rdquo;`],
    ["&ldquo;We already have an SEO guy.&rdquo;", `&ldquo;Good, then the groundwork is probably there. Question is whether they&rsquo;ve done the AI side specifically &mdash; schema, whether pages answer questions directly, whether an assistant can tell what you do and where from the markup alone. Some agencies are on it, a lot are still on the 2019 playbook. I&rsquo;ll tell you honestly which yours is, and if they&rsquo;re doing it well I&rsquo;ll say so and get out of your way.&rdquo;`],
    ["&ldquo;Too busy / fully booked.&rdquo;", `&ldquo;Then it&rsquo;s the wrong month and I&rsquo;ll leave it. Check back in the autumn? &hellip; Out of interest though &mdash; fully booked with the patients you want, or the ones you get?&rdquo;`],
    ["&ldquo;Just send me something.&rdquo;", `&ldquo;Happy to &mdash; you&rsquo;ve already got it actually, let me resend the link. One thing though: <strong>can I put twenty minutes in the diary next week?</strong> If the report answers everything, cancel it and I won&rsquo;t chase you.&rdquo; <span style="color:${C.muted}">Never accept this as the end &mdash; it&rsquo;s a polite no. Trade it for a slot.</span>`],
    ["&ldquo;Can you guarantee we&rsquo;ll show up in ChatGPT?&rdquo;", `&ldquo;No, and anyone telling you they can is lying to you. Nobody controls what ChatGPT says &mdash; not me, not Google, not OpenAI. What I can do is fix the reasons a site gets skipped: unreadable structure, missing markup, no clear answers on the page. That&rsquo;s readiness, not a ranking promise.&rdquo; <span style="color:${C.muted}">This objection is a gift. Never soften it.</span>`],
    ["&ldquo;Never heard of you.&rdquo;", `&ldquo;Fair question. queryclear is a SparkCreatives Inc. brand, I&rsquo;m the founder, and we&rsquo;re new &mdash; that&rsquo;s why I&rsquo;m calling you myself instead of a salesperson, and why the audit&rsquo;s free. I&rsquo;ll show you what I found and you can judge the work rather than the logo.&rdquo; <span style="color:${C.muted}">New is fine. Fake is fatal.</span>`],
    ["&ldquo;AI search isn&rsquo;t real.&rdquo;", `&ldquo;Might not be for your customers yet &mdash; worth checking rather than assuming. Thing is, most of what fixes AI readability is the same work that makes a site clearer for people and for Google anyway. You&rsquo;re not betting on a trend.&rdquo;`],
    ["&ldquo;No time right now.&rdquo;", `&ldquo;Understood &mdash; are you the right person for the website at all? &hellip; Then when&rsquo;s better, later this week or next?&rdquo; <span style="color:${C.muted}">Pin a time. &ldquo;Call me sometime&rdquo; is a no.</span>`],
    ["&ldquo;How did you get my number?&rdquo;", `&ldquo;Your public Google listing &mdash; same place your customers find you. I emailed first, this is the follow-up. If you&rsquo;d rather I didn&rsquo;t call again just say so and you&rsquo;re off my list for good.&rdquo;`],
    ["&ldquo;Send it to my web guy.&rdquo;", `&ldquo;Perfect &mdash; name and email? <strong>And can I stay on the thread?</strong> Not to sell him anything; he&rsquo;ll have questions about the schema side and I&rsquo;d rather answer them than have him guess.&rdquo;`],
  ].map(
    ([q, a]) =>
      `<tr><td style="padding:0 0 14px"><p style="margin:0 0 5px;font-size:14px;font-weight:700;color:${C.pine}">${q}</p>` +
      `<p style="margin:0;font-size:14px;line-height:1.65;color:${C.ink}">${a}</p></td></tr>`,
  ),

  h2("What you may not say", "The audit has limits. Crossing them is the one unrecoverable mistake."),
  `<tr><td style="padding:0 0 14px">` +
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
  `<td style="padding:14px 16px;background:${C.pine};color:${C.paper};font-size:14px;line-height:1.7">` +
  `<strong style="color:${C.lime}">Never:</strong><br>` +
  `&times; &ldquo;I ran your business through ChatGPT and you didn&rsquo;t come up.&rdquo; &mdash; the citation check was <strong>not measured</strong> for these. You did not verify this.<br>` +
  `&times; &ldquo;You&rsquo;re invisible in AI search.&rdquo;<br>` +
  `&times; Any guarantee of rankings or citations.<br>` +
  `&times; &ldquo;We work with a lot of med spas in your area.&rdquo; &mdash; you have none yet.<br>` +
  `&times; Any invented client, testimonial, result, or years in business.<br><br>` +
  `<strong style="color:${C.lime}">Instead:</strong><br>` +
  `&#10003; &ldquo;For a question like &lsquo;[q]&rsquo;, your site isn&rsquo;t set up to be the answer these tools hand back yet.&rdquo;<br>` +
  `&#10003; &ldquo;These are the questions I mapped for your business.&rdquo;<br>` +
  `&#10003; The <em>Measured</em> line on their card &mdash; that one is verified, state it flat.<br>` +
  `&#10003; &ldquo;I can&rsquo;t promise what ChatGPT will say. I can fix the reasons it skips you.&rdquo;<br><br>` +
  `<strong style="color:${C.lime}">If they ask &ldquo;did you actually check ChatGPT for my business?&rdquo;</strong><br>` +
  `&ldquo;Not query by query, no. I read your site the way these tools read it and mapped the questions your customers ask. Checking each one properly is part of the paid audit &mdash; and honestly, we can check one right now together if you want.&rdquo;<br>` +
  `<span style="color:${C.lime}">That answer builds more trust than the claim you were tempted to make.</span>` +
  `</td></tr></table></td></tr>`,

  h2("Voicemail", "Under 20 seconds. Number twice, slowly. Don&rsquo;t explain the problem."),
  say(
    `<strong>Tier A:</strong> &ldquo;Hi, it&rsquo;s Kyle from queryclear. I sent over that AI search report for [business] and saw you&rsquo;d taken a look &mdash; just wanted to hear whether it was useful or not. [number]. Again, Kyle, [number]. Thanks.&rdquo;`,
  ),
  say(
    `<strong>Tier B/C:</strong> &ldquo;Hi, Kyle here from queryclear. I sent [business] an email a couple weeks back about how your site shows up in ChatGPT and Google&rsquo;s AI answers &mdash; probably landed in spam. Worth two minutes if you&rsquo;re curious. [number]. Thanks.&rdquo;`,
  ),

  h2("Gatekeeper", "The person answering is booking appointments. Be brief, be a person."),
  say(
    `&ldquo;Hi &mdash; I&rsquo;m not a patient, I&rsquo;ll be quick. My name&rsquo;s Kyle, I sent [owner] an email a couple weeks ago about their website. Is she around, or is there a better time to catch her?&rdquo;`,
  ),
  p(
    `&ldquo;Send an email&rdquo; &rarr; &ldquo;I did, that&rsquo;s the problem &mdash; it&rsquo;s probably in her spam. Better time of day to catch her for two minutes?&rdquo;<br>` +
    `Get the owner&rsquo;s <strong>name</strong> even if you don&rsquo;t get the owner. That alone makes the next call twice as good.`,
    `color:${C.muted}`,
  ),
].join("");

// ── assemble ─────────────────────────────────────────────────────────────────────
const total = rows.length;
const body =
  `<tr><td style="padding:0 0 6px"><p style="margin:0;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${C.ink}">Your call pack</p>` +
  `<p style="margin:6px 0 0;font-size:15px;line-height:1.6;color:${C.muted}">${total} businesses with a phone number, in dial order. Tap any number to call it. ${tierA.length} have already read their audit &mdash; start there.</p></td></tr>` +

  (process.env.CALL_PAGE_URL
    ? `<tr><td style="padding:18px 0 0">` +
      `<a href="${esc(process.env.CALL_PAGE_URL)}" style="display:inline-block;padding:13px 22px;background:${C.pine};color:${C.paper};font-size:15px;font-weight:700;text-decoration:none">Open the tap-to-call page &rarr;</a>` +
      `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:${C.muted}">Bookmark it on your phone. Same list, but it logs outcomes and notes as you go and exports a CSV. Everything below works offline if you&rsquo;d rather stay in the email.</p>` +
      `</td></tr>`
    : "") +

  `<tr><td style="padding:20px 0 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
  `<td style="padding:14px 16px;background:${C.paper2};font-size:14px;line-height:1.7;color:${C.ink}">` +
  `<strong>A &mdash; opened their report (${tierA.length}).</strong> Warmest signal we have. Full detail below.<br>` +
  `<strong>C &mdash; email bounced (${tierC.length}).</strong> Never received a word from us. Phone is the only channel that reaches them.<br>` +
  `<strong>B &mdash; emailed, never opened (${tierB.length}).</strong> Compact list, grouped by city.<br><br>` +
  `<span style="color:${C.muted}">Two rules: after any real conversation, mark them <strong>warm</strong> so the cron stops emailing them. And never call the one name in do-not-call &mdash; ${esc(dnc[0]?.business ?? "n/a")} asked to be left alone.</span>` +
  `</td></tr></table></td></tr>` +

  h2(`Tier A &mdash; call first (${tierA.length})`, "They clicked through and read the audit you sent.") +
  tierA.map(card).join("") +

  h2(`Tier C &mdash; the bounces (${tierC.length})`, "Fresh: they never received the email. Lead with the dead address.") +
  tierC.map(card).join("") +

  h2(`Tier B &mdash; the rest (${tierB.length})`, "By city &mdash; work one market per sitting. Full detail is in the attached CSV.") +
  tierBHtml() +

  SCRIPT +

  h2("Also attached", "") +
  p(
    `<strong>call-list.csv</strong> &mdash; all ${total} rows with every column (questions 2 and 3, findings, ratings, addresses).<br>` +
    `<strong>call-script.md</strong> &mdash; the long-form script.<br>` +
    `<strong>no-phone-number.csv</strong> &mdash; ${noPhone.length} contacts with no verified number; their sites are listed if you want to dig.<br>` +
    `<strong>call-log.csv</strong> &mdash; blank. One row per call; after ~30 calls the objections column tells you what to rewrite.`,
    `color:${C.muted};font-size:14px`,
  ) +
  p(
    `Heads up: <strong>dermani MEDSPA appears on 5 rows sharing one franchise number</strong> &mdash; (770) 884-4934. Call it once, pitch it as five locations.`,
    `font-size:14px`,
  );

const html =
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>Your call pack</title></head>` +
  `<body style="margin:0;padding:0;background:${C.paper};font-family:${F.sans};-webkit-text-size-adjust:100%">` +
  `<div style="display:none;max-height:0;overflow:hidden">${total} businesses, tap to call. Tier A first.</div>` +
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper}"><tr><td align="center" style="padding:0">` +
  // width="100%" + max-width (not a fixed width="640") so it reflows on a phone
  // instead of forcing a horizontal scroll.
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px">` +
  // Two cells rather than a float — email clients drop floats unpredictably.
  `<tr><td style="padding:20px 22px;background:${C.pine}">` +
  `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
  `<td style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:${C.paper}">queryclear<span style="color:${C.lime}">.</span></td>` +
  `<td style="text-align:right;font-family:${F.mono};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.lime}">Call pack</td>` +
  `</tr></table></td></tr>` +
  `<tr><td style="padding:24px 22px 32px">` +
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${body}</table>` +
  `</td></tr>` +
  `<tr><td style="padding:16px 24px 30px;border-top:1px solid ${C.line}">` +
  `<p style="margin:0;font-size:12px;line-height:1.6;color:${C.muted}">Built from the live outreach ledger. Internal &mdash; contains prospect contact details, don&rsquo;t forward.</p>` +
  `</td></tr></table></td></tr></table></body></html>`;

// ── send ─────────────────────────────────────────────────────────────────────────
const outPath = path.join(DIR, "call-pack.html");
fs.writeFileSync(outPath, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`HTML ${kb} KB → ${path.relative(ROOT, outPath)}`);
if (kb > 100) console.warn(`⚠ over 100 KB — Gmail will clip it ("View entire message")`);

if (PREVIEW) {
  console.log("--preview: not sending.");
  process.exit(0);
}

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("✖ RESEND_API_KEY not set");
  process.exit(1);
}
const to = process.env.CALL_PACK_TO ?? "kyle@sparkcreativesinc.org";
const from = process.env.LEAD_FROM ?? "queryclear <audit@queryclear.com>";

const attach = (f) => ({
  filename: f,
  content: fs.readFileSync(path.join(DIR, f)).toString("base64"),
});

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: JSON.stringify({
    from,
    to,
    subject: `Your call pack — ${total} businesses, ${tierA.length} already read their audit`,
    html,
    attachments: ["call-list.csv", "call-script.md", "no-phone-number.csv", "call-log.csv"].map(attach),
  }),
});
const data = await res.json();
if (!res.ok) {
  console.error("✖ send failed:", JSON.stringify(data));
  process.exit(1);
}
console.log(`✓ sent to ${to} (id ${data.id})`);
