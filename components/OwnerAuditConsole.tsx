"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/audits", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Recent audits could not be loaded.");
      setHistory(body.history);
    }).catch(e => { if (!controller.signal.aborted) setNotice(e.message); }).finally(() => { if (!controller.signal.aborted) setLoadingHistory(false); });
    return () => controller.abort();
  }, []);
  async function load(token?: string) {
    setBusy(true); setError(""); setNotice("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);
    try {
      const response = await fetch(token ? `/api/admin/audits?token=${encodeURIComponent(token)}` : "/api/admin/audits", {
        method: token ? "GET" : "POST", signal: controller.signal, cache: "no-store",
        ...(token ? {} : { headers: { "content-type": "application/json", "x-owner-csrf": csrf }, body: JSON.stringify({ domainUrl }) }),
      });
      const body = await response.json();
      if (!response.ok || !body.report) throw new Error((body.error || "The report could not be loaded.") + (body.requestId ? ` Reference: ${body.requestId}` : ""));
      setReport(body.report);
      if (body.entry && body.historySaved) setHistory(rows => [body.entry, ...rows.filter(row => row.token !== body.entry.token)].slice(0, 40));
      if (body.historySaved === false) setNotice("Your report is ready, but recent history could not be saved. Download it before leaving this page.");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (e) { setError(e instanceof Error && e.name !== "AbortError" && !(e instanceof SyntaxError) ? e.message : "The request did not finish. Try again shortly; an audit may still count toward your allowance."); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  return <div className="mt-10 space-y-8">
    <div className="print-hide flex justify-end"><button className="text-sm underline" onClick={async () => {
      try {
        const response = await fetch("/api/social/admin/session?returnTo=audits", { method: "DELETE" });
        if (!response.ok) throw new Error();
        window.location.assign("/admin/audits");
      } catch { setError("Sign-out could not be completed. Please try again."); }
    }}>Sign out</button></div>
    <div className="print-hide grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="card p-6 sm:p-8" aria-labelledby="new-audit"><h2 id="new-audit" className="text-2xl font-semibold">Start an audit</h2>
        <p className="mt-2 text-sm text-muted">A focused scan of one public page. Existing rate limits and the daily spending cap apply. No email is sent.</p>
        <form className="mt-6 space-y-4" aria-busy={busy} onSubmit={e => { e.preventDefault(); void load(); }}>
          <label htmlFor="owner-url" className="block font-medium">Website URL</label>
          <input id="owner-url" required maxLength={2048} inputMode="url" autoComplete="url" value={domainUrl} onChange={e => setDomainUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded border border-line bg-paper px-4 py-3" />
          <button disabled={busy} className="rounded bg-ink px-5 py-3 text-paper disabled:opacity-60">{busy ? "Working…" : "Run audit"}</button>
          {busy && <p role="status" className="text-sm text-muted">Checking the page and preparing evidence. This can take about a minute.</p>}
        </form>
        {error && <p role="alert" className="mt-4 break-words text-sm">{error}</p>}
      </section>
      <section className="card min-w-0 p-6 sm:p-8" aria-labelledby="recent-audits"><h2 id="recent-audits" className="text-2xl font-semibold">Recent audits</h2>
        <p className="mt-2 text-sm text-muted">Up to 40 owner runs. Reports expire within 24 hours; download what you want to keep.</p>
        {loadingHistory ? <p role="status" className="mt-5">Loading recent audits…</p> : history.length ? <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto">{history.map(entry => <li key={entry.token}><button disabled={busy} onClick={() => void load(entry.token)} className="w-full rounded border border-line p-3 text-left hover:bg-paper-2 disabled:opacity-60"><span className="block break-all font-medium">{entry.domainUrl}</span><span className="text-xs text-muted">{new Date(entry.createdAt).toLocaleString()} · Open report</span></button></li>)}</ul> : <p className="mt-5 text-sm text-muted">No recent audits to show. Your next saved report will appear here.</p>}
      </section>
    </div>
    {notice && <p role="status" className="print-hide rounded border border-line p-4 text-sm">{notice}</p>}
    {report && <div ref={resultRef} tabIndex={-1} aria-label="Audit results" className="scroll-mt-6"><AuditReportView report={report} /></div>}
  </div>;
}
