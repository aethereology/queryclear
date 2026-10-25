// Upstash Redis implementation of PublicAuditStore. MANDATORY in production:
// Vercel functions are multi-instance, so the daily cap and report cache must
// live in shared state. Reads the provisioned KV_REST_API_* env vars.

import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
import type {
  PublicAuditStore,
  AuditAttempt,
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

  async claimAttempt(key: string, owner: string): Promise<AuditAttempt> {
    const claimed = await this.redis.set(`pa:attempt:${key}`, { owner }, { nx: true, px: 120_000 });
    if (claimed === "OK") return "claimed";
    const value = await this.redis.get<{ token?: string }>(`pa:attempt:${key}`);
    return value?.token ? { token: value.token } : "pending";
  }

  async finishAttempt(key: string, owner: string, token: string, ttlMs: number): Promise<void> {
    await this.redis.eval(`local raw = redis.call('GET', KEYS[1])
if raw and cjson.decode(raw).owner == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
  return 1
end
return 0`, [`pa:attempt:${key}`], [owner, JSON.stringify({ token }), ttlMs]);
  }

  async releaseAttempt(key: string, owner: string): Promise<void> {
    await this.redis.eval(`local raw = redis.call('GET', KEYS[1])
if raw and cjson.decode(raw).owner == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0`, [`pa:attempt:${key}`], [owner]);
  }

  async rateLimit(ip: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const identity = createHash("sha256").update(ip).digest("hex").slice(0, 32);
    const key = `pa:rl:v2:${identity}`;
    const [rawCount, rawTtl] = await this.redis.eval<[number], [number, number]>(
      `local count = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if count == 1 or ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}`,
      [key],
      [windowMs],
    );
    const count = Number(rawCount);
    if (count > limit) {
      const ttl = Number(rawTtl);
      return { allowed: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  async reserveSpend(costUsd: number, capUsd: number): Promise<SpendResult> {
    const key = `pa:spend:${utcDate()}`;
    const [rawAllowed, rawTotal] = await this.redis.eval<
      [number, number, number],
      [number, string | number]
    >(
      `local total = tonumber(redis.call("INCRBYFLOAT", KEYS[1], ARGV[1]))
local ttl = redis.call("TTL", KEYS[1])
if ttl < 0 then redis.call("EXPIRE", KEYS[1], ARGV[3]) end
if total > tonumber(ARGV[2]) then
  total = tonumber(redis.call("INCRBYFLOAT", KEYS[1], -tonumber(ARGV[1])))
  if total < 0 then redis.call("SET", KEYS[1], 0, "EX", ARGV[3]); total = 0 end
  return {0, tostring(total)}
end
return {1, tostring(total)}`,
      [key],
      [costUsd, capUsd, SPEND_TTL_SECONDS],
    );
    const allowed = Number(rawAllowed) === 1;
    const spentUsd = Number(rawTotal);
    return { allowed, spentUsd, capUsd };
  }

  async releaseSpend(costUsd: number): Promise<void> {
    await this.redis.eval<[number, number], number>(
      `local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local next = math.max(0, current - tonumber(ARGV[1]))
local ttl = redis.call("TTL", KEYS[1])
if ttl > 0 then redis.call("SET", KEYS[1], tostring(next), "EX", ttl)
else redis.call("SET", KEYS[1], tostring(next), "EX", ARGV[2]) end
return next`,
      [`pa:spend:${utcDate()}`],
      [costUsd, SPEND_TTL_SECONDS],
    );
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

  async markViewedOnce(token: string, ttlMs: number): Promise<boolean> {
    // SET NX → "OK" only if the key didn't exist; null if it did (already viewed).
    const res = await this.redis.set(`pa:viewed:${token}`, 1, {
      nx: true,
      ex: Math.ceil(ttlMs / 1000),
    });
    return res === "OK";
  }
}
