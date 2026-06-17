// Upstash Redis implementation of PublicAuditStore. MANDATORY in production:
// Vercel functions are multi-instance, so the daily cap and report cache must
// live in shared state. Reads the provisioned KV_REST_API_* env vars.

import { Redis } from "@upstash/redis";
import type {
  PublicAuditStore,
  RateLimitResult,
  SpendResult
} from "./public-audit";
import type { AuditReportData } from "./agent-runtime";

const SPEND_TTL_SECONDS = 2 * 24 * 60 * 60; // keep daily counter ~2 days

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export class RedisPublicAuditStore implements PublicAuditStore {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!
      });
  }

  async rateLimit(ip: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const key = `pa:rl:${ip}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }
    if (count > limit) {
      const ttl = await this.redis.pttl(key);
      return { allowed: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  async reserveSpend(costUsd: number, capUsd: number): Promise<SpendResult> {
    const key = `pa:spend:${utcDate()}`;
    const total = Number(await this.redis.incrbyfloat(key, costUsd));
    await this.redis.expire(key, SPEND_TTL_SECONDS);
    if (total > capUsd) {
      await this.redis.incrbyfloat(key, -costUsd); // release; over cap
      return { allowed: false, spentUsd: total - costUsd, capUsd };
    }
    return { allowed: true, spentUsd: total, capUsd };
  }

  async releaseSpend(costUsd: number): Promise<void> {
    await this.redis.incrbyfloat(`pa:spend:${utcDate()}`, -costUsd);
  }

  async putReport(token: string, report: AuditReportData, ttlMs: number): Promise<void> {
    await this.redis.set(`pa:report:${token}`, JSON.stringify(report), {
      ex: Math.ceil(ttlMs / 1000)
    });
  }

  async getReport(token: string): Promise<AuditReportData | null> {
    const value = await this.redis.get<string | AuditReportData>(`pa:report:${token}`);
    if (!value) return null;
    // Upstash may auto-deserialize JSON; handle both string and object.
    return typeof value === "string" ? (JSON.parse(value) as AuditReportData) : value;
  }
}
