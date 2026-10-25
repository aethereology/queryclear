import { Redis } from "@upstash/redis";

export interface OwnerAuditEntry { token: string; domainUrl: string; createdAt: number; expiresAt: number }
const KEY = "owner:audits:v1";
export const OWNER_HISTORY_LIMIT = 40;
export function ownerAuditHistory() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new Error("History unavailable");
  return new OwnerAuditHistory(new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN }));
}
export class OwnerAuditHistory {
  constructor(private readonly redis: Redis) {}
  async list(): Promise<OwnerAuditEntry[]> {
    const entries = await this.redis.lrange<OwnerAuditEntry>(KEY, 0, OWNER_HISTORY_LIMIT - 1);
    return entries.filter(entry => entry && typeof entry.token === "string" && typeof entry.domainUrl === "string" && Number.isFinite(entry.createdAt) && entry.expiresAt > Date.now());
  }
  async add(entry: OwnerAuditEntry) {
    await this.redis.eval(`local incoming = cjson.decode(ARGV[1])
for _, raw in ipairs(redis.call('LRANGE', KEYS[1], 0, 39)) do
  if cjson.decode(raw).token == incoming.token then redis.call('LREM', KEYS[1], 0, raw) end
end
redis.call('LPUSH', KEYS[1], ARGV[1])
redis.call('LTRIM', KEYS[1], 0, 39)
redis.call('PEXPIRE', KEYS[1], 86400000)
return 1`, [KEY], [JSON.stringify(entry)]);
  }
}
