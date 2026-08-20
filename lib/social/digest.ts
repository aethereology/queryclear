import { Resend } from "resend";
import { escapeHtml } from "@/lib/email";
import { site } from "@/lib/site";
import { socialStore } from "./store";

export async function sendSocialDigest() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { delivered: false, reason: "RESEND_API_KEY is not configured." };
  const snapshot = await socialStore().dashboard();
  const today = new Date().toISOString().slice(0, 10);
  const published = snapshot.posts.filter((post) => post.publishedAt?.startsWith(today));
  const quarantined = snapshot.actions.filter((action) => action.status === "quarantined");
  const paused = snapshot.accounts.filter((account) => account.paused);
  const leads = snapshot.metrics.reduce((sum, metric) => sum + metric.freeAuditLeads, 0);
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f7f4ee;color:#17180f;padding:32px">
      <div style="max-width:640px;margin:auto">
        <p style="font-family:monospace;text-transform:uppercase;color:#5b5a4d">queryclear // social digest</p>
        <h1 style="font-size:28px">Autonomous social, today.</h1>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:12px;border-top:1px dashed #999">Published</td><td>${published.length}</td></tr>
          <tr><td style="padding:12px;border-top:1px dashed #999">Quarantined</td><td>${quarantined.length}</td></tr>
          <tr><td style="padding:12px;border-top:1px dashed #999">Paused accounts</td><td>${paused.length}</td></tr>
          <tr><td style="padding:12px;border-top:1px dashed #999">Free-audit leads</td><td>${leads}</td></tr>
          <tr><td style="padding:12px;border-top:1px dashed #999">Month spend</td><td>$${snapshot.monthSpendUsd.toFixed(2)} / $${snapshot.settings.monthlyBudgetUsd}</td></tr>
        </table>
        ${paused.length ? `<p><strong>Paused:</strong> ${paused.map((item) => escapeHtml(item.label)).join(", ")}</p>` : ""}
        <p><a href="${site.url}/admin/social" style="background:#b6f03c;color:#0c2a21;padding:12px 18px;display:inline-block">Open social control room</a></p>
      </div>
    </div>`;
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? `${site.name} <hello@queryclear.com>`,
    to: process.env.FOUNDER_ALERT_TO ?? process.env.LEAD_TO ?? site.email,
    subject: `queryclear social digest — ${published.length} published, ${quarantined.length} quarantined`,
    html,
  });
  return { delivered: !result.error, error: result.error?.message };
}
