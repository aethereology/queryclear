import { NextResponse } from "next/server";
import { cronAuthOk } from "@/lib/secret";
import { prospectQueue } from "@/lib/prospect-queue";
import { apifyRunTracker } from "@/lib/apify-runs";
import { getRun, getDatasetItems } from "@/lib/apify";
import { curateBatch } from "@/lib/prospect-curate";
import { outreachStore } from "@/lib/outreach-store";

// Once/day, timed after prospect-topup so same-day runs have finished (see
// vercel.json). Checks every pending Apify run: if it succeeded, curate the
// results and enqueue survivors (same masterlist dedup as the founder-facing
// `ingest-prospects` action); if it failed, give up on it; if it's still
// running, leave it for the next check.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!cronAuthOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const tracker = apifyRunTracker();
  const queue = prospectQueue();
  const store = outreachStore();
  const pending = await tracker.listPendingRuns();

  const result = {
    checked: pending.length,
    ingested: 0,
    stillRunning: 0,
    failed: 0,
    droppedByCuration: 0,
    skippedDuplicate: 0,
  };

  for (const p of pending) {
    const run = await getRun(p.runId);
    if (!run) {
      result.failed += 1;
      await tracker.removePendingRun(p.runId);
      continue;
    }

    if (run.status === "SUCCEEDED") {
      const items = await getDatasetItems(run.defaultDatasetId);
      const { kept, dropped } = curateBatch(items, p.vertical);
      result.droppedByCuration += dropped.length;

      for (const prospect of kept) {
        const existing = await store.getContact(prospect.email);
        if (existing) {
          result.skippedDuplicate += 1;
          continue;
        }
        const added = await queue.enqueue({ ...prospect, city: p.city });
        if (added) result.ingested += 1;
        else result.skippedDuplicate += 1;
      }
      await tracker.removePendingRun(p.runId);
    } else if (run.status === "FAILED" || run.status === "ABORTED" || run.status === "TIMED-OUT") {
      result.failed += 1;
      await tracker.removePendingRun(p.runId);
    } else {
      result.stillRunning += 1;
      // leave it — checked again on the next run
    }
  }

  return NextResponse.json(result);
}
