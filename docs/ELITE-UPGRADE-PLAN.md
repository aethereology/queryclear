# QueryClear Elite Upgrade Program

Status: proposed execution plan; no performance, revenue, or accuracy claims are implied by this document.

## North star
The most trustworthy and actionable modern-search website assessment for service businesses. Every finding must be reproducible, explainable, and tied to an owner and next action. Reliability and truthful measurement outrank feature count.

## P0 — Make the existing audit dependable (ship before growth)
- [ ] Merge and verify public-audit tenant-default fix (PR #1) after checking production environment variables.
- [ ] Trace request IDs from browser → Next.js API → Python runtime. Log structured stage, latency, status, and sanitized error category; never log credentials, report tokens, or full user-submitted content.
- [ ] Add health/readiness checks that verify runtime reachability and configuration without disclosing secrets or spending model tokens.
- [ ] Distinguish invalid URL, blocked site, rate limit, daily budget, runtime timeout, upstream model error, and malformed response in user-facing messages.
- [ ] Add end-to-end tests with a deterministic fixture website and mocked runtime, plus one controlled staging smoke test of the real runtime.
- [ ] Verify Redis atomicity and TTL behavior under concurrent audits, and enforce private-address / redirect SSRF protection in *both* services.
- [ ] Confirm the Python runtime's deployment, matching shared secret, matching tenant identifiers, and OpenAI billing/limits.
- [ ] Establish an incident runbook: rollback, feature pause, alerts, ownership, and customer communication.

Exit criteria: 20 consecutive controlled staging scans succeed for reachable fixtures; expected error scenarios return actionable statuses; no accidental model calls for rejected URLs; real production canary works; no sensitive data in logs.

## P1 — Trust and measurement
- [ ] Publish methodology, scoring weights, sample size, limitations, and a dated version identifier.
- [ ] Separate *observed crawl facts*, *modeled answer scenarios*, and *actual live-engine observations* in both data and UI.
- [ ] Attach evidence URL, observation timestamp, and reproducible check to each finding.
- [ ] Remove unverifiable AI citation probabilities and ranking promises.
- [ ] Produce an accessible, exportable report with prioritized fixes, severity, impact, confidence, and estimated effort.
- [ ] Add verified founder/company identity, privacy/retention details, support SLA, transparent USD pricing, and permissioned case studies.

Exit criteria: every report statement can be traced to evidence or clearly labeled estimation; methodology and sample report are publicly accessible.

## P2 — Product excellence
- [ ] Run usability testing on URL submission, progress, results, email unlock, and upgrade checkout.
- [ ] Optimize mobile layout, keyboard navigation, contrast, Core Web Vitals, and WCAG 2.2 AA checks.
- [ ] Compare scans over time using stable finding IDs and explain score changes.
- [ ] Support safe retries and idempotency to avoid duplicate cost and duplicate emails.
- [ ] Add user-requested deletion and short retention defaults; document third-party processors.
- [ ] Add account-free shareable *redacted* summaries with explicit user consent.

Exit criteria: accessibility and performance budgets enforced in CI; documented retention and deletion tests; no unexpected repeat charges.

## P3 — Distribution and growth
- [ ] Create 3 consented case studies with before/after implementation evidence (not fabricated ranking outcomes).
- [ ] Build repeatable public teardown content based on reproducible observations.
- [ ] Track visitor → audit start → completion → unlock → qualified lead → paid conversion with consent-aware analytics.
- [ ] A/B test one meaningful funnel change at a time; report sample sizes and uncertainty.
- [ ] Establish support triage, response time targets, and customer feedback loop.

## Engineering release policy
1. No production deployment without green lint, tests, typecheck, and build.
2. Every API change requires success, failure, timeout, and abuse-path tests.
3. Secrets remain in server-side environment variables, never browser bundles or logs.
4. Feature flags and rollback instructions accompany high-risk releases.
5. Any measured claim needs a source, timestamp, and explicit methodology.
6. Weekly review: audit success rate, p95 completion time, 5xx rate, cost per successful scan, conversion, and customer-reported accuracy.

## Immediate owners / dependencies
- GitHub CI: added in this PR; must be enabled as required branch protection after it passes.
- Vercel and agent-runtime: requires deployment access and runtime logs; GitHub code changes alone cannot fix missing production configuration.
- Business: founder to confirm support contact, legal entity wording, case-study permissions, and pricing.

## First seven days
Day 1: unblock production audit and document actual failure.
Day 2: add runtime diagnostics and error taxonomy.
Day 3: integration tests and staging canary.
Day 4: report methodology and evidence schema.
Day 5: UX/accessibility audit and critical fixes.
Day 6: first verified case study and sample report.
Day 7: release review, reliability dashboard, and next sprint scope.
