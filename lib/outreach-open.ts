import { Resend } from "resend";
import { renderOutreachOpenAcknowledgementEmail, renderOutreachViewNotifyEmail } from "./email";
import { computeNextDueAt, nextStep } from "./outreach-cadence";
import { outreachReportTtlMs, POSTAL_FALLBACK } from "./outreach";
import { qaSend } from "./outreach-qa";
import { sendEmail, dailySendCap, sendingPaused } from "./outreach-send";
import { outreachStore } from "./outreach-store";
import { prospectQueue } from "./prospect-queue";
import { publicAuditStore } from "./public-audit";
import { site } from "./site";
import { makeUnsubscribeToken } from "./unsubscribe-token";

function acknowledgementEnabled() {
  return process.env.OUTREACH_OPEN_ACK_ENABLED !== "false";
}

function acknowledgementScheduledAt(now = Date.now()) {
  const configured = Number(process.env.OUTREACH_OPEN_ACK_DELAY_MINUTES);
  const delayMinutes =
    Number.isFinite(configured) && configured >= 5
      ? Math.min(configured, 24 * 60)
      : 20;
  return new Date(now + delayMinutes * 60_000).toISOString();
}

function unsubscribeUrl(email: string) {
  return `${site.url}/api/outreach/unsubscribe?token=${makeUnsubscribeToken(email)}`;
}

function displayDomain(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function notifyFounder(domainUrl: string, reportUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  try {
    await resend.emails.send({
      from: process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>",
      to: process.env.LEAD_TO ?? site.email,
      subject: `Prospect viewed their audit — ${displayDomain(domainUrl)}`,
      html: renderOutreachViewNotifyEmail({ domainUrl, reportUrl }, site),
    });
  } catch {
    // A team alert is useful, but never important enough to break the workflow.
  }
}

/**
 * Handle a meaningful outreach-report view (a visible 10-second dwell), not a
 * raw page GET. The report-token latch makes the entire workflow first-view
 * only, including across concurrent requests.
 */
export async function handleOutreachReportView(token: string) {
  const auditStore = publicAuditStore();
  const report = await auditStore.getReport(token);
  if (!report) return;

  const firstView = await auditStore.markViewedOnce(token, outreachReportTtlMs());
  if (!firstView) return;

  const reportUrl = `${site.url}/r/${token}`;
  await notifyFounder(report.domain_url, reportUrl);

  const store = outreachStore();
  const email = await store.emailForToken(token);
  if (!email) return;

  const contact = await store.getContact(email);
  if (!contact || !["cold", "opened"].includes(contact.status)) return;

  const openedContact =
    contact.status === "cold" ? (await store.setStatus(email, "opened")) ?? contact : contact;

  // This acknowledgement is only touch 2. If any follow-up has already gone
  // out, another immediate message would bunch the sequence and feel robotic.
  // OUTREACH_PAUSED is the one red button: it has to cover this too, or a
  // "paused" campaign still emails anyone who opens a report and the pause is a
  // lie. This is a separate path from the send cron, so it needs its own check.
  if (sendingPaused()) return;
  if (!acknowledgementEnabled() || openedContact.touches.length !== 1) return;

  const reserved = await store.reserveSend(1, dailySendCap());
  if (!reserved.allowed) return;

  const domain = openedContact.domain || report.domain_url;
  const business = openedContact.business || displayDomain(domain);
  const topFix =
    report.recommendations[0]?.title ||
    report.findings[0]?.recommendation ||
    report.findings[0]?.title ||
    "make the main service and location clearer on the site";
  const subject = `The first fix I'd make for ${business}`;
  const html = renderOutreachOpenAcknowledgementEmail({
    businessName: openedContact.business,
    domain,
    reportUrl,
    topFix,
    postalAddress: process.env.OUTREACH_POSTAL_ADDRESS ?? POSTAL_FALLBACK,
    siteName: site.name,
  });

  const qa = await qaSend({
    subject,
    html,
    toEmail: email,
    reportLinkOk: true,
  });
  if (!qa.pass) {
    await store.releaseSend(1);
    await prospectQueue().quarantine({
      prospect: {
        email,
        businessName: openedContact.business,
        domainUrl: domain,
      },
      reasons: qa.reasons,
      subject,
    });
    return;
  }

  let delivered = false;
  const scheduledAt = acknowledgementScheduledAt();
  try {
    delivered = await sendEmail(email, subject, html, {
      unsubscribeUrl: unsubscribeUrl(email),
      scheduledAt,
    });
  } catch {
    // Delivery failures release the cap reservation below.
  }
  if (!delivered) {
    await store.releaseSend(1);
    return;
  }

  const touch = { n: 2, type: "opened-ack", at: scheduledAt };
  const after = nextStep({
    ...openedContact,
    status: "opened",
    touches: [...openedContact.touches, touch],
    lastTouchAt: scheduledAt,
  });
  const nextDueAt = after ? computeNextDueAt(scheduledAt, after) : null;
  await store.recordTouch(email, touch, nextDueAt);
}
