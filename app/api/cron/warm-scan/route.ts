import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { fetchRecentMessages } from "@/lib/ms-graph";
import { alreadyProcessed, markProcessed } from "@/lib/processed-messages";
import { outreachStore } from "@/lib/outreach-store";
import { sendEmail } from "@/lib/outreach-send";
import { renderWarmLeadAlertEmail } from "@/lib/email";
import { site } from "@/lib/site";

// Reply detection — the "hand me the client" signal. Polls the mailbox where
// outreach replies land (read-only Microsoft Graph Mail.Read; no MX change, no
// send-as) for messages from anyone in the masterlist. A reply flips the
// contact to the terminal "warm" status (removing it from the autonomous
// cadence on the next send-cron tick) and fires an instant founder alert with
// a one-paste draft reply. An opt-out-worded reply is treated as unsubscribe
// instead, mechanically honoring every outreach email's opt-out promise.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPT_OUT_RE = /unsubscribe|stop contacting|remove me|take me off|no longer interested|don'?t contact/i;

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = outreachStore();
  // 24h lookback covers any missed tick; alreadyProcessed() keeps re-scanned
  // messages from firing a second alert.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const messages = await fetchRecentMessages(since);

  let warmed = 0;
  let unsubscribed = 0;

  for (const msg of messages) {
    if (await alreadyProcessed(msg.id)) continue;

    const from = msg.from?.emailAddress?.address?.trim().toLowerCase();
    if (!from) {
      await markProcessed(msg.id);
      continue;
    }

    const contact = await store.getContact(from);
    if (!contact) {
      await markProcessed(msg.id); // not one of our contacts — not ours to act on
      continue;
    }

    const optOut = OPT_OUT_RE.test(`${msg.subject ?? ""} ${msg.bodyPreview ?? ""}`);
    if (optOut) {
      await store.setStatus(from, "unsubscribed");
      unsubscribed += 1;
    } else {
      await store.setStatus(from, "warm");
      warmed += 1;

      const token = contact.touches[0]?.reportToken;
      const reportUrl = token ? `${site.url}/r/${token}` : undefined;
      const html = renderWarmLeadAlertEmail(
        {
          business: contact.business,
          email: contact.email,
          domain: contact.domain,
          city: contact.city,
          vertical: contact.vertical,
          signal: "replied",
          snippet: msg.bodyPreview,
          reportUrl,
          touchCount: contact.touches.length,
        },
        site,
      );
      const to = process.env.FOUNDER_ALERT_TO ?? process.env.LEAD_TO ?? site.email;
      try {
        await sendEmail(to, `[WARM] ${contact.business || contact.domain || contact.email} replied`, html);
      } catch {
        /* best-effort — the status flip already stopped the cadence */
      }
    }

    await markProcessed(msg.id);
  }

  return NextResponse.json({ scanned: messages.length, warmed, unsubscribed });
}
