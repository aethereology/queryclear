import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { prospectQueue } from "@/lib/prospect-queue";
import { apifySpendGuard } from "@/lib/apify-spend";
import { apifyRunTracker } from "@/lib/apify-runs";
import { startPlacesRun } from "@/lib/apify";
import { targetAt, planTopupRuns, ROTATION_LENGTH } from "@/lib/prospect-targets";
import { dailySendCap } from "@/lib/outreach-send";

// Once/day (Hobby-compatible — see vercel.json). Tops the prospect queue back
// up to a few days of sends, then returns immediately — it never waits on a
// scrape, which would risk the function timeout. app/api/cron/prospect-ingest
// picks up the results once the runs have finished.
//
// DEFICIT-DRIVEN since 2026-07-26. It used to start exactly ONE run whenever
// depth fell under a hardcoded 30. That was sized for a 10/day send cap; at
// 45/day it drains far faster than one city's yield refills it, so the queue
// ran dry regardless of how big the shortfall was. Now it measures the gap and
// starts as many runs as the gap needs, bounded by MAX_RUNS_PER_TOPUP and the
// hard daily spend cap.
//
// Thresholds are DERIVED from dailySendCap() rather than hardcoded, so raising
// the send cap automatically raises how much runway we source. The previous
// fixed 30 silently desynced the moment the cap moved 10 → 45; don't
// reintroduce a bare number here.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cap = dailySendCap();
  // Refill toward N days of sends; act once we drop under M days. Sourcing lags
  // sending by up to ~25h (a scrape started at 10:00 that runs long isn't
  // ingested until the next 11:00, after that day's 13:00 send), so the buffer
  // has to absorb more than a single day.
  const targetDepth = num(process.env.OUTREACH_QUEUE_TARGET_DEPTH, cap * 3);
  const watermark = num(process.env.OUTREACH_QUEUE_LOW_WATERMARK, cap * 2);

  // Conservative: the observed spread is ~7 kept (small metro) to ~54 (large).
  // Underestimating just starts an extra run; overestimating leaves us dry.
  const estYieldPerRun = num(process.env.APIFY_EST_YIELD_PER_RUN, 20);
  const depth = await prospectQueue().depth();
  const plan = planTopupRuns({ depth, watermark, targetDepth, estYieldPerRun });
  if (!plan.shouldRun) {
    return NextResponse.json({ skipped: "queue-not-low", depth, watermark, targetDepth });
  }
  const { deficit, runsWanted } = plan;

  const capUsd = num(process.env.APIFY_DAILY_CAP_USD, 1);
  const costUsd = num(process.env.APIFY_COST_PER_CITY_USD, 1);
  const tracker = apifyRunTracker();

  const started: Array<{ vertical: string; city: string; runId: string }> = [];
  let stoppedBy: string | null = null;

  for (let i = 0; i < runsWanted; i++) {
    const reserved = await apifySpendGuard().reserveSpend(costUsd, capUsd);
    if (!reserved.allowed) {
      stoppedBy = "cost-cap";
      break;
    }

    const target = targetAt(await tracker.nextRotationIndex());
    const run = await startPlacesRun({
      searchTerms: target.searchTerms,
      locationQuery: target.city,
      maxPlaces: 150,
    });

    if (!run) {
      // No APIFY_TOKEN configured, or the API call failed — no-op, same
      // fail-open-to-skip pattern as sendEmail() when RESEND_API_KEY is unset.
      // The spend reservation is NOT released: we can't tell a transient API
      // error from a misconfiguration, and burning the day's budget is the
      // safer failure than retrying a broken call four times.
      stoppedBy = "apify-unavailable";
      break;
    }

    await tracker.recordPendingRun({
      runId: run.id,
      vertical: target.vertical,
      city: target.city,
      startedAt: new Date().toISOString(),
    });
    started.push({ vertical: target.vertical, city: target.city, runId: run.id });
  }

  return NextResponse.json({
    started: started.length,
    runs: started,
    depth,
    watermark,
    targetDepth,
    deficit,
    runsWanted,
    rotationLength: ROTATION_LENGTH,
    ...(stoppedBy ? { stoppedBy } : {}),
  });
}
