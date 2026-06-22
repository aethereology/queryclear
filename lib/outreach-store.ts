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
  | "replied"
  | "unsubscribed"
  | "bounced"
  | "customer";

// Statuses still eligible to receive a (next) touch. replied/unsubscribed/bounced/
// customer are terminal for sending — they drop out of the due queue.
export const ACTIVE_STATUSES: ContactStatus[] = ["cold", "opened"];

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
  emailForToken(token: string): Promise<string | null>;
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
    status: input.status ?? base.status,
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
  private readonly tokens = new Map<string, { email: string; expiresAt: number }>();
  constructor(private readonly now: () => number = Date.now) {}

  private iso() {
    return new Date(this.now()).toISOString();
  }

  async getContact(email: string): Promise<Contact | null> {
    return this.contacts.get(normalizeEmail(email)) ?? null;
  }

  async upsertContact(input: ContactInput): Promise<Contact> {
    const existing = await this.getContact(input.email);
    const merged = applyContactInput(existing, input, this.iso());
    this.contacts.set(merged.email, merged);
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
    this.contacts.set(updated.email, updated);
    return updated;
  }

  async setStatus(email: string, status: ContactStatus): Promise<Contact | null> {
    const c = await this.getContact(email);
    if (!c) return null;
    const updated = { ...c, status };
    this.contacts.set(updated.email, updated);
    return updated;
  }

  async listContacts(): Promise<Contact[]> {
    return [...this.contacts.values()];
  }

  async dueForTouch(nowIso: string): Promise<Contact[]> {
    return [...this.contacts.values()].filter((c) => isDue(c, nowIso));
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
}

// Singleton pinned to globalThis (shared across route modules). Redis when the
// Upstash env is present (production + local, since .env.local has KV), else memory.
const globals = globalThis as typeof globalThis & {
  __qcOutreachStore?: OutreachStore;
};

export function outreachStore(): OutreachStore {
  if (!globals.__qcOutreachStore) {
    globals.__qcOutreachStore =
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        ? new RedisOutreachStore()
        : new InMemoryOutreachStore();
  }
  return globals.__qcOutreachStore;
}
