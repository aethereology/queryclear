"use client";

import { useState } from "react";
import { MonoLabel } from "@/components/ui";
import { AuditReportView } from "@/components/AuditReportView";
import type { AuditReportData } from "@/lib/agent-runtime";

interface AuditSummary {
  token: string;
  domainUrl: string;
  pageTitle: string;
  technicalIssues: number;
  invisibleQueries: number;
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

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/public/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domainUrl: url.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Audit failed.");
      if ((data as { gated?: boolean }).gated) {
        setGatedDomain((data as { domainUrl: string }).domainUrl);
        setPhase("gated");
      } else {
        setSummary((data as { summary: AuditSummary }).summary);
        setPhase("summary");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "full" && fullReport) {
    return <AuditReportView report={fullReport} />;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={runAudit} className="card p-6 sm:p-8">
        <label htmlFor="fa-url" className="mb-1.5 block text-sm font-medium">
          Your website <span className="text-lime-deep">*</span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="fa-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            required
            disabled={busy}
            autoComplete="url"
            className={INPUT}
          />
          <button type="submit" disabled={busy} aria-busy={busy} className={`${BTN} shrink-0 sm:w-auto`}>
            {busy ? (
              <>
                <Spinner /> Auditing…
              </>
            ) : (
              "Run free audit"
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Read-only. We crawl public pages and probe AI visibility — we never write to your site.
        </p>
      </form>

      {error ? (
        <p role="alert" className="card p-5 text-sm text-ink">
          <span className="font-medium text-lime-deep">Error: </span>
          {error}
        </p>
      ) : null}

      {busy ? (
        <div className="card flex items-center gap-3 p-5 text-sm text-muted">
          <span className="h-2 w-2 animate-pulse bg-lime" aria-hidden />
          Crawling, checking AI visibility, and drafting a sample fix… (~15s)
        </div>
      ) : null}

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
        <div className="mt-6 flex flex-wrap gap-8">
          <Stat n={summary.technicalIssues} label="Technical issues" />
          <Stat n={summary.invisibleQueries} label="Invisible queries" />
          <Stat n={summary.recommendations} label="Recommendations" />
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
      if (data.report) onUnlock(data.report);
      else throw new Error("This report expired — please run the audit again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card card-marker p-6 sm:p-8">
      <MonoLabel index="unlock">Full report</MonoLabel>
      <h3 className="mt-3 text-xl sm:text-2xl">Prioritized fixes + a sample draft in your brand voice.</h3>
      <p className="mt-2 text-sm text-muted">Enter your email and we&apos;ll unlock the complete audit instantly.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={busy}
          autoComplete="email"
          className={INPUT}
        />
        <button type="submit" disabled={busy} className={`${BTN} shrink-0 sm:w-auto`}>
          {busy ? (
            <>
              <Spinner /> Unlocking…
            </>
          ) : (
            "Show full report"
          )}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        We&apos;ll email occasional, useful AI-search tips. No spam; unsubscribe anytime.
      </p>
    </form>
  );
}

function CapacityGate({ domainUrl }: { domainUrl: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card card-marker p-6 text-sm text-ink sm:p-8">
        <MonoLabel index="queued">Request received</MonoLabel>
        <p className="mt-3">We&apos;ll email your audit for {domainUrl} shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card card-marker p-6 sm:p-8">
      <MonoLabel index="capacity">High demand today</MonoLabel>
      <h3 className="mt-3 text-xl sm:text-2xl">We&apos;re at capacity for the free tier.</h3>
      <p className="mt-2 text-sm text-muted">
        Leave your email and we&apos;ll send your full audit for {domainUrl} as soon as a slot opens.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={busy}
          autoComplete="email"
          className={INPUT}
        />
        <button type="submit" disabled={busy} className={`${BTN} shrink-0 sm:w-auto`}>
          {busy ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            "Email me the audit"
          )}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
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
