"use client";
import { useState } from "react";
import type { AuditReportData } from "@/lib/agent-runtime";
import { reportAsText, reportFilename } from "@/lib/audit-workspace";

export function AuditReportTools({ report }: { report: AuditReportData }) {
  const [message, setMessage] = useState("");
  function download() {
    const url = URL.createObjectURL(new Blob([reportAsText(report)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = reportFilename(report.domain_url);
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Your report download is ready. It includes all findings and evidence.");
  }
  return <div className="print-hide border-b border-line pb-5">
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={download} className="min-h-11 border border-pine bg-pine px-5 py-3 text-sm text-paper">Download report</button>
      <button type="button" onClick={() => window.print()} className="min-h-11 border border-line bg-paper px-5 py-3 text-sm">Print / Save PDF</button>
      <a href="/free-audit" className="min-h-11 border border-line bg-paper px-5 py-3 text-sm">Check another website</a>
    </div>
    <p role="status" className="mt-3 text-xs text-muted">{message || "Keep a copy of your findings. This preview is a point-in-time review, not ongoing monitoring."}</p>
  </div>;
}
