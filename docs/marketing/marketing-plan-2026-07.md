# queryclear — Marketing Plan (v1, 2026-07-09)

> fCMO-style 12-month plan, structured by AARRR (Acquisition, Activation,
> Retention, Referral, Revenue). Drafted by Aethera from repo materials
> (CLAUDE.md ground truth, roadmap.md, product_spec.md, tasks.md,
> social-media-gameplan.md, outreach batch docs) without founder interview —
> every section is open to revision. Assumptions and unknowns are flagged in
> §13 Open decisions rather than glossed over.
>
> Voice rules apply to everything here: readiness not outcomes, no guaranteed
> rankings/citations, no fake anything, no hype buzzwords.

---

## 1. Executive summary

**Where we are.** queryclear.com is live, repositioned ("Modern SEO for the AI
search era"), with a complete self-serve funnel: instant free audit at
`/free-audit` → $497 Discovery Sprint → Website Upgrade from $2,500 → (built,
not yet deployed) $997/mo AI Search Care Plan. One real client audit has been
delivered and paid motion is proven end-to-end. Cold outreach is running at
~10–15 med-spa emails/day with a QA'd preview pipeline; masterlist is at ~82
contacts. Revenue phase: $0–10K — the grueling phase where the binding
constraint is **at-bats, not assets**.

**Three big bets for the next 12 months:**

1. **Cold outreach is the revenue engine until it isn't.** Nothing else in the
   stack produces a first check faster than 10–15 personalized, honest emails a
   day into one vertical (med spa) in one region. Everything else supports this.
2. **The free audit is the conversion asset; every marketing surface points at
   it.** One CTA everywhere: run the free audit. Teardowns, outreach, social,
   vertical pages — all funnel into `/free-audit`, which already emails the
   prospect their report with the three paid offers attached.
3. **Founder-led content compounds the entity signal.** 2–3 LinkedIn/X posts a
   week built from work already done (audits → teardowns) makes queryclear
   itself citeable in AI answers — the product demonstrating itself. This feeds
   the slower B2B Operator pipeline without a separate workload.

**90-day outcome to aim at:** first Care Plan subscriber, 3+ paid Discovery
Sprints closed from outreach, one Upgrade signed, outreach masterlist past 500
contacts across 3+ metros, and the med-spa vertical proven well enough to
template a second vertical.

**12-month outcome to aim at:** a repeatable local motion (audit → sprint →
upgrade → care plan) producing $3–5K/mo recurring plus project revenue, 2–3
proven verticals, and 1–3 B2B Operator design partners — all still solo-founder
operable because the agent stack does the labor.

---

## 2. Strategic frame

**Category claim.** Modern SEO for the AI search era. GEO is part of SEO, not a
separate discipline. We make a business's website easier for search engines and
AI answer engines (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews,
Bing Copilot) to crawl, understand, summarize, trust, and cite. We sell
**readiness**, never outcomes.

**ICP (two tracks, do not blend the feeds):**

| | Local / done-for-you (primary) | AI Search Operator (secondary) |
|---|---|---|
| Buyer | Owner of a med spa (current focus vertical), then dental/aesthetics/home service | Growth/marketing lead at B2B SaaS, ~Series A–C |
| Pain | "I'm invisible when people ask AI who's best near me" | AI search eroding the funnel; no AEO specialist on staff |
| Sales cycle | Fast, fear-shaped → fast yes ($497) | Slow, concierge, design-partner |
| Where they live | Email inbox, Instagram, local groups | LinkedIn, X |

**Business-model logic.** The money ladder: free audit (lead) → $497 Discovery
Sprint (credited toward upgrade) → Upgrade from $2,500 (includes Stack kit) →
Care Plan $997/mo (recurrence) → Aethelo automation (internal upsell, not
public). The $497 sprint is the low-friction front door; the Care Plan is what
turns project revenue into MRR; the Operator track is the long-game recurring
B2B bet.

**Brand voice non-negotiables.** Plain, concrete, honest, founder-led,
technical but understandable. Banned: hype buzzwords, guarantee language, fake
familiarity, invented details. The site itself is the first case study — our
own GEO hygiene is a sales asset.

---

## 3. Current state (scored from materials, 2026-07-09)

Solo founder (Kyle) + agent stack (Claude Code "Aethos" as CEO/CTO/COO, Pedro/
Codex as cofounder, Aethera as portfolio overseer, plus purpose-built agents:
outreach-drafter, prospector, prospect-curator, ops-watchdog, vertical-page-
builder). Budget: bootstrapped; marketing spend ≈ tooling only (Vercel, Resend,
Upstash, Apify/Firecrawl credits — well under $200/mo). No paid ads. No hires.

Condensed rubric scores (0–5, from materials — push back where you have better data):

| Area | Score | Evidence / gap |
|---|---|---|
| Positioning & messaging | 4.5 | Repositioning done 2026-06-11; ladder is coherent; voice enforced in code (`lib/site.ts`) |
| Website & conversion surface | 4.5 | 38 routes, schema/metadata/sitemap/llms.txt, instant free audit, Stripe checkout live |
| SEO/GEO technical readiness | 3.5 | Own infra excellent, BUT: **Cloudflare is blocking AI crawlers in prod robots.txt** (founder fix pending) and the site appears absent from Google's index (~5-week-old domain) — both undercut the pitch |
| Outbound engine | 4 | Daily preview→QA→send pipeline works; 82 contacts; follow-up (due) queue exists. Lead sourcing is the bottleneck (~5 uncontacted rows left) |
| Content & social | 1.5 | Excellent playbooks exist (social gameplan, 14-day post bank, 5-day kickstart) but nothing indicates consistent publishing has started |
| Proof & case studies | 2 | Goldleaf fictional sample audit is strong; first real client (Maple Bear) closed its business — we currently have **zero live real-client proof** |
| Email/deliverability | 4 | DMARC at p=quarantine, DKIM/SPF pass, hello@ live, branded templates |
| Retention/recurrence | 2.5 | Care Plan built + verified but **not deployed**; no subscriber yet |
| Referral | 0.5 | Nothing built (appropriate for stage) |
| Analytics/measurement | 2 | GSC + Bing configured; no conversion dashboard or pipeline metrics beyond masterlist statuses |

**Growth phase:** $0–10K. Binding constraint: number of honest, personalized
at-bats per week in front of one vertical, and the proof to convert them.

**In-flight:** med-spa vertical page + care-plan funnel redesign (code-complete,
founder-gated deploy). **Stuck/blocked:** Cloudflare AI-crawler block (dashboard-
only fix), Care Plan Stripe test-mode smoke, Google indexing (needs GSC
request-indexing pass).

---

## 4. Acquisition

**Channel verdicts:**

| Channel | Status | Verdict |
|---|---|---|
| Cold email (med spa, metro-by-metro) | Active, working | **Primary. Scale carefully to 12–15/day, every weekday.** |
| Organic search/GEO (own site) | Live but young | Keep shipping vertical pages; fix indexing + Cloudflare block; patience |
| Founder-led LinkedIn/X | Playbook written, not shipping | **Start now at minimum viable cadence (2 posts/wk)** — it's pre-written in `14-day-social-posts.md` |
| Instagram (vertical) | Planned | Defer until LinkedIn/X rhythm is automatic (per social gameplan) |
| Paid ads | Not running | **Skip until ≥2 organic-channel conversions prove the message.** Bootstrapped budget can't buy learning cheaper than outreach already does |
| Directories/local | Not started | Cheap wins: Bing Places, relevant agency/service directories, `stripe`/partner listings — one batch afternoon, then done |
| PR/HARO-style | Not started | Opportunistic only; founder quotes on AI-search topics |

**90-day acquisition moves (in order):**

1. **Keep the daily outreach loop unbroken.** `/swarm` every working morning;
   founder fires sends. When a CSV drops below ~2 days of runway, run
   `/prospect-city` for the next metro the same day (current sequence exhausted:
   Jacksonville ✅, Fort Lauderdale ✅, Georgia ✅ → next: Orlando → Tampa →
   St. Augustine → Miami).
2. **Unblock the two credibility holes:** Cloudflare AI-crawl block (founder,
   dashboard, ~10 min) and GSC request-indexing on the money pages + Bing
   equivalent. A GEO company whose own robots.txt blocks GPTBot is a closed
   deal waiting to be lost.
3. **Ship the med-spa vertical page** (founder-gated deploy is already queued)
   so outreach emails can link a vertical-specific page instead of the generic one.
4. **Start the 5-day zero-follower kickstart, then hold 2 posts/week** from the
   pre-written bank. Every real audit becomes a teardown post (anonymized if
   needed). One CTA: `/free-audit`.
5. **A/B the outreach angle** once volume justifies it (≥150 sends/variant):
   current "findings-specific" angle vs. a "what ChatGPT says about you" angle.

**12-month:** second and third verticals (dental, aesthetics/salon or home
services) each with its own page + prospect lists; Operator track fed by
founder content + 1:1 LinkedIn outreach to SaaS growth leads (small, curated,
no spray); revisit paid (a small $500–1,000 retargeting/brand test) only after
the local motion converts predictably.

---

## 5. Activation

Activation = a stranger runs the free audit, sees their gaps, and books/pays.

Already strong: instant `/free-audit` with email-gate unlock, report emailed
with the three paid CTAs, `/scorecard` self-assessment as a second on-ramp,
lead form → Resend alerts, `/thank-you` flow.

**Moves:**

1. **Deploy the care-plan funnel redesign** (already code-complete): the $497
   sprint framed as credited discovery materially improves the free→paid step.
2. **Follow-up sequence discipline:** the `due` queue is the activation engine
   for outreach leads — never let a working day pass without previewing/sending
   due touches. (Assisted nurture exists; use it.)
3. **Add a booking link** (Cal.com or M365 Bookings) to the audit-unlock email
   and `/ai-visibility-audit` page so a hot prospect can book the sprint
   walkthrough without an email round-trip. Small build, real friction cut.
4. **Instrument the funnel minimally:** weekly counts of free audits run,
   unlocks (emails captured), sprint checkouts, inquiries. One markdown table
   in `docs/marketing/metrics.md` updated by the ops agent is enough at this stage.

---

## 6. Retention

At this stage retention = the Care Plan + staying useful between projects.

1. **Care Plan is the retention product — ship it.** Blockers are founder-sized:
   Stripe test-mode subscription smoke, confirm price/name, deploy. First
   subscriber target: an Upgrade client within 30 days of their project ending.
2. **Monthly "AI visibility re-check" email** to past clients and warm leads
   (manual at first): what changed in their AI answers this month. It's the Care
   Plan pitch delivered as genuine usefulness.
3. **Report honestly, only measured data** — the Care Plan's monthly report is
   the retention mechanism; it must never drift into vanity metrics.

Explicitly not now: community, newsletter-as-product, client portal.

---

## 7. Referral

Q3+ — long-game, mostly not in scope until there are retained clients.

The one seed worth planting now: **ask every delivered-audit client** (in the
delivery email/walkthrough) "who else do you know who's invisible in AI
answers?" — a sentence, not a program. Formal referral/partner mechanics
(agency white-label, rev-share) wait until ≥5 paying clients.

---

## 8. Revenue

**Pricing is set and public; don't fiddle with it for 90 days.** Free → $497
sprint (credited) → Upgrade from $2,500 → Care Plan $997/mo. Operator: unpriced
early access, case-by-case — fine for design partners; set a floor before
partner #2 so goodwill doesn't set the anchor.

**Unit economics (targets, since no history yet — see §13):** at 12 sends/day ×
~21 working days ≈ 250 emails/mo. Conservative cold-email math (2–4% reply,
25–50% of replies to a free audit, a third of those to sprint) suggests **1–3
sprints/mo from outreach alone**; each sprint credits into a $2,500+ upgrade at
some take rate, and each upgrade is a Care Plan candidate. The model to prove:
**one month of outreach pays for itself with one sprint; one upgrade/mo ≈
$2,500–6,500; 3–5 Care Plans ≈ $3–5K MRR.** Track actuals against this from day
one — CAC is currently unknown and is the highest-impact number to learn.

**Revenue moves:** deploy care-plan funnel (week 1); first real paid audit
delivered end-to-end via the SOP (replaces the lost Maple Bear proof); write
the Operator pricing floor before signing partner #2.

---

## 9. 90-day roadmap

Owner key: **F** = founder (only things agents cannot do), **A** = agent stack
(Aethos/Aethera + project agents). AARRR tag in brackets.

**Weeks 1–2 — Unblock (mostly founder-sized, mostly minutes each):**
- [Acq] F: Cloudflare → allow AI crawlers, verify robots.txt clean
- [Acq] F: GSC Pages report + Request-index money pages; same in Bing
- [Rev] F: Stripe test-mode Care Plan smoke → A: deploy funnel redesign + med-spa page (already code-complete)
- [Acq] A: daily `/swarm`; `/prospect-city orlando` when Georgia CSV exhausts (~now)
- [Acq] F: post day 1 of the 5-day kickstart (content is pre-written)

**Weeks 3–4 — Foundation:**
- [Acq] A: Orlando + Tampa prospect lists built and in rotation; masterlist >200
- [Act] A: booking link wired into audit-unlock email + sprint page
- [Act] A: `docs/marketing/metrics.md` weekly funnel table (audits run / unlocks / sprints / inquiries)
- [Acq] F: 2 posts/wk cadence holding; first teardown post from a real free-audit run

**Weeks 5–8 — Velocity:**
- [Rev] F+A: close and deliver the first paid sprint(s); publish anonymized teardown proof
- [Acq] A: second vertical page (dental) built via `/build-vertical` once med-spa page shows any conversion signal
- [Acq] A: directory batch (Bing Places + relevant listings) — one afternoon
- [Ret] F: pitch Care Plan to every sprint/upgrade client at delivery

**Weeks 9–12 — Compound:**
- [Ret] Target: first Care Plan subscriber live
- [Acq] A: outreach A/B (findings-angle vs. what-AI-says angle) once ≥150 sends/variant
- [Acq] F: 3–5 curated LinkedIn conversations with B2B SaaS growth leads (Operator track, no spray)
- [All] A: 90-day retro against §13 metrics → v2 of this plan

---

## 10. 12-month outlook (quarterly)

- **Q3 2026 (Jul–Sep):** the 90-day roadmap above. Exit: paying motion proven
  (≥3 sprints, ≥1 upgrade, first Care Plan), 3 metros + 1–2 verticals live,
  content cadence automatic.
- **Q4 2026:** template verticals 2–3; masterlist >800; 2–3 Care Plans
  ($2–3K MRR); Operator design partner #1 signed with a priced floor;
  first genuine case study page (real client, real numbers, permission).
- **Q1 2027:** decide the fork with data — double down local (more verticals/
  metros, maybe first contractor for fulfillment) vs. lean Operator (if design
  partners renew and referrals appear). Small paid test ($500–1K) only if
  organic conversion rates are known.
- **Q2 2027:** repeatability: SOP-driven fulfillment, 5+ Care Plans, outreach
  partially delegated to agents end-to-end (send still human-fired), plan v3.

**Funding-stage note:** bootstrapped throughout; there is no round. The
capability unlock here isn't money — it's **proof**. Each real client unlocks
the next marketing asset (case study → teardown → vertical credibility) at $0.

---

## 11. Marketing operations stack

The differentiator: a solo founder + this agent stack outputs the work of a
small marketing team. Already built and working:

| AARRR stage | Motion | What executes it |
|---|---|---|
| Acquisition | Daily outreach prep + QA | `/outreach-daily` → outreach-drafter agent → `tools/outreach-audit.mjs` (preview) → **founder fires --send** |
| Acquisition | Lead sourcing | `/prospect-city` → prospector (Apify Google Maps, ~$0.50/run) + prospect-curator → clean CSV + batch doc |
| Acquisition | Vertical landing pages | `/build-vertical <niche>` → code-complete page, deploy founder-gated |
| Acquisition | Social content | Pre-written banks (`14-day-social-posts.md`, 5-day kickstart) + marketing-skills (`social`, `copywriting`) for refills |
| Activation | Instant free audit | `/free-audit` (agent-runtime, rate-limited) + unlock email with paid CTAs |
| Activation/Retention | Follow-up nurture | `due` queue in outreach CLI; Resend for delivery |
| All | Health monitoring | `/ops-check`, `/swarm` morning briefing; Aethera daemon portfolio-wide |
| Measurement | Funnel table | ops agent updates `docs/marketing/metrics.md` weekly (to build, trivial) |

Gaps worth wiring when needed (not before): HubSpot-style CRM (masterlist
suffices for now), Stripe MCP authorization (would unblock agent-side
subscription smoke tests), GA4 or Vercel analytics review cadence.

---

## 12. Tactical idea bank (condensed)

Cross-reference of the marketing-ideas library against this business, statused.
(Full 139-idea sweep deliberately not pasted — most are Skip at this stage;
this is the shortlist that matters. Legend: **Now** / **Q4** / **2027** / **Skip**.)

| Idea | Stage | Status | Note |
|---|---|---|---|
| Niche cold outbound, metro-by-metro | Acq | **Now** | The engine; running |
| Free tool as lead magnet | Acq/Act | **Now** | `/free-audit` + `/scorecard` — built; promote them |
| Founder-led LinkedIn/X | Acq | **Now** | Playbook + post bank exist; start |
| Teardown content (audit → post) | Acq | **Now** | Flagship format per social gameplan |
| Vertical landing pages | Acq | **Now** | med spa live-in-code; dental next |
| Directory submissions | Acq | **Now** (one batch) | Cheap, one-time |
| Booking-link friction cut | Act | **Now** | Small build |
| Subscription/retainer productization | Ret/Rev | **Now** | Care Plan — ship it |
| Case studies | Acq/Rev | **Q4** | Blocked on a real retained client + permission |
| Referral ask (informal) | Ref | **Now** (one sentence) | Formal program 2027 |
| Cold calling / SMS | Acq | **Skip** | Compliance + founder time; email works |
| Paid search/social | Acq | **2027, maybe** | Only after organic conversion rates known |
| Webinars/events | Acq | **Skip** | Solo-founder time sink at this stage |
| Affiliate/white-label for agencies | Ref/Rev | **2027** | Real option once fulfillment is SOP'd |
| Programmatic SEO | Acq | **Skip** | We sell against thin pages; hand-built verticals only |
| Newsletter | Ret | **Skip for now** | Monthly re-check email to warm list instead |
| PR / expert quotes | Acq | Opportunistic | Founder POV on AI-search stories when easy |

---

## 13. Measurement, RACI, open decisions

**North star (this phase):** paid conversions per month (sprints + upgrades +
Care Plan starts). **Leading indicators:** outreach sends/wk, reply rate, free
audits run/wk, unlock rate, booked walkthroughs. All trackable from the
masterlist + Resend + Stripe with zero new tooling.

**RACI (compressed):** Founder — accountable for everything; responsible for
sends, deploys, Cloudflare/Stripe/GSC dashboard actions, posting, sales calls.
Agent stack — responsible for prospecting, drafting, QA, pages, monitoring,
metrics, plan upkeep. No third parties.

**Open decisions (highest impact first):**
1. **CAC / conversion actuals are unknown** — every §8 number is a target, not
   a fact. Start the weekly metrics table immediately; revise the plan when 4
   weeks of data exist.
2. **Cloudflare AI-crawler block** — founder dashboard action; until fixed, the
   flagship pitch is contradicted by our own robots.txt.
3. **Care Plan final price/name confirmation** + Stripe smoke → deploy.
4. **Operator pricing floor** before design partner #2.
5. **Social: does the founder commit to 2 posts/wk?** If genuinely no, say so
   and we drop it from the plan rather than let it rot as a guilt item.
6. **Font licensing risk** (RZ Regular/Hagrid Trial in prod) — accepted by
   founder 2026-07-08; noted here because "trustworthy" is a brand pillar.
7. **Next-metro sequence confirmation:** Orlando → Tampa → St. Augustine →
   Miami assumed; reorder freely.

**Appendix — related repo docs:** `social-media-gameplan.md`,
`14-day-social-posts.md`, `5-day-zero-follower-kickstart/`,
`outreach/README.md` + batch docs, `docs/playbooks/running-an-audit.md`,
`product_spec.md`, `roadmap.md`.
