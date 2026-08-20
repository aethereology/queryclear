#!/usr/bin/env node

// One-time/re-runnable backfill for contacts already marked `opened` before the
// automatic acknowledgement flow existed. Dry-run by default; --send is the
// only mode that performs external writes.

import { Resend } from "resend";
import { renderOutreachOpenAcknowledgementEmail } from "../lib/email";
import { computeNextDueAt, nextStep } from "../lib/outreach-cadence";
import { ensureReportLink, outreachReportTtlMs, POSTAL_FALLBACK } from "../lib/outreach";
import { qaSend } from "../lib/outreach-qa";
import { outreachStore } from "../lib/outreach-store";
import { publicAuditStore } from "../lib/public-audit";
import { site } from "../lib/site";
import { makeUnsubscribeToken } from "../lib/unsubscribe-token";

const args = process.argv.slice(2);
const shouldSend = args.includes("--send");
const refreshMissing = args.includes("--refresh-missing");
const sampleIndex = args.indexOf("--sample");
const sampleEmail = sampleIndex >= 0 ? args[sampleIndex + 1]?.trim().toLowerCase() : undefined;
const ACK_TYPES = new Set(["opened-ack", "opened-ack-backfill"]);

if (sampleIndex >= 0 && !sampleEmail) {
  throw new Error("--sample requires an email address.");
}
if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required.");

const store = outreachStore();
const auditStore = publicAuditStore();
const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.LEAD_FROM ?? "queryclear <onboarding@resend.dev>";
const replyTo = process.env.LEAD_TO ?? site.email;
const postalAddress = process.env.OUTREACH_POSTAL_ADDRESS ?? POSTAL_FALLBACK;
const manualCap = Math.max(1, Number(process.env.MAX_DAILY_CONTACTS) || 200);

function cleanDomain(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function topFix(report: {
  recommendations?: { title?: string }[];
  findings?: { recommendation?: string; title?: string }[];
}) {
  return (
    report.recommendations?.[0]?.title ||
    report.findings?.[0]?.recommendation ||
    report.findings?.[0]?.title ||
    "make the main service and location clearer on the site"
  );
}

async function deliver(input: {
  email: string;
  business?: string;
  domain: string;
  reportUrl: string;
  fix: string;
  sample?: boolean;
}) {
  const subject = `The first fix I'd make for ${input.business || cleanDomain(input.domain)}`;
  const html = renderOutreachOpenAcknowledgementEmail({
    businessName: input.business,
    domain: input.domain,
    reportUrl: input.reportUrl,
    topFix: input.fix,
    postalAddress,
    siteName: site.name,
  });
  const qa = await qaSend({
    subject,
    html,
    toEmail: input.email,
    reportLinkOk: true,
  });
  if (!qa.pass) return { ok: false, reason: `qa: ${qa.reasons.join("; ")}` };
  if (!shouldSend) return { ok: true, preview: true, subject };

  const reserved = await store.reserveSend(1, manualCap);
  if (!reserved.allowed) {
    return { ok: false, reason: `manual daily cap ${manualCap} reached` };
  }

  const unsubscribeUrl = `${site.url}/api/outreach/unsubscribe?token=${makeUnsubscribeToken(input.email)}`;
  const result = await resend.emails.send({
    from,
    to: input.email,
    replyTo,
    subject,
    html,
    ...(!input.sample
      ? {
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  });
  if (result.error || !result.data?.id) {
    await store.releaseSend(1);
    return { ok: false, reason: result.error?.message || "Resend did not return an email id." };
  }
  return { ok: true, id: result.data.id, subject };
}

async function main() {
const contacts = (await store.listContacts())
  .filter((contact) => contact.status === "opened")
  .filter((contact) => !contact.touches.some((touch) => ACK_TYPES.has(touch.type)))
  .sort((a, b) => a.email.localeCompare(b.email));

console.log(`${shouldSend ? "LIVE SEND" : "DRY RUN"}: ${contacts.length} opened contact(s)`);
let sent = 0;
let skipped = 0;
let failed = 0;

for (const listedContact of contacts) {
  const contact = await store.getContact(listedContact.email);
  if (!contact || contact.status !== "opened") {
    skipped += 1;
    console.log(`SKIP ${listedContact.email}: status changed`);
    continue;
  }

  let token = contact.touches[0]?.reportToken;
  let report = token ? await auditStore.getReport(token) : null;
  if ((!token || !report) && (shouldSend || refreshMissing)) {
    const refreshed = await ensureReportLink(contact);
    if (refreshed.ok && refreshed.token) {
      token = refreshed.token;
      await store.setReportToken(contact.email, token);
      await store.linkToken(token, contact.email, outreachReportTtlMs());
      report = await auditStore.getReport(token);
      console.log(`REFRESHED ${contact.email}: ${token}`);
    }
  }
  if (!token || !report) {
    skipped += 1;
    console.log(`SKIP ${contact.email}: report unavailable`);
    continue;
  }

  const result = await deliver({
    email: contact.email,
    business: contact.business,
    domain: contact.domain || report.domain_url,
    reportUrl: `${site.url}/r/${token}`,
    fix: topFix(report),
  });
  if (!result.ok) {
    failed += 1;
    console.log(`FAIL ${contact.email}: ${result.reason}`);
    continue;
  }
  if (result.preview) {
    console.log(`READY ${contact.email}: ${result.subject}`);
    continue;
  }

  const sentAt = new Date().toISOString();
  const touch = {
    n: contact.touches.length + 1,
    type: "opened-ack-backfill",
    at: sentAt,
  };
  const following = nextStep({
    ...contact,
    touches: [...contact.touches, touch],
    lastTouchAt: sentAt,
  });
  await store.recordTouch(
    contact.email,
    touch,
    following ? computeNextDueAt(sentAt, following) : null,
  );
  sent += 1;
  console.log(`SENT ${contact.email}: ${result.id}`);
}

if (sampleEmail) {
  const sampleResult = await deliver({
    email: sampleEmail,
    business: "queryclear sample",
    domain: site.url,
    reportUrl: `${site.url}/audit`,
    fix: "Make each core service answer the exact question a buyer asks",
    sample: true,
  });
  if (!sampleResult.ok) {
    failed += 1;
    console.log(`FAIL sample ${sampleEmail}: ${sampleResult.reason}`);
  } else if (sampleResult.preview) {
    console.log(`READY sample ${sampleEmail}: ${sampleResult.subject}`);
  } else {
    sent += 1;
    console.log(`SENT sample ${sampleEmail}: ${sampleResult.id}`);
  }
}

console.log(JSON.stringify({ mode: shouldSend ? "live" : "dry-run", sent, skipped, failed }));
if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
