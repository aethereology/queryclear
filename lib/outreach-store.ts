// The cold-outreach masterlist: one durable contact ledger so we never double-send
// across the many CSVs dropped in docs/marketing/outreach/leads/, and so every touch
// is recorded for the assisted nurture cadence.
//
// Backed by the provisioned Upstash Redis in production (REQUIRED — reachable by both
// the Vercel route and the local CLI, which a leads-folder file is not). In-memory
// impl is for local dev / tests only. Same split as public-audit.ts so the pure
// in-memory logic carries no runtime import and stays unit-testable.

import { RedisOutreachStore } from "./outreach-store-redis";

export type ContactStatus =
  | "cold"
  | "opened"
  | "warm"
  | "replied"
  | "unsubscribed"
  | "bounced"
  | "customer";

// Statuses still eligible to receive a (next) touch. warm/replied/unsubscribed/
// bounced/customer are terminal for sending — they drop out of the due queue.
// `warm` is set the instant autonomous detection sees strong engagement (a
// reply, via the Graph warm-scan cron) — it is deliberately excluded here so
// nextStep()/isDue() stop the cadence on the very next tick: an interested
// prospect must never receive another cold-looking autonomous follow-up.
export const ACTIVE_STATUSES: ContactStatus[] = ["cold", "opened"];
export const OUTREACH_ACTIVITY_RETENTION_MS = 18 * 30 * 24 * 60 * 60 * 1000;
export const SUPPRESSION_STATUSES: ContactStatus[] = ["unsubscribed", "bounced"];

export class OutreachStoreUnavailableError extends Error {
  constructor(message = "Shared outreach storage is not configured.") {
    super(message);
    this.name = "OutreachStoreUnavailableError";
  }
}

export interface Touch {
  n: number;
  type: string; // "cold-audit" | "bump" | "tip" | ...
  at: string; // ISO
  reportToken?: string;
}

export interface Contact {
  email: string; // normalized: trimmed + lowercased (the key)
  business?: string;
  domain?: string;
  city?: string;
  vertical?: string;
  sourceCsv?: string;
  status: ContactStatus;
  touches: Touch[];
  lastTouchAt?: string;
  nextDueAt?: string;
  createdAt: string;
}

export type ContactInput = Partial<Omit<Contact, "email" | "touches" | "createdAt">> & {
  email: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface SendCapResult {
  allowed: boolean;
  sentToday: number;
  cap: number;
}

export interface OutreachStore {
  getContact(email: string): Promise<Contact | null>;
  /** Create or shallow-merge a contact. Never resets status/touches/createdAt. */
  upsertContact(input: ContactInput): Promise<Contact>;
  recordTouch(email: string, touch: Touch, nextDueAt?: string | null): Promise<Contact | null>;
  setStatus(email: string, status: ContactStatus): Promise<Contact | null>;
  listContacts(): Promise<Contact[]>;
  /** Active contacts whose next touch is due at or before `nowIso`. */
  dueForTouch(nowIso: string): Promise<Contact[]>;
  /** Map an unguessable report token back to the contact it was sent to. */
  linkToken(token: string, email: string, ttlMs: number): Promise<void>;
  /**
   * Re-point a contact's report link at a freshly minted token. Used when the
   * original touch-1 report lapsed and ensureReportLink() re-audited, so later
   * follow-ups reuse the new token instead of re-minting every time.
   */
  setReportToken(email: string, token: string): Promise<Contact | null>;
  emailForToken(token: string): Promise<string | null>;
  /**
   * Atomically reserve `n` sends against a shared daily cap (resets at UTC
   * midnight). The autonomous cron calls this immediately before every send —
   * cold and follow-up alike — so nothing sends once the cap is hit. Passing
   * n=0 peeks the current count without reserving anything (safe for a
   * read-only digest).
   */
  reserveSend(n: number, cap: number): Promise<SendCapResult>;
  /**
   * Give back a reservation that never became a send. `reserveSend` is called
   * BEFORE the audit + QA gate (so the cap is enforced before we spend money on
   * an audit), which means a quarantined, audit-failed, or undelivered item
   * would otherwise burn a slot forever. Every non-send path must release.
   */
  releaseSend(n: number): Promise<void>;
}

// Merge helper shared by both implementations: apply input fields onto an existing
// (or fresh) contact without clobbering history.
export function applyContactInput(existing: Contact | null, input: ContactInput, nowIso: string): Contact {
  const email = normalizeEmail(input.email);
  const base: Contact =
    existing ?? {
      email,
      status: "cold",
      touches: [],
      createdAt: nowIso,
    };
  return {
    ...base,
    email,
    business: input.business ?? base.business,
    domain: input.domain ?? base.domain,
    city: input.city ?? base.city,
    vertical: input.vertical ?? base.vertical,
    sourceCsv: input.sourceCsv ?? base.sourceCsv,
    // A CSV re-import must never reactivate a suppression. Re-consent, if ever
    // supported, needs a separate audited workflow rather than an upsert.
    status: SUPPRESSION_STATUSES.includes(base.status)
      ? base.status
      : (input.status ?? base.status),
  };
}

export function isDue(contact: Contact, nowIso: string): boolean {
  if (!ACTIVE_STATUSES.includes(contact.status)) return false;
  if (!contact.nextDueAt) return false;
  return contact.nextDueAt <= nowIso;
}

/** In-memory store — LOCAL DEV / TESTS ONLY (does nothing across Vercel instances). */
export class InMemoryOutreachStore implements OutreachStore {
  private readonly contacts = new Map<string, Contact>();
  private readonly contactExpiresAt = new Map<string, number>();
  private readonly suppressions = new Map<string, { status: ContactStatus; recordedAt: string }>();
  private readonly tokens = new Map<string, { email: string; expiresAt: number }>();
  private sendCap = { day: "", count: 0 };
  constructor(private readonly now: () => number = Date.now) {}

  private iso() {
    return new Date(this.now()).toISOString();
  }

  private saveContact(contact: Contact) {
    this.contacts.set(contact.email, contact);
    this.contactExpiresAt.set(contact.email, this.now() + OUTREACH_ACTIVITY_RETENTION_MS);
    if (SUPPRESSION_STATUSES.includes(contact.status)) {
      this.suppressions.set(contact.email, { status: contact.status, recordedAt: this.iso() });
    }
  }

  async getContact(email: string): Promise<Contact | null> {
    const normalized = normalizeEmail(email);
    const contact = this.contacts.get(normalized);
    if (contact && (this.contactExpiresAt.get(normalized) ?? 0) > this.now()) return contact;
    this.contacts.delete(normalized);
    this.contactExpiresAt.delete(normalized);
    const suppression = this.suppressions.get(normalized);
    return suppression
      ? {
          email: normalized,
          status: suppression.status,
          touches: [],
          createdAt: suppression.recordedAt,
        }
      : null;
  }

  async upsertContact(input: ContactInput): Promise<Contact> {
    const existing = await this.getContact(input.email);
    const merged = applyContactInput(existing, input, this.iso());
    this.saveContact(merged);
    return merged;
  }

  async recordTouch(email: string, touch: Touch, nextDueAt?: string | null): Promise<Contact | null> {
    const c = await this.getContact(email);
    if (!c) return null;
    const updated: Contact = {
      ...c,
      touches: [...c.touches, touch],
      lastTouchAt: touch.at,
      nextDueAt: nextDueAt === null ? undefined : (nextDueAt ?? c.nextDueAt),
    };
    this.saveContact(updated);
    return updated;
  }

  async setReportToken(email: string, token: string): Promise<Contact | null> {
    const c = await this.getContact(email);
    if (!c || c.touches.length === 0) return null;
    const touches = [...c.touches];
    touches[0] = { ...touches[0], reportToken: token };
    const updated = { ...c, touches };
    this.saveContact(updated);
    return updated;
  }

  async setStatus(email: string, status: ContactStatus): Promise<Contact | null> {
    const c = await this.getContact(email);
    if (!c) return null;
    if (SUPPRESSION_STATUSES.includes(c.status) && !SUPPRESSION_STATUSES.includes(status)) {
      return c;
    }
    const updated = { ...c, status };
    this.saveContact(updated);
    return updated;
  }

  async listContacts(): Promise<Contact[]> {
    const contacts = await Promise.all([...this.contacts.keys()].map((email) => this.getContact(email)));
    return contacts.filter((contact): contact is Contact => contact !== null);
  }

  async dueForTouch(nowIso: string): Promise<Contact[]> {
    return (await this.listContacts()).filter((c) => isDue(c, nowIso));
  }

  async linkToken(token: string, email: string, ttlMs: number): Promise<void> {
    this.tokens.set(token, { email: normalizeEmail(email), expiresAt: this.now() + ttlMs });
  }

  async emailForToken(token: string): Promise<string | null> {
    const hit = this.tokens.get(token);
    if (!hit || this.now() >= hit.expiresAt) {
      this.tokens.delete(token);
      return null;
    }
    return hit.email;
  }

  async reserveSend(n: number, cap: number): Promise<SendCapResult> {
    const day = this.iso().slice(0, 10);
    if (this.sendCap.day !== day) this.sendCap = { day, count: 0 };
    if (this.sendCap.count + n > cap) {
      return { allowed: false, sentToday: this.sendCap.count, cap };
    }
    this.sendCap.count += n;
    return { allowed: true, sentToday: this.sendCap.count, cap };
  }

  async releaseSend(n: number): Promise<void> {
    const day = this.iso().slice(0, 10);
    if (this.sendCap.day !== day) return; // reservation belonged to a past day
    this.sendCap.count = Math.max(0, this.sendCap.count - n);
  }
}

// Singleton pinned to globalThis (shared across route modules). Redis when the
// Upstash env is present (production + local, since .env.local has KV), else memory.
const globals = globalThis as typeof globalThis & {
  __qcOutreachStore?: OutreachStore;
};

export function outreachStore(): OutreachStore {
  if (!globals.__qcOutreachStore) {
    const hasUrl = Boolean(process.env.KV_REST_API_URL?.trim());
    const hasToken = Boolean(process.env.KV_REST_API_TOKEN?.trim());
    if (hasUrl !== hasToken) {
      throw new OutreachStoreUnavailableError(
        "Shared outreach storage is partially configured; both Redis credentials are required.",
      );
    }
    if (hasUrl && hasToken) globals.__qcOutreachStore = new RedisOutreachStore();
    else if (process.env.NODE_ENV === "production") throw new OutreachStoreUnavailableError();
    else globals.__qcOutreachStore = new InMemoryOutreachStore();
  }
  return globals.__qcOutreachStore;
}
