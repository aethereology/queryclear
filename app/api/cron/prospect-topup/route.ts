import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { prospectQueue } from "@/lib/prospect-queue";
import { apifySpendGuard } from "@/lib/apify-spend";
import { apifyRunTracker } from "@/lib/apify-runs";
import { startPlacesRun } from "@/lib/apify";
import { targetAt } from "@/lib/prospect-targets";

// Once/day (Hobby-compatible — see vercel.json). If the queue is running low,
// starts ONE Apify Places scrape for the next (vertical, city) in the
// rotation and returns immediately — never waits on the scrape itself, which
// would risk the function timeout. app/api/cron/prospect-ingest picks up the
// result on its own schedule once the run has finished.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const watermark = num(process.env.OUTREACH_QUEUE_LOW_WATERMARK, 30);
  const depth = await prospectQueue().depth();
  if (depth >= watermark) {
    return NextResponse.json({ skipped: "queue-not-low", depth, watermark });
  }

  const capUsd = num(process.env.APIFY_DAILY_CAP_USD, 1);
  const costUsd = num(process.env.APIFY_COST_PER_CITY_USD, 1);
  const reserved = await apifySpendGuard().reserveSpend(costUsd, capUsd);
  if (!reserved.allowed) {
    return NextResponse.json({ skipped: "cost-cap", spentUsd: reserved.spentUsd, capUsd });
  }

  const tracker = apifyRunTracker();
  const index = await tracker.nextRotationIndex();
  const target = targetAt(index);

  const run = await startPlacesRun({
    searchTerms: target.searchTerms,
    locationQuery: target.city,
    maxPlaces: 150,
  });

  if (!run) {
    // No APIFY_TOKEN configured, or the API call failed — no-op, same
    // fail-open-to-skip pattern as sendEmail() when RESEND_API_KEY is unset.
    return NextResponse.json({ skipped: "apify-unavailable", vertical: target.vertical, city: target.city });
  }

  await tracker.recordPendingRun({
    runId: run.id,
    vertical: target.vertical,
    city: target.city,
    startedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    started: true,
    vertical: target.vertical,
    city: target.city,
    runId: run.id,
    depth,
  });
}
