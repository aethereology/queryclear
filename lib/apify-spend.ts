// Daily spend cap for Apify prospect-sourcing runs. Same atomic incr-then-
// rollback shape as reserveSpend in lib/public-audit-redis.ts and reserveSend
// in lib/outreach-store-redis.ts — checked before every startPlacesRun so a
// runaway cron can never blow past APIFY_DAILY_CAP_USD.

import { Redis } from "@upstash/redis";

export interface ApifySpendResult {
  allowed: boolean;
  spentUsd: number;
  capUsd: number;
}

export interface ApifySpendGuard {
  reserveSpend(costUsd: number, capUsd: number): Promise<ApifySpendResult>;
}

const SPEND_TTL_SECONDS = 2 * 24 * 60 * 60;

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export class InMemoryApifySpendGuard implements ApifySpendGuard {
  private spend = { day: "", usd: 0 };
  constructor(private readonly now: () => number = Date.now) {}

  async reserveSpend(costUsd: number, capUsd: number): Promise<ApifySpendResult> {
    const day = new Date(this.now()).toISOString().slice(0, 10);
    if (this.spend.day !== day) this.spend = { day, usd: 0 };
    if (this.spend.usd + costUsd > capUsd) {
      return { allowed: false, spentUsd: this.spend.usd, capUsd };
    }
    this.spend.usd += costUsd;
    return { allowed: true, spentUsd: this.spend.usd, capUsd };
  }
}

export class RedisApifySpendGuard implements ApifySpendGuard {
  private readonly redis: Redis;
  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
  }

  async reserveSpend(costUsd: number, capUsd: number): Promise<ApifySpendResult> {
    const key = `pq:apify-spend:${utcDate()}`;
    const total = Number(await this.redis.incrbyfloat(key, costUsd));
    await this.redis.expire(key, SPEND_TTL_SECONDS);
    if (total > capUsd) {
      await this.redis.incrbyfloat(key, -costUsd);
      return { allowed: false, spentUsd: total - costUsd, capUsd };
    }
    return { allowed: true, spentUsd: total, capUsd };
  }
}

const globals = globalThis as typeof globalThis & {
  __qcApifySpendGuard?: ApifySpendGuard;
};

export function apifySpendGuard(): ApifySpendGuard {
  if (!globals.__qcApifySpendGuard) {
    globals.__qcApifySpendGuard =
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        ? new RedisApifySpendGuard()
        : new InMemoryApifySpendGuard();
  }
  return globals.__qcApifySpendGuard;
}
