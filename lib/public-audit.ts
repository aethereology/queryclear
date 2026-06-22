// Abuse + cost guardrails for the PUBLIC lead-magnet audit (queryclear.com/free-audit).
//
// A public endpoint that calls OpenAI per request is a money bomb, so every
// request passes two gates before any model call: (1) per-IP rate limit and
// (2) a global daily spend cap. Each audit's full report is cached briefly so
// the email gate reveals it without re-running (re-paying for) the audit.
//
// The store is async and behind an interface. In production it's backed by the
// provisioned Upstash Redis (the KV_REST_API_* env vars) — REQUIRED because
// Vercel functions are multi-instance, so an in-memory counter holds neither
// the cap nor the cache. The in-memory impl is for local dev only.

import type { AuditReportData } from "./agent-runtime";
import { RedisPublicAuditStore } from "./public-audit-redis";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface SpendResult {
  allowed: boolean;
  spentUsd: number;
  capUsd: number;
}

export interface PublicAuditStore {
  rateLimit(ip: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reserveSpend(costUsd: number, capUsd: number): Promise<SpendResult>;
  releaseSpend(costUsd: number): Promise<void>;
  putReport(token: string, report: AuditReportData, ttlMs: number): Promise<void>;
  getReport(token: string): Promise<AuditReportData | null>;
  /** First-view latch: returns true only the first time a token is viewed. */
  markViewedOnce(token: string, ttlMs: number): Promise<boolean>;
}

interface Window {
  count: number;
  resetAt: number;
}
interface CachedReport {
  report: AuditReportData;
  expiresAt: number;
}

/** In-memory store — LOCAL DEV ONLY (does nothing across Vercel instances). */
export class InMemoryPublicAuditStore implements PublicAuditStore {
  private readonly ipWindows = new Map<string, Window>();
  private spend = { day: "", usd: 0 };
  private readonly reports = new Map<string, CachedReport>();
  private readonly viewed = new Set<string>();
  constructor(private readonly now: () => number = Date.now) {}

  async rateLimit(ip: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const t = this.now();
    const w = this.ipWindows.get(ip);
    if (!w || t >= w.resetAt) {
      this.ipWindows.set(ip, { count: 1, resetAt: t + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }
    if (w.count >= limit) return { allowed: false, retryAfterMs: w.resetAt - t };
    w.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  async reserveSpend(costUsd: number, capUsd: number): Promise<SpendResult> {
    const day = new Date(this.now()).toISOString().slice(0, 10);
    if (this.spend.day !== day) this.spend = { day, usd: 0 };
    if (this.spend.usd + costUsd > capUsd) {
      return { allowed: false, spentUsd: this.spend.usd, capUsd };
    }
    this.spend.usd += costUsd;
    return { allowed: true, spentUsd: this.spend.usd, capUsd };
  }

  async releaseSpend(costUsd: number): Promise<void> {
    this.spend.usd = Math.max(0, this.spend.usd - costUsd);
  }

  async putReport(token: string, report: AuditReportData, ttlMs: number): Promise<void> {
    this.reports.set(token, { report, expiresAt: this.now() + ttlMs });
  }

  async getReport(token: string): Promise<AuditReportData | null> {
    const hit = this.reports.get(token);
    if (!hit || this.now() >= hit.expiresAt) {
      this.reports.delete(token);
      return null;
    }
    return hit.report;
  }

  async markViewedOnce(token: string): Promise<boolean> {
    if (this.viewed.has(token)) return false;
    this.viewed.add(token);
    return true;
  }
}

export interface PublicAuditConfig {
  dailyCapUsd: number;
  costPerAuditUsd: number;
  ipLimit: number;
  ipWindowMs: number;
  reportTtlMs: number;
}

export function publicAuditConfig(): PublicAuditConfig {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    dailyCapUsd: num(process.env.PUBLIC_AUDIT_DAILY_CAP_USD, 5),
    costPerAuditUsd: num(process.env.PUBLIC_AUDIT_COST_USD, 0.01),
    ipLimit: num(process.env.PUBLIC_AUDIT_IP_LIMIT, 5),
    ipWindowMs: num(process.env.PUBLIC_AUDIT_IP_WINDOW_MS, 60 * 60 * 1000),
    reportTtlMs: num(process.env.PUBLIC_AUDIT_REPORT_TTL_MS, DAY_MS)
  };
}

/** The summary a visitor sees for free, before the email gate. */
export interface AuditSummary {
  token: string;
  domainUrl: string;
  pageTitle: string;
  technicalIssues: number;
  invisibleQueries: number;
  recommendations: number;
  topFindings: { title: string; severity: string }[];
}

export function summarize(token: string, report: AuditReportData): AuditSummary {
  return {
    token,
    domainUrl: report.domain_url,
    pageTitle: report.page_title,
    technicalIssues: report.findings.length,
    invisibleQueries: report.queries.filter((q) => q.cited_count === 0).length,
    recommendations: report.recommendations.length,
    topFindings: report.findings.slice(0, 3).map((f) => ({ title: f.title, severity: f.severity }))
  };
}

// Singleton pinned to globalThis (shared across route modules). Uses Redis when
// the Upstash env is present (production), else in-memory for local dev.
const globals = globalThis as typeof globalThis & {
  __qcPublicAuditStore?: PublicAuditStore;
};

export function publicAuditStore(): PublicAuditStore {
  if (!globals.__qcPublicAuditStore) {
    globals.__qcPublicAuditStore =
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        ? new RedisPublicAuditStore()
        : new InMemoryPublicAuditStore();
  }
  return globals.__qcPublicAuditStore;
}
