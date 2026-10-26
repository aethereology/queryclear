import Link from "next/link";
/** An illustrative finding, not a generated audit or live analytics. */
export function EvidencePreview() {
  return (
    <figure className="evidence-preview">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 text-xs">
        <span className="font-medium">The clarity workspace</span>
        <span className="evidence-tag">Illustrative example</span>
      </figcaption>
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="preview-sidebar border-b border-line p-4 sm:border-r sm:border-b-0">
          <p className="mono-label">Readiness review</p>
          <div className="mt-5 grid gap-2 text-xs">
            <span className="rounded-md bg-pine px-3 py-2 text-paper">
              Action plan
            </span>
            <span className="px-3 py-2 text-muted">Page evidence</span>
            <span className="px-3 py-2 text-muted">Modeled scenarios</span>
          </div>
        </div>
        <div className="min-w-0 p-5 sm:p-7">
          <p className="mono-label">Example finding / 01</p>
          <h2 className="mt-3 text-xl! leading-snug!">
            Give your service page a clear heading.
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="evidence-tag">On-page observation</span>
            <span className="rounded-full bg-paper-2 px-3 py-1 text-xs text-muted">
              Medium priority
            </span>
          </div>
          <div className="mt-6 rounded-lg border border-line bg-paper-2 p-4">
            <p className="text-xs font-medium">Evidence</p>
            <code className="mt-2 block break-words text-xs leading-relaxed text-muted">
              /services — no H1 found in returned HTML
            </code>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            <strong className="text-ink">Recommended action</strong>
            <br />
            Add one descriptive primary heading that names the service. Check
            the rendered page before editing.
          </p>
          <div className="mt-6 border-t border-line pt-4 text-xs text-muted">
            Observed evidence → practical action → human review
          </div>
        </div>
      </div>
      <div className="border-t border-line px-5 py-4 text-xs text-muted">
        Your report uses your fetched pages.{" "}
        <Link
          href="/audit-methodology"
          className="font-medium text-pine underline underline-offset-4"
        >
          See how we check them
        </Link>
      </div>
    </figure>
  );
}
