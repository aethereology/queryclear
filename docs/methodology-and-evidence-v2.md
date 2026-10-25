# Methodology and evidence release v2

The public `/audit-methodology` page discloses crawl scope, heuristics, model sampling, triage order, absent scoring and exclusions. Report UI and text downloads preserve the methodology recorded by the runtime, including legacy reports without metadata. Technical findings now display their source URLs directly.

The paired runtime release retains all distinct page evidence when grouping equivalent actions. Action and provenance are part of the grouping key, preventing unrelated fixes from being discarded. Character-count rules are explicitly heuristics; short extracted HTML, absent descriptions and absent structured data are low-priority review items. The method version changes to `free-readiness-preview-v2`, so comparisons can distinguish methodology changes from website changes.

Frontend validation permits bounded multi-page evidence (16,000 characters) and rationale (24,000), accommodating five fetched pages without dropping URLs. Deploy this frontend compatibility change before the runtime release. Existing request/response size limits remain in force.

Validation: unit tests cover export provenance, older reports and aggregate evidence bounds; browser cases cover discoverability, metadata, sample disclosure, mobile layouts and accessibility. Runtime tests exercise repeated-page evidence retention, exact duplicate suppression, different fixes with identical titles, and conservative heuristic severity. These deterministic fixtures do not establish real-world model accuracy or named-engine citation accuracy.

Remaining limitations: owner production authentication awaits secure administrator credential configuration. No customer accounts, durable history, scheduled paid probes or new external alerting service are enabled. Runtime model output remains variable and requires review. Version 1 cached reports retain their original findings and recorded methodology until expiry.
