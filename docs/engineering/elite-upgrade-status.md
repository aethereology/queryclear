# Elite upgrade verification — 2026-10-24

## Architecture and verified baseline

- Website: aethereology/queryclear, Vercel queryclear, main production branch.
- Python runtime: aethereology/herqseo, services/agent-runtime; production commit 7885d4a, deployed through CLI. It is not a directory in the website repo.
- Production POST /api/public/audit returned 200 with a stored summary for https://queryclear.com/. No runtime authentication change was necessary.
- Baseline website tests: 300 passing.

## This release

- Bound public audit request bodies to 8 KiB and reject wrong media types before accessing storage.
- Return sanitized JSON and support IDs for storage failures, rate limits and runtime failures; no-store on every handled response.
- Preserve cost reservations when upstream work might have consumed budget.
- Give the route a 60-second execution budget; browser stops waiting after 65 seconds and exposes support references.
- Clear stale summary state on rerun. Improve mobile report wrapping, evidence disclosure and accessible draft toggles.
- Expose email-provider acceptance/failure honestly on unlock and log delivery states without contact information. Acceptance does not guarantee inbox receipt.
- Add 12 public route contract tests and a scheduled, cost-free public smoke check every six hours. GitHub Actions failures are the monitoring signal; this is not an external alerting integration.

## Remaining release gates / backlog

1. Live browser journey verified through full report unlock using the user-approved hello@queryclear.com recipient. Inbox receipt is not independently confirmed; the UI unlock alone is not proof of mailbox delivery.
2. Runtime PR fixes the clock-dependent test and adds actual crawl coverage/time and conservative modeled recommendation priority. Python suite: 185 run, 178 pass, 7 database integration tests require CI.
3. Runtime scenario results are modeled hypotheses, not live AI-engine measurements. Do not promote an absent brand in one model sample into a visibility score or ranking claim.
4. Actual crawl coverage/timestamps are added to the report contract and validated in the frontend. Older cached reports explicitly say coverage was not recorded. Wider model-quality evaluation against curated sites remains open.
5. Full authenticated dashboard, payment, consent, accessibility and mobile regression coverage remain separate work. This release does not certify those flows.
6. Scheduled smoke checks exercise rendering and validation, not model availability, Redis persistence or email delivery. A real paid audit probe should be deliberately budgeted and use an authorized recipient.
