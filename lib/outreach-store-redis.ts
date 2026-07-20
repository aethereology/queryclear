// Upstash Redis implementation of OutreachStore. MANDATORY in production (and used
// locally too, since .env.local carries the KV_REST_API_* env). Reads the same
// provisioned Upstash instance as public-audit-redis.ts.

import { Redis } from "@upstash/redis";
import {
  applyContactInput,
  isDue,
  normalizeEmail,
  type Contact,
  type ContactInput,
  type ContactStatus,
  type OutreachStore,
  type SendCapResult,
  type Touch,
} from "./outreach-store";

const CONTACT_KEY = (email: string) => `oc:contact:${email}`;
const TOKEN_KEY = (token: string) => `oc:token:${token}`;
const INDEX_KEY = "oc:contacts";
const SENDCAP_KEY = (day: string) => `oc:sendcap:${day}`;
const SENDCAP_TTL_SECONDS = 2 * 24 * 60 * 60; // keep the counter ~2 days

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export class RedisOutreachStore implements OutreachStore {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
  }

  private iso() {
    return new Date().toISOString();
  }

  private async readContact(email: string): Promise<Contact | null> {
    const value = await this.redis.get<string | Contact>(CONTACT_KEY(email));
    if (!value) return null;
    return typeof value === "string" ? (JSON.parse(value) as Contact) : value;
  }

  private async writeContact(c: Contact): Promise<void> {
    await this.redis.set(CONTACT_KEY(c.email), JSON.stringify(c));
    await this.redis.sadd(INDEX_KEY, c.email);
  }

  async getContact(email: string): Promise<Contact | null> {
    return this.readContact(normalizeEmail(email));
  }

  async upsertContact(input: ContactInput): Promise<Contact> {
    const email = normalizeEmail(input.email);
    const existing = await this.readContact(email);
    const merged = applyContactInput(existing, input, this.iso());
    await this.writeContact(merged);
    return merged;
  }

  async recordTouch(email: string, touch: Touch, nextDueAt?: string | null): Promise<Contact | null> {
    const c = await this.readContact(normalizeEmail(email));
    if (!c) return null;
    const updated: Contact = {
      ...c,
      touches: [...c.touches, touch],
      lastTouchAt: touch.at,
      nextDueAt: nextDueAt === null ? undefined : (nextDueAt ?? c.nextDueAt),
    };
    await this.writeContact(updated);
    return updated;
  }

  async setStatus(email: string, status: ContactStatus): Promise<Contact | null> {
    const c = await this.readContact(normalizeEmail(email));
    if (!c) return null;
    const updated = { ...c, status };
    await this.writeContact(updated);
    return updated;
  }

  async listContacts(): Promise<Contact[]> {
    const emails = await this.redis.smembers(INDEX_KEY);
    if (!emails.length) return [];
    const contacts = await Promise.all(emails.map((e) => this.readContact(e)));
    return contacts.filter((c): c is Contact => c !== null);
  }

  async dueForTouch(nowIso: string): Promise<Contact[]> {
    const all = await this.listContacts();
    return all.filter((c) => isDue(c, nowIso));
  }

  async linkToken(token: string, email: string, ttlMs: number): Promise<void> {
    await this.redis.set(TOKEN_KEY(token), normalizeEmail(email), {
      ex: Math.ceil(ttlMs / 1000),
    });
  }

  async emailForToken(token: string): Promise<string | null> {
    return this.redis.get<string>(TOKEN_KEY(token));
  }

  // Same atomic incr-then-rollback shape as reserveSpend in public-audit-redis.ts,
  // for an integer send count instead of a float dollar amount. INCRBY is atomic
  // in Redis, so concurrent cron ticks can never both slip past the cap.
  async reserveSend(n: number, cap: number): Promise<SendCapResult> {
    const key = SENDCAP_KEY(utcDate());
    const total = await this.redis.incrby(key, n);
    await this.redis.expire(key, SENDCAP_TTL_SECONDS);
    if (total > cap) {
      if (n !== 0) await this.redis.incrby(key, -n); // release; over cap
      return { allowed: false, sentToday: total - n, cap };
    }
    return { allowed: true, sentToday: total, cap };
  }
}
