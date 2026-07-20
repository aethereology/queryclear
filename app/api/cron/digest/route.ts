import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { outreachStore } from "@/lib/outreach-store";
import { prospectQueue } from "@/lib/prospect-queue";
import { sendEmail } from "@/lib/outreach-send";
import { renderOutreachDigestEmail } from "@/lib/email";
import { site } from "@/lib/site";

// Nightly founder digest — the one daily touchpoint with the autonomous
// engine short of a warm reply. Summarizes what sent, what's due tomorrow,
// and (most importantly) what's stuck in QA quarantine and needs a look.
export const dynamic = "force-dynamic";

function startOfUtcDay(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = outreachStore();
  const queue = prospectQueue();
  const todayStart = startOfUtcDay();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const contacts = await store.listContacts();
  const sentToday = contacts.filter((c) => !!c.lastTouchAt && c.lastTouchAt >= todayStart);
  const warmToday = contacts.filter((c) => c.status === "warm" && !!c.lastTouchAt && c.lastTouchAt >= todayStart);
  const dueTomorrowCount = (await store.dueForTouch(in24h)).length;

  const cap = Number(process.env.OUTREACH_DAILY_SEND_CAP) || 25;
  const capStatus = await store.reserveSend(0, cap); // peek only — n=0 never trips the cap

  const quarantineCount = await queue.quarantineCount();
  const quarantineSample = await queue.listQuarantine(5);
  const queueDepth = await queue.depth();

  const html = renderOutreachDigestEmail(
    {
      sentToday: sentToday.length,
      warmToday: warmToday.map((c) => ({ email: c.email, business: c.business })),
      dueTomorrow: dueTomorrowCount,
      queueDepth,
      quarantineCount,
      quarantineSample: quarantineSample.map((q) => ({
        email: q.prospect.email,
        business: q.prospect.businessName,
        reasons: q.reasons,
      })),
      sentTodayCount: capStatus.sentToday,
      cap,
    },
    site,
  );

  const to = process.env.FOUNDER_ALERT_TO ?? process.env.LEAD_TO ?? site.email;
  let delivered = false;
  try {
    delivered = await sendEmail(
      to,
      `queryclear outreach digest — ${sentToday.length} sent, ${quarantineCount} to review`,
      html,
    );
  } catch {
    delivered = false;
  }

  return NextResponse.json({ delivered, sentToday: sentToday.length, quarantineCount, queueDepth });
}
