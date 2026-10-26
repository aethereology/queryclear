"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { filterOwnerHistory, parseOwnerHistory } from "@/lib/owner-workspace";
import type { AuditReportData } from "@/lib/agent-runtime";
import type { OwnerAuditEntry } from "@/lib/owner-audits";
const AuditReportView = dynamic(() => import("./AuditReportView").then(m => m.AuditReportView), { loading: () => <p role="status">Preparing your report…</p> });
export function OwnerAuditConsole({ csrf }: { csrf: string }) {
  const [history, setHistory] = useState<OwnerAuditEntry[]>([]);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [domainUrl, setDomainUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [search, setSearch] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [now, setNow] = useState(Date.now);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const historyRequest = useRef<AbortController | null>(null);
  const historyRevision = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const attempt = useRef<{ url: string; id: string } | null>(null);
  const refreshHistory = useCallback(() => {
    historyRequest.current?.abort();
    const controller = new AbortController();
    historyRequest.current = controller;
    const revision = historyRevision.current;
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    return fetch("/api/admin/audits", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (response.status === 401) setNeedsSignIn(true);
      if (!response.ok) throw new Error(body.error || "Recent audits could not be loaded.");
      const entries = parseOwnerHistory(body.history);
      if (!controller.signal.aborted) setHistory(current => revision === historyRevision.current ? entries :
        [...current, ...entries.filter(entry => !current.some(row => row.token === entry.token))].slice(0, 40));
    }).catch(() => {
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setHistoryError("Recent audits could not be loaded. Try refreshing the list.");
    }).finally(() => {
      clearTimeout(timeout);
      if (historyRequest.current === controller) setLoadingHistory(false);
    });
  }, []);
  useEffect(() => {
    void refreshHistory();
    return () => historyRequest.current?.abort();
  }, [refreshHistory]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const visibleHistory = filterOwnerHistory(history, search, now);
  async function load(token?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError(""); setNotice("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);
    try {
      if (!token && (!attempt.current || attempt.current.url !== domainUrl.trim())) attempt.current = { url: domainUrl.trim(), id: crypto.randomUUID() };
      const response = await fetch(token ? `/api/admin/audits?token=${encodeURIComponent(token)}` : "/api/admin/audits", {
        method: token ? "GET" : "POST", signal: controller.signal, cache: "no-store",
        ...(token ? {} : { headers: { "content-type": "application/json", "x-owner-csrf": csrf, "x-audit-attempt": attempt.current!.id }, body: JSON.stringify({ domainUrl }) }),
      });
      const body = await response.json();
      if (response.status === 401) setNeedsSignIn(true);
      if (response.status === 410) attempt.current = null;
      if (token && response.status === 404) setHistory(rows => rows.filter(entry => entry.token !== token));
      if (!response.ok || !body.report) throw new Error((body.error || "The report could not be loaded.") + (body.requestId ? ` Reference: ${body.requestId}` : ""));
      if (!token) attempt.current = null;
      setReport(body.report);
      if (body.entry && body.historySaved) {
        historyRevision.current += 1;
        setHistory(rows => [body.entry, ...rows.filter(row => row.token !== body.entry.token)].slice(0, 40));
      }
      if (body.historySaved === false) setNotice("Your report is ready, but recent history could not be saved. Download it before leaving this page.");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (e) { setError(e instanceof Error && e.name !== "AbortError" && !(e instanceof SyntaxError) ? e.message : "The request did not finish. Try again shortly; an audit may still count toward your allowance."); }
    finally { inFlight.current = false; clearTimeout(timeout); setBusy(false); }
  }
  return <div className="mt-10 space-y-8">
    <div className="print-hide flex justify-end"><button className="text-sm underline" onClick={async () => {
      try {
        const response = await fetch("/api/social/admin/session?returnTo=audits", { method: "DELETE" });
        if (!response.ok) throw new Error();
        setReport(null);
        setHistory([]);
        window.location.reload();
      } catch { setError("Sign-out could not be completed. Please try again."); }
    }}>Sign out</button></div>
    {needsSignIn && <div role="alert" className="print-hide rounded border border-line p-4">
      <p>Your session has expired. Sign in again to run audits or load saved reports.</p>
      <a href="/admin/audits" className="mt-2 inline-block underline">Return to sign in</a>
    </div>}
    <div className="print-hide grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="card p-6 sm:p-8" aria-labelledby="new-audit"><h2 id="new-audit" className="text-2xl font-semibold">Start an audit</h2>
        <p className="mt-2 text-sm text-muted">A focused scan of up to five public pages. Existing rate limits and the daily spending cap apply. No email is sent.</p>
        <form className="mt-6 space-y-4" aria-busy={busy} onSubmit={e => { e.preventDefault(); void load(); }}>
          <label htmlFor="owner-url" className="block font-medium">Website URL</label>
          <input id="owner-url" required maxLength={2048} inputMode="url" autoComplete="url" value={domainUrl} onChange={e => setDomainUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded border border-line bg-paper px-4 py-3" />
          <button disabled={busy} className="rounded bg-ink px-5 py-3 text-paper disabled:opacity-60">{busy ? "Working…" : "Run audit"}</button>
          {busy && <p role="status" className="text-sm text-muted">Checking the page and preparing evidence. This can take about a minute.</p>}
        </form>
        {error && <p ref={errorRef} tabIndex={-1} role="alert" aria-label="Audit request error" className="mt-4 break-words text-sm">{error}</p>}
      </section>
      <section className="card min-w-0 p-6 sm:p-8" aria-labelledby="recent-audits"><h2 id="recent-audits" className="text-2xl font-semibold">Recent audits</h2>
        <p className="mt-2 text-sm text-muted">Up to 40 owner runs. Reports expire within 24 hours; download what you want to keep.</p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1"><label htmlFor="history-search" className="mb-2 block text-sm font-medium">Search recent audits</label>
            <input id="history-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Website address" className="w-full rounded border border-line bg-paper px-3 py-2" />
          </div>
          <button disabled={loadingHistory || busy} onClick={() => { setLoadingHistory(true); setHistoryError(""); void refreshHistory(); }} className="min-h-11 rounded border border-line px-3 py-2 text-sm disabled:opacity-60">Refresh history</button>
        </div>
        {historyError && <p role="alert" className="mt-4 text-sm">{historyError}</p>}
        {loadingHistory ? <p role="status" className="mt-5">Loading recent audits…</p> : visibleHistory.length ? <ul className="mt-5 max-h-72 space-y-3 overflow-y-auto">{visibleHistory.map(entry => <li key={entry.token}>
          <button disabled={busy} onClick={() => void load(entry.token)} className="w-full rounded border border-line p-3 text-left hover:bg-paper-2 disabled:opacity-60">
            <span className="block break-all font-medium">{entry.domainUrl}</span>
            <span className="block text-xs text-muted">{new Date(entry.createdAt).toLocaleString()} · Open report</span>
            <span className="mt-1 block text-xs text-muted">Expires {new Date(entry.expiresAt).toLocaleString()}</span>
          </button>
        </li>)}</ul> : !historyError ? <p className="mt-5 text-sm text-muted">{search.trim() ? "No recent audits match this address." : "No recent audits to show. Your next saved report will appear here."}</p> : null}

      </section>
    </div>
    {notice && <p role="status" className="print-hide rounded border border-line p-4 text-sm">{notice}</p>}
    {report && <div ref={resultRef} tabIndex={-1} aria-label="Audit results" className="scroll-mt-6"><AuditReportView report={report} /></div>}
  </div>;
}
