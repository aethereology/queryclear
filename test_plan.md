# Test Plan / Definition of Done — queryclear

> STATUS: living checklist. Usable now as the quality gate for any queryclear
> page. Automated tests get added when there's code (Phase 1).

Every public page must pass this before it ships. This is also our product:
if our own site fails any of these, we can't sell GEO.

## GEO / AI-search readiness
- [ ] Valid JSON-LD schema (validate via Google Rich Results / Schema.org)
- [ ] Correct schema types only where real data supports them
- [ ] `llms.txt` present and accurate
- [ ] `sitemap.xml` present, correct URLs
- [ ] `robots.txt` present, not blocking what should be crawled
- [ ] Clear heading hierarchy (one h1, logical h2/h3)
- [ ] Title tag + meta description on every page
- [ ] Open Graph tags present
- [ ] AI-readable business summary present
- [ ] Internal links present and sensible

## Performance
- [ ] Lighthouse performance ≥ 90
- [ ] LCP < 2.5s, CLS < 0.1
- [ ] Reasonable bundle size (no bloat)

## Accessibility
- [ ] WCAG 2.1 AA: labels, contrast, keyboard nav, focus states
- [ ] Forms fully accessible (labels, errors announced)
- [ ] Passes axe / Lighthouse a11y ≥ 90

## Responsiveness / cross-device
- [ ] Mobile-first; correct at 360px, 768px, 1280px
- [ ] No horizontal scroll, tap targets adequate

## Functional
- [ ] Lead form validates and submits; data captured (no silent failures)
- [ ] CTAs go where they say
- [ ] No console errors

## Honesty gate (brand rule)
- [ ] No fake testimonials, clients, reviews, ratings, certs
- [ ] No invented business details (address/phone/etc.)
- [ ] No guaranteed-ranking / guaranteed-citation claims

## Future (when code exists)
- [ ] Unit/integration tests for the audit/report generator
- [ ] CI runs Lighthouse + a11y + schema validation on PRs
