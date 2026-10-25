# Owner recovery and performance guardrails

Owner history now has a 15-second request timeout, retry/refresh control, case-insensitive address search, explicit expiration times, and distinct error/empty/search-empty states. Malformed history responses fail safely. Expired report links are removed when the API rejects them. New results are retained if an earlier history request completes late. API session expiration offers a direct sign-in link; audit errors receive keyboard focus. Sign-out clears displayed private data and refreshes the authenticated server boundary.

Decorative canvas work is removed from private workspaces and reports. Touch/coarse-pointer devices get a static pattern. On eligible desktop pointers, rendering is capped at 30 FPS and device pixel ratio at two. Motion preference and page visibility changes cancel/restart drawing, and reduced-motion resize redraws the static canvas. These changes reduce unnecessary rendering work; no measured battery-life, Core Web Vitals or Lighthouse score is claimed.

## Initial payload budgets

CI checks `/free-audit`, `/audit-methodology`, and the signed-out `/admin/audits` page. Each route may have at most 110 KiB of decoded HTML, 700 KiB of decoded first-party JavaScript referenced by its initial script tags, and 14 initial scripts. Every referenced script must return 200. This catches payload growth; it does not measure total transfer, fonts/images, lazy chunks, client-side prefetching, real-user latency or all performance dimensions.

Observed production baseline before this change on October 25, 2026:

| Route | HTML bytes | Initial script bytes | Scripts |
| --- | ---: | ---: | ---: |
| /free-audit | 67,592 | 622,381 | 10 |
| /audit-methodology | 75,029 | 605,606 | 9 |
| /admin/audits | 33,618 | 623,159 | 10 |

Tests cover history parsing/search/expiry, error recovery, timeout recovery, keyboard focus, real session-cookie sign-out, absence of private-page canvas, stopping after a reduced-motion preference change, static touch rendering, and initial payload budgets. Existing responsive and accessibility tests remain in the release gate.

The owner configured the production administrator credential and the live sign-in form is verified. Its value was not read. Authenticated production owner workflow verification still requires the owner to sign in through a secure browser flow. No new secrets, providers, emails, model calls or subscriptions are introduced by this release.
