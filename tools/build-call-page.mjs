#!/usr/bin/env node
// Builds the phone-first call page from docs/marketing/outreach/telephone/call-list.csv.
// Output is a single self-contained HTML file (no external requests) intended to be
// published as a private Artifact and bookmarked on the founder's phone.
//
// Usage: node tools/build-call-page.mjs [outfile]
//   default outfile: docs/marketing/outreach/telephone/call-page.html (gitignored)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "docs/marketing/outreach/telephone");
const OUT = process.argv[2] ?? path.join(DIR, "call-page.html");

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
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const list = parseCsv(fs.readFileSync(path.join(DIR, "call-list.csv"), "utf8"));
const noPhone = parseCsv(fs.readFileSync(path.join(DIR, "no-phone-number.csv"), "utf8"));
const dnc = parseCsv(fs.readFileSync(path.join(DIR, "do-not-call.csv"), "utf8"));

const digits = (p) => {
  const d = String(p).replace(/[^\d]/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
};

// Compact records — the page ships the data inline, so only what the UI renders.
const data = list.map((r) => ({
  t: r.tier[0],                       // A | B | C
  n: r.business,
  p: r.phone,
  d: digits(r.phone),
  c: r.city.replace(/,\s*FL$/, ""),
  v: r.vertical,
  e: Number(r.emails_sent) || 0,
  q: r.their_question_1 || "",
  f: r.technical_finding || "",
  r: r.report_url || "",
  w: r.website || "",
  m: r.email || "",
  g: r.google_rating ? `${r.google_rating}★ (${r.google_reviews})` : "",
}));

const meta = {
  built: new Date().toISOString().slice(0, 10),
  noPhone: noPhone.length,
  dnc: dnc.map((r) => r.business),
};

const html = `<title>Call pack — ${data.length} businesses</title>
<style>
  /* Light palette is the complete set on bare :root; the two dark blocks below
     redefine only tokens, so the un-stamped (system) state resolves correctly. */
  :root {
    --paper:#f7f4ee; --surface:#efeae0; --surface-2:#e5dfd2; --raised:#fffdf8;
    --ink:#17180f; --muted:#5f5e51; --faint:#8a897d; --line:#dcd6c8;
    --action:#12352a; --action-ink:#f7f4ee; --action-hi:#1b4a38;
    --accent:#6f9c12; --pine:#12352a;
    --good:#2f6b41; --warn:#8d6210; --clay:#98452a;
    --shadow:0 1px 0 rgba(23,24,15,.06), 0 8px 24px -18px rgba(23,24,15,.5);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper:#0d1712; --surface:#14211c; --surface-2:#1c2e27; --raised:#182722;
      --ink:#e9e6db; --muted:#9ba69c; --faint:#7c887e; --line:#26382f;
      --action:#b6f03c; --action-ink:#0b1610; --action-hi:#c8fa5c;
      --accent:#b6f03c; --pine:#b6f03c;
      --good:#6dbd7f; --warn:#d9a53c; --clay:#e08863;
      --shadow:0 1px 0 rgba(0,0,0,.3), 0 10px 26px -18px #000;
    }
  }
  :root[data-theme="dark"] {
    --paper:#0d1712; --surface:#14211c; --surface-2:#1c2e27; --raised:#182722;
    --ink:#e9e6db; --muted:#9ba69c; --faint:#7c887e; --line:#26382f;
    --action:#b6f03c; --action-ink:#0b1610; --action-hi:#c8fa5c;
    --accent:#b6f03c; --pine:#b6f03c;
    --good:#6dbd7f; --warn:#d9a53c; --clay:#e08863;
    --shadow:0 1px 0 rgba(0,0,0,.3), 0 10px 26px -18px #000;
  }

  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--paper); color:var(--ink);
    font-family:system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size:16px; line-height:1.5; -webkit-text-size-adjust:100%;
  }
  .mono { font-family:ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-variant-numeric:tabular-nums; }
  .lbl {
    font-family:ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint);
  }
  .wrap { max-width:620px; margin:0 auto; padding:0 14px 96px; }

  /* ── sticky control bar ─────────────────────────────────────────── */
  header {
    position:sticky; top:0; z-index:20; background:var(--paper);
    border-bottom:1px solid var(--line); padding:10px 0 8px;
  }
  .hrow { display:flex; align-items:baseline; gap:8px; }
  h1 { margin:0; font-size:17px; font-weight:700; letter-spacing:-.01em; }
  h1 span { color:var(--accent); }
  .counts { margin-left:auto; display:flex; gap:10px; }
  .counts b { font-size:15px; font-weight:700; }
  .counts i { font-style:normal; color:var(--faint); font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
  .bar { height:3px; background:var(--surface-2); margin:8px 0 9px; overflow:hidden; }
  .bar > i { display:block; height:100%; background:var(--action); width:0; transition:width .3s ease; }
  @media (prefers-reduced-motion: reduce) { .bar > i { transition:none; } }

  .filters { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .filters::-webkit-scrollbar { display:none; }
  .chip {
    flex:0 0 auto; border:1px solid var(--line); background:var(--surface);
    color:var(--muted); font:inherit; font-size:12px; padding:6px 11px; cursor:pointer;
    white-space:nowrap; border-radius:0;
  }
  .chip[aria-pressed="true"] { background:var(--action); border-color:var(--action); color:var(--action-ink); font-weight:600; }
  .chip:focus-visible, .obtn:focus-visible, .call:focus-visible, .tool:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .tools { display:flex; gap:6px; margin-top:7px; }
  .tool {
    border:1px solid var(--line); background:none; color:var(--muted);
    font:inherit; font-size:11px; padding:5px 9px; cursor:pointer;
  }
  .tool:last-child { margin-left:auto; }
  input[type=search] {
    width:100%; margin-top:7px; padding:8px 10px; font:inherit; font-size:14px;
    background:var(--raised); color:var(--ink); border:1px solid var(--line); border-radius:0;
  }

  /* ── call cards ─────────────────────────────────────────────────── */
  .card {
    background:var(--surface); border-left:3px solid var(--pine);
    padding:13px 14px 14px; margin:0 0 10px; box-shadow:var(--shadow);
  }
  .card.done { opacity:.5; border-left-color:var(--line); }
  .top { display:flex; align-items:flex-start; gap:8px; }
  .biz { margin:0; font-size:16px; font-weight:700; line-height:1.25; letter-spacing:-.01em; }
  .tier { flex:0 0 auto; display:flex; align-items:center; gap:5px; padding-top:3px; }
  .dot { width:7px; height:7px; border-radius:50%; }
  .dot.A { background:var(--accent); }
  .dot.B { background:var(--faint); }
  .dot.C { background:var(--clay); }
  .meta { margin:3px 0 0; font-size:12px; color:var(--muted); }
  .call {
    display:flex; align-items:center; justify-content:center; gap:9px;
    margin:11px 0 0; padding:14px; width:100%;
    background:var(--action); color:var(--action-ink); text-decoration:none;
    font-size:19px; font-weight:700; letter-spacing:.02em;
  }
  .call:active { background:var(--action-hi); }
  .note { margin:9px 0 0; font-size:13px; line-height:1.5; color:var(--muted); }
  .note b { color:var(--ink); font-weight:600; }
  .flag { border-left:2px solid var(--warn); padding-left:8px; color:var(--ink); }
  .links { margin:9px 0 0; font-size:13px; display:flex; flex-wrap:wrap; gap:4px 12px; }
  .links a { color:var(--pine); font-weight:600; }
  .links a.dim { color:var(--muted); font-weight:400; }

  .outcomes { display:flex; flex-wrap:wrap; gap:5px; margin:11px 0 0; padding-top:11px; border-top:1px solid var(--line); }
  .obtn {
    border:1px solid var(--line); background:var(--raised); color:var(--muted);
    font:inherit; font-size:12px; padding:6px 9px; cursor:pointer;
  }
  .obtn[aria-pressed="true"] { color:var(--action-ink); font-weight:600; border-color:transparent; }
  .obtn[data-o="Booked"][aria-pressed="true"]        { background:var(--good); }
  .obtn[data-o="Talked"][aria-pressed="true"]        { background:var(--pine); color:var(--action-ink); }
  .obtn[data-o="Voicemail"][aria-pressed="true"]     { background:var(--warn); }
  .obtn[data-o="Gatekeeper"][aria-pressed="true"]    { background:var(--warn); }
  .obtn[data-o="No answer"][aria-pressed="true"]     { background:var(--faint); }
  .obtn[data-o="Not interested"][aria-pressed="true"]{ background:var(--clay); }
  :root[data-theme="dark"] .obtn[aria-pressed="true"],
  .obtn[data-o="Talked"][aria-pressed="true"] { color:var(--action-ink); }
  .jot {
    width:100%; margin:7px 0 0; padding:7px 9px; font:inherit; font-size:13px;
    background:var(--raised); color:var(--ink); border:1px solid var(--line); border-radius:0; resize:vertical;
  }
  .empty { padding:40px 0; text-align:center; color:var(--faint); font-size:14px; }
  footer { margin:34px 0 0; padding-top:16px; border-top:1px solid var(--line); font-size:12px; color:var(--faint); line-height:1.6; }

  /* ── script sheet ───────────────────────────────────────────────── */
  .fab {
    position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:30;
    border:0; background:var(--pine); color:var(--action-ink);
    font:inherit; font-size:13px; font-weight:700; padding:12px 22px; cursor:pointer;
    box-shadow:0 6px 20px -8px rgba(0,0,0,.5);
  }
  :root[data-theme="dark"] .fab { color:var(--action-ink); }
  dialog.sheet {
    border:0; padding:0; margin:0 auto; max-width:620px; width:100%;
    max-height:88vh; background:var(--paper); color:var(--ink);
    position:fixed; bottom:0; top:auto;
  }
  dialog.sheet::backdrop { background:rgba(8,14,11,.55); }
  .sheet-in { padding:16px 16px 28px; overflow-y:auto; max-height:88vh; }
  .sheet h2 { margin:0 0 2px; font-size:18px; }
  .sheet h3 { margin:20px 0 5px; font-size:14px; }
  .say { border-left:3px solid var(--accent); background:var(--surface); padding:10px 12px; margin:6px 0 0; font-size:14px; line-height:1.6; }
  .never { background:var(--pine); color:var(--paper); padding:12px 14px; margin:8px 0 0; font-size:13px; line-height:1.65; }
  :root[data-theme="dark"] .never { background:var(--surface-2); color:var(--ink); }
  .never b { color:var(--accent); }
  .close { position:sticky; top:0; float:right; border:1px solid var(--line); background:var(--paper); color:var(--muted); font:inherit; font-size:12px; padding:5px 10px; cursor:pointer; }
</style>

<div class="wrap">
  <header>
    <div class="hrow">
      <h1>Call pack<span>.</span></h1>
      <div class="counts">
        <div><b id="cDone">0</b> <i>logged</i></div>
        <div><b id="cBooked">0</b> <i>booked</i></div>
        <div><b id="cLeft">0</b> <i>left</i></div>
      </div>
    </div>
    <div class="bar"><i id="prog"></i></div>
    <div class="filters" id="tierFilters">
      <button class="chip" data-t="all" aria-pressed="true">All 146</button>
      <button class="chip" data-t="A" aria-pressed="false">Opened report 20</button>
      <button class="chip" data-t="C" aria-pressed="false">Bounced 4</button>
      <button class="chip" data-t="B" aria-pressed="false">Emailed 122</button>
    </div>
    <div class="filters" id="cityFilters" style="margin-top:6px"></div>
    <input type="search" id="q" placeholder="Search name, city or number" autocomplete="off">
    <div class="tools">
      <button class="tool" id="tHide" aria-pressed="true">Hiding logged</button>
      <button class="tool" id="tExport">Export log</button>
      <button class="tool" id="tReset">Reset</button>
    </div>
  </header>

  <main id="listEl"></main>

  <footer>
    Built ${meta.built} from the live outreach ledger. Outcomes and notes save on this device
    only &mdash; use <b>Export log</b> to get a CSV out.<br>
    Not shown: ${meta.noPhone} contacts with no verified number, and ${meta.dnc.join(", ")},
    who asked to be unsubscribed &mdash; never call them.
  </footer>
</div>

<button class="fab" id="fab">Script</button>

<dialog class="sheet" id="sheet">
  <div class="sheet-in">
    <button class="close" id="close">Close</button>
    <h2>The script</h2>
    <p class="lbl">Three openers &mdash; match the row's dot</p>

    <h3>Opened their report</h3>
    <div class="say">&ldquo;Hi, is this [name]? Kyle here &mdash; I'm the one who sent over that AI search report for <em>[business]</em> a couple weeks back. I saw you'd had a look at it, and I never followed up properly, so I figured I'd just call. <b>Did any of it actually land, or was it not really your problem?</b>&rdquo;</div>
    <p class="note">Then stop talking. The question does the work.</p>

    <h3>Emailed, never opened</h3>
    <div class="say">&ldquo;Kyle here &mdash; I run queryclear, small shop in Florida. I sent you an email a couple weeks ago that I'm guessing went straight past you, which is fair. It ended with one question and I never got an answer, so I'll just ask it out loud: <b>when someone asks ChatGPT &lsquo;best [service] in [city]&rsquo; &mdash; do you know whether [business] comes up, or is that not on the radar yet?</b>&rdquo;</div>
    <p class="note">&ldquo;No idea&rdquo; is the answer you want &mdash; it's permission to keep going.</p>

    <h3>Email bounced</h3>
    <div class="say">&ldquo;Slightly odd reason for calling: I tried to email <em>[business]</em> a couple weeks ago and it <b>bounced straight back</b>, so the address on your listing may be dead &mdash; which you'd want to know, because if it bounced for me it's bouncing for customers too. And while I've got you &mdash; I'd run a free check on how your site shows up when people ask ChatGPT for a [service] recommendation. Want the short version?&rdquo;</div>

    <h3>The 30 seconds</h3>
    <div class="say">&ldquo;When someone asks ChatGPT &lsquo;[their question]&rsquo;, the assistant doesn't crawl the web live &mdash; it pulls from sites it can read clearly and trusts enough to name. When I looked at your site, <b>[the finding]</b>. So for a question like that, your site isn't set up to be the answer it hands back yet. Not a ranking thing, and not complicated to fix.&rdquo;</div>

    <h3>The ask</h3>
    <div class="say">&ldquo;Give me twenty minutes on a screen share and I'll walk you through what I found and what I'd fix first. No charge, and if the answer is &lsquo;not worth it for us,&rsquo; I'll tell you that. Mornings or afternoons?&rdquo;</div>
    <p class="note">Then offer two slots &mdash; &ldquo;Thursday 10 or Thursday 2?&rdquo; Never &ldquo;does that work?&rdquo;</p>

    <h3>If they're hot</h3>
    <div class="say">$497 audit, <b>credited in full</b> toward the work. Upgrade from $2,500. Full build from $6,500. Care plan $997/mo, cancel anytime. Still offer the free twenty minutes first.</div>

    <h3>Objections</h3>
    <p class="note"><b>&ldquo;How much?&rdquo;</b> &mdash; &ldquo;Depends what you need and I don't know yet. $2,500 to $6,500. The twenty minutes is free and tells us which end you're at.&rdquo;</p>
    <p class="note"><b>&ldquo;We have an SEO guy.&rdquo;</b> &mdash; &ldquo;Good, groundwork's probably there. Question is whether they've done the AI side: schema, pages that answer questions directly. Some are on it, a lot are still on the 2019 playbook. If yours is doing it well I'll say so and get out of your way.&rdquo;</p>
    <p class="note"><b>&ldquo;Guarantee we'll show up?&rdquo;</b> &mdash; &ldquo;No, and anyone who says they can is lying to you. Nobody controls what ChatGPT says. I fix the reasons a site gets skipped.&rdquo; <em>Never soften this.</em></p>
    <p class="note"><b>&ldquo;Just send something.&rdquo;</b> &mdash; &ldquo;You've already got it. But can I put twenty minutes in the diary? Cancel it if the report covers everything.&rdquo; A polite no &mdash; trade it for a slot.</p>
    <p class="note"><b>&ldquo;Never heard of you.&rdquo;</b> &mdash; &ldquo;queryclear is a SparkCreatives Inc. brand, I'm the founder, we're new &mdash; that's why I'm calling myself and why the audit's free.&rdquo; New is fine, fake is fatal.</p>
    <p class="note"><b>&ldquo;How'd you get my number?&rdquo;</b> &mdash; &ldquo;Your public Google listing. I emailed first. If you'd rather I didn't call again, say so and you're off my list.&rdquo;</p>

    <h3>What you may not say</h3>
    <div class="never">
      <b>Never</b><br>
      &times; &ldquo;I ran your business through ChatGPT and you didn't come up&rdquo; &mdash; the citation check was <b>not measured</b>. You did not verify it.<br>
      &times; &ldquo;You're invisible in AI search.&rdquo;<br>
      &times; Any guarantee of rankings or citations.<br>
      &times; Any invented client, testimonial, result, or years in business.<br><br>
      <b>Instead</b><br>
      &#10003; &ldquo;For a question like &lsquo;[q]&rsquo;, your site isn't set up to be the answer these tools hand back yet.&rdquo;<br>
      &#10003; &ldquo;These are the questions I mapped for your business.&rdquo;<br>
      &#10003; The <em>flagged</em> line on a card &mdash; that one is measured. State it flat.<br><br>
      <b>&ldquo;Did you actually check ChatGPT for us?&rdquo;</b><br>
      &ldquo;Not query by query, no. I read your site the way these tools read it and mapped the questions your customers ask. Checking each one properly is part of the paid audit &mdash; and we can check one right now together if you want.&rdquo;
    </div>
  </div>
</dialog>

<script>
  var DATA = ${JSON.stringify(data)};
  var KEY = 'qc.callpack.v1';
  var OUTCOMES = ['Booked', 'Talked', 'Voicemail', 'Gatekeeper', 'No answer', 'Not interested'];

  var log = {};
  try { log = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { log = {}; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {} };

  var tier = 'all', city = 'all', term = '', hideLogged = true;
  var listEl = document.getElementById('listEl');

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  // City chips, biggest market first — a sitting is one market at a time.
  (function () {
    var counts = {};
    DATA.forEach(function (r) { counts[r.c] = (counts[r.c] || 0) + 1; });
    var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var el = document.getElementById('cityFilters');
    el.innerHTML = '<button class="chip" data-c="all" aria-pressed="true">Everywhere</button>' +
      order.map(function (c) {
        return '<button class="chip" data-c="' + esc(c) + '" aria-pressed="false">' + esc(c) + ' ' + counts[c] + '</button>';
      }).join('');
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip'); if (!b) return;
      city = b.dataset.c;
      [].forEach.call(el.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  })();

  document.getElementById('tierFilters').addEventListener('click', function (ev) {
    var b = ev.target.closest('.chip'); if (!b) return;
    tier = b.dataset.t;
    [].forEach.call(this.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    render();
  });

  document.getElementById('q').addEventListener('input', function () {
    term = this.value.trim().toLowerCase(); render();
  });

  var hideBtn = document.getElementById('tHide');
  hideBtn.addEventListener('click', function () {
    hideLogged = !hideLogged;
    this.setAttribute('aria-pressed', String(hideLogged));
    this.textContent = hideLogged ? 'Hiding logged' : 'Showing all';
    render();
  });

  document.getElementById('tReset').addEventListener('click', function () {
    if (!confirm('Clear every logged outcome and note on this device?')) return;
    log = {}; save(); render();
  });

  document.getElementById('tExport').addEventListener('click', function () {
    var rows = [['date', 'business', 'phone', 'city', 'tier', 'outcome', 'notes']];
    DATA.forEach(function (r) {
      var e = log[r.d];
      if (!e) return;
      rows.push([e.at || '', r.n, r.p, r.c, r.t, e.o || '', e.note || '']);
    });
    if (rows.length === 1) { alert('Nothing logged yet.'); return; }
    var csv = rows.map(function (row) {
      return row.map(function (v) {
        v = String(v == null ? '' : v);
        return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'call-log.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  function matches(r) {
    if (tier !== 'all' && r.t !== tier) return false;
    if (city !== 'all' && r.c !== city) return false;
    if (hideLogged && log[r.d] && log[r.d].o) return false;
    if (term) {
      var hay = (r.n + ' ' + r.c + ' ' + r.v + ' ' + r.p + ' ' + r.d).toLowerCase();
      if (hay.indexOf(term) === -1) return false;
    }
    return true;
  }

  function cardHtml(r) {
    var e = log[r.d] || {};
    var metaBits = [r.c, r.v, r.e + (r.e === 1 ? ' email' : ' emails'), r.g].filter(Boolean).join(' · ');
    var tierName = r.t === 'A' ? 'Opened' : r.t === 'C' ? 'Bounced' : 'Emailed';
    var h = '<article class="card' + (e.o ? ' done' : '') + '" data-d="' + r.d + '">';
    h += '<div class="top"><div><p class="biz">' + esc(r.n) + '</p>' +
         '<p class="meta">' + esc(metaBits) + '</p></div>' +
         '<div class="tier"><span class="dot ' + r.t + '"></span><span class="lbl">' + tierName + '</span></div></div>';
    h += '<a class="call" href="tel:+1' + r.d + '"><span aria-hidden="true">&#9742;</span><span class="mono">' + esc(r.p) + '</span></a>';
    if (r.f) h += '<p class="note flag"><b>Measured — say it flat:</b> ' + esc(r.f) + '</p>';
    if (r.q) h += '<p class="note">Their question: “<b>' + esc(r.q) + '</b>”</p>';
    var links = [];
    if (r.r) links.push('<a href="' + esc(r.r) + '" target="_blank" rel="noopener">Their report</a>');
    if (r.w) links.push('<a class="dim" href="' + esc(r.w) + '" target="_blank" rel="noopener">Their site</a>');
    if (r.m) links.push('<a class="dim" href="mailto:' + esc(r.m) + '">' + esc(r.m) + '</a>');
    if (links.length) h += '<p class="links">' + links.join('') + '</p>';
    h += '<div class="outcomes">' + OUTCOMES.map(function (o) {
      return '<button class="obtn" data-o="' + o + '" aria-pressed="' + (e.o === o) + '">' + o + '</button>';
    }).join('') + '</div>';
    h += '<textarea class="jot" rows="1" placeholder="Notes — who answered, what they said, follow-up date">' + esc(e.note || '') + '</textarea>';
    return h + '</article>';
  }

  function render() {
    var rows = DATA.filter(matches);
    var logged = 0, booked = 0;
    DATA.forEach(function (r) {
      var e = log[r.d];
      if (e && e.o) { logged++; if (e.o === 'Booked') booked++; }
    });
    document.getElementById('cDone').textContent = logged;
    document.getElementById('cBooked').textContent = booked;
    document.getElementById('cLeft').textContent = DATA.length - logged;
    document.getElementById('prog').style.width = (DATA.length ? (logged / DATA.length) * 100 : 0) + '%';

    if (!rows.length) {
      listEl.innerHTML = '<p class="empty">Nothing left here.' +
        (hideLogged ? ' Tap <b>Hiding logged</b> to see the ones you\\'ve done.' : '') + '</p>';
      return;
    }
    // No city headings: the list is ordered by tier (warmest first), so city headings
    // would fragment into repeating one-card groups. The city filter handles working
    // one market at a time, and each card already names its city.
    listEl.innerHTML = rows.map(cardHtml).join('');
  }

  // Outcome taps and notes — delegated so re-renders never lose handlers.
  listEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.obtn'); if (!b) return;
    var d = b.closest('.card').dataset.d;
    var e = log[d] || {};
    e.o = e.o === b.dataset.o ? '' : b.dataset.o;   // tap again to clear
    e.at = new Date().toISOString().slice(0, 10);
    log[d] = e; save(); render();
  });
  listEl.addEventListener('input', function (ev) {
    if (!ev.target.classList.contains('jot')) return;
    var d = ev.target.closest('.card').dataset.d;
    var e = log[d] || {};
    e.note = ev.target.value;
    log[d] = e; save();                              // no re-render: keeps focus
  });

  var sheet = document.getElementById('sheet');
  document.getElementById('fab').addEventListener('click', function () { sheet.showModal(); });
  document.getElementById('close').addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('click', function (ev) { if (ev.target === sheet) sheet.close(); });

  render();
</script>
`;

fs.writeFileSync(OUT, html);
console.log(`${(Buffer.byteLength(html) / 1024).toFixed(1)} KB → ${path.relative(ROOT, OUT)} (${data.length} rows)`);
