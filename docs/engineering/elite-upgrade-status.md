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
- Add 12 public route contract tests and a scheduled, cost-free public smoke check every six hours. GitHub Actions failures are the monitoring signal; this is not an external alerting integration.

## Remaining release gates / backlog

1. Live email delivery and complete report unlock need a designated test recipient; existing mocked contract tests cover delivery failures, persistence, claims, and replay behavior. Do not send unsolicited test reports to real prospects.
2. Python test baseline initially exposed an exact-floating-time assertion failure, plus missing local optional dependencies. Track runtime changes separately and verify its CLI deployment source before release.
3. Runtime scenario results are modeled hypotheses, not live AI-engine measurements. Do not promote an absent brand in one model sample into a visibility score or ranking claim.
4. Add actual crawl coverage/timestamps and source evidence to the runtime report contract; evaluate against curated site fixtures before changing model behavior.
5. Full authenticated dashboard, payment, consent, accessibility and mobile regression coverage remain separate work. This release does not certify those flows.
6. Scheduled smoke checks exercise rendering and validation, not model availability, Redis persistence or email delivery. A real paid audit probe should be deliberately budgeted and use an authorized recipient.
