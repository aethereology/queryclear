// Cloud-native queue of not-yet-contacted prospects, feeding the autonomous
// cold-send cron (app/api/cron/outreach-send). Replaces the local gitignored
// CSVs in docs/marketing/outreach/leads/ — those never reach Vercel, so a
// scheduler running in the cloud needs its input here instead. Prospects are
// pushed in via the /api/outreach `ingest-prospects` action (a one-time/
// periodic migration from curated CSVs); Apify-driven auto-sourcing is a
// later phase.
//
// Backed by the same Upstash Redis instance as outreach-store-redis.ts.
// In-memory impl is for local dev / tests only.

import { Redis } from "@upstash/redis";
import { normalizeEmail } from "./outreach-store";

export interface ProspectInput {
  email: string;
  domainUrl: string;
  businessName?: string;
  city?: string;
  vertical?: string;
  source?: string;
}

export interface Prospect extends ProspectInput {
  email: string;
  addedAt: string;
}

export interface QuarantinedItem {
  prospect: Partial<ProspectInput> & { email: string };
  reasons: string[];
  subject?: string;
  at: string;
}

export interface ProspectQueue {
  /** Enqueue a curated prospect. Returns false (no-op) if already seen. */
  enqueue(input: ProspectInput): Promise<boolean>;
  /** Atomically pop up to `n` prospects for sending (FIFO). */
  popBatch(n: number): Promise<Prospect[]>;
  depth(): Promise<number>;
  /** A send that failed the automated QA gate — never sent, held for review. */
  quarantine(item: Omit<QuarantinedItem, "at">): Promise<void>;
  listQuarantine(limit?: number): Promise<QuarantinedItem[]>;
  quarantineCount(): Promise<number>;
}

const QUARANTINE_MAX = 500; // bounded list; oldest trimmed on push

export class InMemoryProspectQueue implements ProspectQueue {
  private readonly queue: string[] = [];
  private readonly seen = new Set<string>();
  private readonly prospects = new Map<string, Prospect>();
  private readonly quarantined: QuarantinedItem[] = [];
  constructor(private readonly now: () => number = Date.now) {}

  async enqueue(input: ProspectInput): Promise<boolean> {
    const email = normalizeEmail(input.email);
    if (this.seen.has(email)) return false;
    this.seen.add(email);
    const prospect: Prospect = { ...input, email, addedAt: new Date(this.now()).toISOString() };
    this.prospects.set(email, prospect);
    this.queue.push(email);
    return true;
  }

  async popBatch(n: number): Promise<Prospect[]> {
    const emails = this.queue.splice(0, n);
    return emails.map((e) => this.prospects.get(e)).filter((p): p is Prospect => !!p);
  }

  async depth(): Promise<number> {
    return this.queue.length;
  }

  async quarantine(item: Omit<QuarantinedItem, "at">): Promise<void> {
    this.quarantined.unshift({ ...item, at: new Date(this.now()).toISOString() });
    this.quarantined.length = Math.min(this.quarantined.length, QUARANTINE_MAX);
  }

  async listQuarantine(limit = 50): Promise<QuarantinedItem[]> {
    return this.quarantined.slice(0, limit);
  }

  async quarantineCount(): Promise<number> {
    return this.quarantined.length;
  }
}

const QUEUE_KEY = "pq:queue";
const SEEN_KEY = "pq:seen";
const PROSPECT_KEY = (email: string) => `pq:prospect:${email}`;
const QUARANTINE_KEY = "pq:quarantine";

export class RedisProspectQueue implements ProspectQueue {
  private readonly redis: Redis;
  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
  }

  async enqueue(input: ProspectInput): Promise<boolean> {
    const email = normalizeEmail(input.email);
    const added = await this.redis.sadd(SEEN_KEY, email);
    if (added === 0) return false; // already seen — never re-enqueue
    const prospect: Prospect = { ...input, email, addedAt: new Date().toISOString() };
    await this.redis.set(PROSPECT_KEY(email), JSON.stringify(prospect));
    await this.redis.lpush(QUEUE_KEY, email);
    return true;
  }

  async popBatch(n: number): Promise<Prospect[]> {
    const out: Prospect[] = [];
    for (let i = 0; i < n; i++) {
      const email = await this.redis.rpop<string>(QUEUE_KEY);
      if (!email) break;
      const raw = await this.redis.get<string | Prospect>(PROSPECT_KEY(email));
      if (!raw) continue;
      out.push(typeof raw === "string" ? (JSON.parse(raw) as Prospect) : raw);
    }
    return out;
  }

  async depth(): Promise<number> {
    return this.redis.llen(QUEUE_KEY);
  }

  async quarantine(item: Omit<QuarantinedItem, "at">): Promise<void> {
    const entry: QuarantinedItem = { ...item, at: new Date().toISOString() };
    await this.redis.lpush(QUARANTINE_KEY, JSON.stringify(entry));
    await this.redis.ltrim(QUARANTINE_KEY, 0, QUARANTINE_MAX - 1);
  }

  async listQuarantine(limit = 50): Promise<QuarantinedItem[]> {
    const raw = await this.redis.lrange<string | QuarantinedItem>(QUARANTINE_KEY, 0, limit - 1);
    return raw.map((r) => (typeof r === "string" ? (JSON.parse(r) as QuarantinedItem) : r));
  }

  async quarantineCount(): Promise<number> {
    return this.redis.llen(QUARANTINE_KEY);
  }
}

const globals = globalThis as typeof globalThis & {
  __qcProspectQueue?: ProspectQueue;
};

export function prospectQueue(): ProspectQueue {
  if (!globals.__qcProspectQueue) {
    globals.__qcProspectQueue =
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        ? new RedisProspectQueue()
        : new InMemoryProspectQueue();
  }
  return globals.__qcProspectQueue;
}
