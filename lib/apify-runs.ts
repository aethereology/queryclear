// Tracks two small pieces of cross-invocation state for automatic sourcing:
// (1) which SOURCING_TARGETS index is next (round-robin position), and
// (2) which Apify runs `prospect-topup` started that `prospect-ingest` still
// needs to check on. Same Redis-with-in-memory-fallback shape as the rest of
// outreach (lib/prospect-queue.ts, lib/outreach-store-redis.ts).

import { Redis } from "@upstash/redis";

export interface PendingRun {
  runId: string;
  vertical: string;
  city: string;
  startedAt: string;
}

export interface ApifyRunTracker {
  /** Atomically consume and return the next rotation index. */
  nextRotationIndex(): Promise<number>;
  recordPendingRun(run: PendingRun): Promise<void>;
  listPendingRuns(): Promise<PendingRun[]>;
  removePendingRun(runId: string): Promise<void>;
}

const ROTATION_KEY = "pq:rotation:index";
const PENDING_SET_KEY = "pq:apify:pending";
const RUN_KEY = (runId: string) => `pq:apify:run:${runId}`;
// Stale runs (stuck actor, or ingest never got to them) are dropped after this
// long rather than polled forever.
const PENDING_RUN_TTL_SECONDS = 3 * 24 * 60 * 60;

export class InMemoryApifyRunTracker implements ApifyRunTracker {
  private index = 0;
  private readonly pending = new Map<string, PendingRun>();

  async nextRotationIndex(): Promise<number> {
    return this.index++;
  }

  async recordPendingRun(run: PendingRun): Promise<void> {
    this.pending.set(run.runId, run);
  }

  async listPendingRuns(): Promise<PendingRun[]> {
    return [...this.pending.values()];
  }

  async removePendingRun(runId: string): Promise<void> {
    this.pending.delete(runId);
  }
}

export class RedisApifyRunTracker implements ApifyRunTracker {
  private readonly redis: Redis;
  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
  }

  async nextRotationIndex(): Promise<number> {
    const next = await this.redis.incr(ROTATION_KEY);
    return next - 1;
  }

  async recordPendingRun(run: PendingRun): Promise<void> {
    await this.redis.set(RUN_KEY(run.runId), JSON.stringify(run), { ex: PENDING_RUN_TTL_SECONDS });
    await this.redis.sadd(PENDING_SET_KEY, run.runId);
  }

  async listPendingRuns(): Promise<PendingRun[]> {
    const runIds = await this.redis.smembers(PENDING_SET_KEY);
    if (!runIds.length) return [];
    const runs = await Promise.all(
      runIds.map(async (id) => {
        const raw = await this.redis.get<string | PendingRun>(RUN_KEY(id));
        if (!raw) {
          // Expired (past PENDING_RUN_TTL_SECONDS) — clean up the stale set entry.
          await this.redis.srem(PENDING_SET_KEY, id);
          return null;
        }
        return typeof raw === "string" ? (JSON.parse(raw) as PendingRun) : raw;
      }),
    );
    return runs.filter((r): r is PendingRun => r !== null);
  }

  async removePendingRun(runId: string): Promise<void> {
    await this.redis.srem(PENDING_SET_KEY, runId);
    await this.redis.del(RUN_KEY(runId));
  }
}

const globals = globalThis as typeof globalThis & {
  __qcApifyRunTracker?: ApifyRunTracker;
};

export function apifyRunTracker(): ApifyRunTracker {
  if (!globals.__qcApifyRunTracker) {
    globals.__qcApifyRunTracker =
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        ? new RedisApifyRunTracker()
        : new InMemoryApifyRunTracker();
  }
  return globals.__qcApifyRunTracker;
}
