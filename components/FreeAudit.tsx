"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MonoLabel } from "@/components/ui";
import { AuditReportView } from "@/components/AuditReportView";
import type { AuditReportData } from "@/lib/agent-runtime";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface AuditSummary {
  token: string;
  domainUrl: string;
  pageTitle: string;
  technicalIssues: number;
  measuredChecksWithoutCitation: number;
  modeledSamplesWithoutBrand: number;
  recommendations: number;
  topFindings: { title: string; severity: string }[];
}

interface MarketingAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
}

type Phase = "input" | "summary" | "gated" | "full";

const BTN =
  "btn-hex inline-flex items-center justify-center gap-2 border border-lime bg-lime px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime disabled:opacity-70";
const INPUT =
  "input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2"
    />
  );
}

function readMarketingAttribution(): MarketingAttribution | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const attribution: MarketingAttribution = {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
    referrer: document.referrer || undefined,
    landingPath: `${window.location.pathname}${window.location.search}`,
  };
  return Object.values(attribution).some(Boolean) ? attribution : undefined;
}

export function FreeAudit() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("input");
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [gatedDomain, setGatedDomain] = useState("");
  const [fullReport, setFullReport] = useState<AuditReportData | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "input") resultRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (error) urlInputRef.current?.focus();
  }, [error]);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    trackAnalyticsEvent("audit_preview_start");
    setBusy(true);
    setError(null);
    setSummary(null);
    setPhase("input");
    try {
      const res = await fetch("/api/public/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domainUrl: url.trim() }),
        signal: AbortSignal.timeout(65_000)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reference = typeof data.requestId === "string" ? ` Support reference: ${data.requestId}` : "";
        throw new Error((data.error ?? "Audit failed. Please try again.") + reference);
      }
      if ((data as { gated?: boolean }).gated) {
        setGatedDomain((data as { domainUrl: string }).domainUrl);
        setPhase("gated");
        trackAnalyticsEvent("audit_preview_capacity_gate");
      } else {
        if (!data.summary?.token) throw new Error("The preview returned an incomplete result. Please try again.");
        setSummary((data as { summary: AuditSummary }).summary);
        setPhase("summary");
        trackAnalyticsEvent("audit_preview_complete");
      }
    } catch (err) {
      setError(err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
        ? "This check took too long. Please try again in a moment."
        : err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "full" && fullReport) {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="region"
        aria-label="Full automated audit preview"
        className="outline-none"
      >
        <AuditReportView report={fullReport} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={runAudit} aria-busy={busy} className="card p-6 sm:p-8">
        <label htmlFor="fa-url" className="mb-1.5 block text-sm font-medium">
          Your website <span className="text-lime-deep">*</span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={urlInputRef}
            id="fa-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            required
            disabled={busy}
            autoComplete="url"
            inputMode="url"
            maxLength={2048}
            aria-invalid={Boolean(error)}
            aria-describedby={`fa-url-help${error ? " fa-url-error" : ""}`}
            className={INPUT}
          />
          <button type="submit" disabled={busy} aria-busy={busy} className={`${BTN} shrink-0 sm:w-auto`}>
            {busy ? (
              <>
                <Spinner /> Auditing…
              </>
            ) : (
              "Run free preview"
            )}
          </button>
        </div>
        <p id="fa-url-help" className="mt-3 text-xs text-muted">
          Read-only. We inspect up to five public pages and generate up to five clearly labeled model
          scenarios, with one sample per question. We never write to your site or query named AI
          products in this free preview.
        </p>
      </form>

      {error ? (
        <p id="fa-url-error" role="alert" className="card p-5 text-sm text-ink">
          <span className="font-medium text-lime-deep">Error: </span>
          {error}
        </p>
      ) : null}

      {busy ? (
        <div role="status" aria-live="polite" className="card flex items-center gap-3 p-5 text-sm text-muted">
          <span className="h-2 w-2 animate-pulse bg-lime" aria-hidden />
          Crawling public pages, running on-page checks, and generating modeled answer scenarios… usually under a minute.
        </div>
      ) : null}

      {phase !== "input" ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="region"
          aria-live="polite"
          aria-label="Audit preview result"
          className="outline-none"
        >
          {phase === "summary" && summary ? (
            <SummaryCard
              summary={summary}
              onUnlock={(report) => {
                setFullReport(report);
                setPhase("full");
              }}
            />
          ) : null}
          {phase === "gated" ? <CapacityGate domainUrl={gatedDomain} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  summary,
  onUnlock
}: {
  summary: AuditSummary;
  onUnlock: (report: AuditReportData) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="card p-6 sm:p-8">
        <MonoLabel index="preview">Free preview</MonoLabel>
        <h2 className="mt-3 text-2xl sm:text-3xl">{summary.domainUrl}</h2>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
          This is an automated readiness preview, not a live test of ChatGPT, Claude, Google AI
          Overviews, or another named engine. On-page findings come from the public pages we fetched;
          answer results are single-sample scenarios generated by a general language model.
        </p>
        <div className="mt-6 flex flex-wrap gap-8">
          <Stat n={summary.technicalIssues} label="On-page findings" />
          {summary.measuredChecksWithoutCitation > 0 ? (
            <Stat n={summary.measuredChecksWithoutCitation} label="Measured checks without citation" />
          ) : null}
          <Stat n={summary.modeledSamplesWithoutBrand} label="Model samples without brand" />
          <Stat n={summary.recommendations} label="Suggested actions" />
        </div>
        {summary.topFindings.length > 0 ? (
          <ul className="mt-6 divide-y divide-line border-t border-dashed border-line">
            {summary.topFindings.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-ink">{f.title}</span>
                <span className="inline-flex border border-line bg-paper-2 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                  {f.severity}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <UnlockForm token={summary.token} domainUrl={summary.domainUrl} onUnlock={onUnlock} />
    </div>
  );
}

function UnlockForm({
  token,
  domainUrl,
  onUnlock
}: {
  token: string;
  domainUrl: string;
  onUnlock: (report: AuditReportData) => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) emailRef.current?.focus();
  }, [error]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          token,
          domainUrl,
          attribution: readMarketingAttribution()
        })
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        report?: AuditReportData;
      };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.report) {
        trackAnalyticsEvent("generate_lead", { lead_type: "free_audit_unlock" });
        onUnlock(data.report);
      }
      else throw new Error("This report expired — please run the audit again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={busy} className="card card-marker p-6 sm:p-8">
      <MonoLabel index="unlock">Full report</MonoLabel>
      <h3 className="mt-3 text-xl sm:text-2xl">Prioritized observations + a sample draft based on your site.</h3>
      <p id={`${uid}-unlock-help`} className="mt-2 text-sm text-muted">
        Enter your email to deliver and unlock this automated preview. It is not a subscription to
        marketing email.
      </p>
      <label htmlFor={`${uid}-unlock-email`} className="sr-only">
        Work email
      </label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          ref={emailRef}
          id={`${uid}-unlock-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={busy}
          autoComplete="email"
          aria-describedby={`${uid}-unlock-help${error ? ` ${uid}-unlock-error` : ""}`}
          className={INPUT}
        />
        <button type="submit" disabled={busy} aria-busy={busy} className={`${BTN} shrink-0 sm:w-auto`}>
          {busy ? (
            <>
              <Spinner /> Unlocking…
            </>
          ) : (
            "Deliver my preview"
          )}
        </button>
      </div>
      {error ? (
        <p id={`${uid}-unlock-error`} role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        We use this address to deliver the requested report and respond about it. Any marketing
        messages require separate consent.
      </p>
    </form>
  );
}

function CapacityGate({ domainUrl }: { domainUrl: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) emailRef.current?.focus();
  }, [error]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          domainUrl,
          attribution: readMarketingAttribution()
        })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      trackAnalyticsEvent("generate_lead", { lead_type: "manual_audit_followup" });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="card card-marker p-6 text-sm text-ink sm:p-8">
        <MonoLabel index="queued">Request received</MonoLabel>
        <p className="mt-3">We&apos;ll follow up about a manual review of {domainUrl}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} aria-busy={busy} className="card card-marker p-6 sm:p-8">
      <MonoLabel index="capacity">Automated limit reached</MonoLabel>
      <h3 className="mt-3 text-xl sm:text-2xl">Today&apos;s automated preview limit has been reached.</h3>
      <p id={`${uid}-capacity-help`} className="mt-2 text-sm text-muted">
        Leave your email to request a manual follow-up about {domainUrl}. We won&apos;t claim an
        automated report was completed when it wasn&apos;t.
      </p>
      <label htmlFor={`${uid}-capacity-email`} className="sr-only">
        Work email
      </label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          ref={emailRef}
          id={`${uid}-capacity-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={busy}
          autoComplete="email"
          aria-describedby={`${uid}-capacity-help${error ? ` ${uid}-capacity-error` : ""}`}
          className={INPUT}
        />
        <button type="submit" disabled={busy} aria-busy={busy} className={`${BTN} shrink-0 sm:w-auto`}>
          {busy ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            "Request manual follow-up"
          )}
        </button>
      </div>
      {error ? (
        <p id={`${uid}-capacity-error`} role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl leading-none text-lime-deep tnum">{n}</div>
      <div className="mono-label mt-2">{label}</div>
    </div>
  );
}
