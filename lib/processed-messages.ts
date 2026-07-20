// Idempotency latch for the Graph warm-scan cron. A given reply must fire the
// founder alert + cadence stop exactly once, even if a tick overlaps the
// previous one or the lookback window re-scans the same message. Backed by the
// same Upstash Redis instance as the rest of outreach; a plain in-memory Set
// is the local-dev fallback (fine — a dev run never sees real Graph traffic).

import { Redis } from "@upstash/redis";

const SET_KEY = "oc:graph:processed";

function client(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
}

const memory = new Set<string>();

export async function alreadyProcessed(messageId: string): Promise<boolean> {
  const redis = client();
  if (!redis) return memory.has(messageId);
  return (await redis.sismember(SET_KEY, messageId)) === 1;
}

export async function markProcessed(messageId: string): Promise<void> {
  const redis = client();
  if (!redis) {
    memory.add(messageId);
    return;
  }
  await redis.sadd(SET_KEY, messageId);
}
