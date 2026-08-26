// Upstash Redis implementation of OutreachStore. MANDATORY in production (and used
// locally too, since .env.local carries the KV_REST_API_* env). Reads the same
// provisioned Upstash instance as public-audit-redis.ts.

import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
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

const contactId = (email: string) =>
  createHash("sha256").update(normalizeEmail(email)).digest("hex");
const CONTACT_KEY = (email: string) => `oc:contact:v2:${contactId(email)}`;
const CONTACT_KEY_FROM_ID = (id: string) => `oc:contact:v2:${id}`;
const LEGACY_CONTACT_KEY = (email: string) => `oc:contact:${email}`;
const SUPPRESSION_KEY = (email: string) => `oc:suppression:${contactId(email)}`;
const TOKEN_KEY = (token: string) => `oc:token:${token}`;
const INDEX_KEY = "oc:contacts:v2";
const LEGACY_INDEX_KEY = "oc:contacts";
const SENDCAP_KEY = (day: string) => `oc:sendcap:${day}`;
const SENDCAP_TTL_SECONDS = 2 * 24 * 60 * 60; // keep the counter ~2 days
// Kept local to avoid reading a const across the deliberate store/Redis module
// cycle during Next.js route initialization.
const CONTACT_TTL_SECONDS = 18 * 30 * 24 * 60 * 60;
const isSuppressionStatus = (status: ContactStatus) =>
  status === "unsubscribed" || status === "bounced";

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export class RedisOutreachStore implements OutreachStore {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    const url = process.env.KV_REST_API_URL?.trim();
    const token = process.env.KV_REST_API_TOKEN?.trim();
    if (!redis && (!url || !token)) {
      throw new Error("Both Redis credentials are required for the outreach store.");
    }
    this.redis =
      redis ??
      new Redis({
        url: url!,
        token: token!,
      });
  }

  private iso() {
    return new Date().toISOString();
  }

  private async readContact(email: string): Promise<Contact | null> {
    const value = await this.redis.get<string | Contact>(CONTACT_KEY(email));
    if (value) return typeof value === "string" ? (JSON.parse(value) as Contact) : value;

    const legacy = await this.redis.get<string | Contact>(LEGACY_CONTACT_KEY(email));
    if (legacy) {
      const migrated = typeof legacy === "string" ? (JSON.parse(legacy) as Contact) : legacy;
      await this.writeContact(migrated);
      await this.redis.expire(LEGACY_CONTACT_KEY(email), CONTACT_TTL_SECONDS);
      await this.redis.srem(LEGACY_INDEX_KEY, normalizeEmail(email));
      return migrated;
    }

    const suppression = await this.redis.get<
      string | { email: string; status: ContactStatus; recordedAt: string }
    >(SUPPRESSION_KEY(email));
    if (!suppression) return null;
    const parsed =
      typeof suppression === "string"
        ? (JSON.parse(suppression) as { email: string; status: ContactStatus; recordedAt: string })
        : suppression;
    return {
      email: parsed.email,
      status: parsed.status,
      touches: [],
      createdAt: parsed.recordedAt,
    };
  }

  private async writeContact(c: Contact): Promise<void> {
    await this.redis.set(CONTACT_KEY(c.email), JSON.stringify(c), { ex: CONTACT_TTL_SECONDS });
    await this.redis.sadd(INDEX_KEY, contactId(c.email));
    await this.redis.expire(INDEX_KEY, CONTACT_TTL_SECONDS);
    if (isSuppressionStatus(c.status)) {
      await this.redis.set(
        SUPPRESSION_KEY(c.email),
        JSON.stringify({ email: c.email, status: c.status, recordedAt: this.iso() }),
      );
    }
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
    if (isSuppressionStatus(c.status) && !isSuppressionStatus(status)) return c;
    const updated = { ...c, status };
    await this.writeContact(updated);
    return updated;
  }

  async setReportToken(email: string, token: string): Promise<Contact | null> {
    const c = await this.readContact(normalizeEmail(email));
    if (!c || c.touches.length === 0) return null;
    const touches = [...c.touches];
    touches[0] = { ...touches[0], reportToken: token };
    const updated = { ...c, touches };
    await this.writeContact(updated);
    return updated;
  }

  async listContacts(): Promise<Contact[]> {
    // One-time, non-destructive migration from the legacy email-valued index.
    // Full records receive the 18-month TTL and the old PII index member is
    // removed only after the v2 record is safely written.
    const legacyEmails = await this.redis.smembers(LEGACY_INDEX_KEY);
    for (const email of legacyEmails) {
      const value = await this.redis.get<string | Contact>(LEGACY_CONTACT_KEY(email));
      if (value) {
        const contact = typeof value === "string" ? (JSON.parse(value) as Contact) : value;
        await this.writeContact(contact);
        await this.redis.expire(LEGACY_CONTACT_KEY(email), CONTACT_TTL_SECONDS);
      }
      await this.redis.srem(LEGACY_INDEX_KEY, email);
    }

    const ids = await this.redis.smembers(INDEX_KEY);
    if (!ids.length) return [];
    const contacts = await Promise.all(
      ids.map(async (id) => {
        const value = await this.redis.get<string | Contact>(CONTACT_KEY_FROM_ID(id));
        if (!value) {
          await this.redis.srem(INDEX_KEY, id);
          return null;
        }
        return typeof value === "string" ? (JSON.parse(value) as Contact) : value;
      }),
    );
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

  // Counterpart to reserveSend, for the paths that reserve then bail (quarantine,
  // audit failure, delivery failure). Clamped at zero so a double-release can
  // never drive the day's count negative and hand out free sends.
  async releaseSend(n: number): Promise<void> {
    if (n <= 0) return;
    const key = SENDCAP_KEY(utcDate());
    const total = await this.redis.incrby(key, -n);
    if (total < 0) await this.redis.set(key, 0, { ex: SENDCAP_TTL_SECONDS });
  }
}
