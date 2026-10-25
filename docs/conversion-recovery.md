# Inquiry and report recovery

Inquiry forms preserve inputs across request failures, focus the invalid website or error summary, enforce field lengths matching the API, and stop waiting after 25 seconds. Invalid/non-JSON success responses cannot falsely navigate to the thank-you screen. Timeout copy avoids claiming that an in-flight submission was not received.

Unavailable report links show a dedicated explanation and links to run a new preview or get help. They retain no-index, no-store, and no-referrer protections and do not disclose whether a particular token ever existed.

Three new browser scenarios run at phone/tablet/desktop sizes: recovery from an HTML gateway failure, keyboard focus on invalid website input, and accessible expired-report recovery. API fixtures send no messages or payments. This brings the browser suite to 33 cases; the 321 unit/contract tests remain passing.
