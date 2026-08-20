import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import { configuredSocialAccounts, DEFAULT_SOCIAL_SETTINGS } from "./config";
import type {
  AccountReadiness,
  AuditLogEntry,
  Campaign,
  ChannelPost,
  EngagementEvent,
  MediaAsset,
  MetricSnapshot,
  SocialAccount,
  SocialAction,
  SocialActionKind,
  SocialCapabilities,
  SocialDashboardSnapshot,
  SocialConversion,
  SocialSettings,
} from "./types";

const K = {
  settings: "social:settings",
  accounts: "social:accounts",
  account: (id: string) => `social:account:${id}`,
  campaigns: "social:campaigns",
  campaign: (id: string) => `social:campaign:${id}`,
  posts: "social:posts",
  post: (id: string) => `social:post:${id}`,
  actions: "social:actions",
  action: (id: string) => `social:action:${id}`,
  actionDue: "social:action:due",
  actionIdempotency: (key: string) => `social:action:idempotency:${key}`,
  engagements: "social:engagements",
  engagement: (id: string) => `social:engagement:${id}`,
  eventSeen: (platformId: string) => `social:event:seen:${platformId}`,
  metrics: "social:metrics",
  metric: (id: string) => `social:metric:${id}`,
  conversions: "social:conversions",
  conversion: (id: string) => `social:conversion:${id}`,
  media: "social:media",
  mediaItem: (id: string) => `social:media:${id}`,
  audit: "social:audit",
  spend: (month: string) => `social:spend:${month}`,
  cap: (accountId: string, kind: string, period: string) => `social:cap:${accountId}:${kind}:${period}`,
  disabledCaps: (accountId: string) => `social:account:${accountId}:disabled-caps`,
  remoteId: (accountId: string) => `social:account:${accountId}:remote-id`,
  readiness: (accountId: string) => `social:account:${accountId}:readiness`,
  dmRecipient: (accountId: string, actorIdHash: string) => `social:dm:recipient:${accountId}:${actorIdHash}`,
  oauth: (state: string) => `social:oauth:${state}`,
  token: (accountId: string) => `social:token:${accountId}`,
  lease: (id: string) => `social:lease:${id}`,
};

const DM_COOLDOWN_SECONDS = 30 * 24 * 60 * 60;

function parse<T>(value: unknown): T | null {
  if (!value) return null;
  return typeof value === "string" ? (JSON.parse(value) as T) : (value as T);
}

function redisClient() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN are required for social orchestration.");
  return new Redis({ url, token });
}

export class SocialStore {
  constructor(private readonly redis: Redis = redisClient()) {}

  private async read<T>(key: string): Promise<T | null> {
    return parse<T>(await this.redis.get(key));
  }

  private async write(key: string, value: unknown) {
    await this.redis.set(key, JSON.stringify(value));
  }

  private async listFromIndex<T>(index: string, key: (id: string) => string, limit = 100): Promise<T[]> {
    const ids = (await this.redis.zrange<string[]>(index, 0, Math.max(0, limit - 1), { rev: true })) ?? [];
    const items = await Promise.all(ids.map((id) => this.read<T>(key(id))));
    const present: T[] = [];
    for (const item of items) if (item !== null) present.push(item);
    return present;
  }

  /**
   * Capabilities a platform refused at runtime (a 401/403 on a read means the scope
   * or API tier isn't there). Persisted separately from the account record because
   * `syncConfiguredAccounts` rebuilds `capabilities` from config on every run and
   * would otherwise wipe the flag on the very next poll.
   */
  async disabledCapabilities(accountId: string): Promise<string[]> {
    return (await this.read<string[]>(K.disabledCaps(accountId))) ?? [];
  }

  async disableCapability(accountId: string, capability: keyof SocialCapabilities) {
    const current = new Set(await this.disabledCapabilities(accountId));
    if (current.has(capability)) return false;
    current.add(capability);
    await this.write(K.disabledCaps(accountId), [...current]);
    return true;
  }

  /** Called when an account is reconnected or re-checked, so a fixed scope recovers. */
  async clearDisabledCapabilities(accountId: string) {
    await this.redis.del(K.disabledCaps(accountId));
  }

  /**
   * The publishing identity as reported by the platform itself, which always beats the
   * configured environment value. Persisted separately because `syncConfiguredAccounts`
   * rebuilds the account from config on every run.
   */
  async setResolvedRemoteId(accountId: string, remoteId: string) {
    await this.write(K.remoteId(accountId), remoteId);
  }

  async resolvedRemoteId(accountId: string) {
    return this.read<string>(K.remoteId(accountId));
  }

  async saveReadiness(readiness: AccountReadiness) {
    await this.write(K.readiness(readiness.accountId), readiness);
  }

  async readiness(accountId: string) {
    return this.read<AccountReadiness>(K.readiness(accountId));
  }

  async syncConfiguredAccounts() {
    const existing = new Map((await this.listAccounts()).map((item) => [item.id, item]));
    const accounts = await Promise.all(configuredSocialAccounts().map(async (configured) => {
      const prior = existing.get(configured.id);
      const hasStoredToken = Boolean(await this.redis.get(K.token(configured.id)));
      const baseStatus = hasStoredToken && configured.status === "blocked" ? ("ready" as const) : configured.status;
      const resolved = await this.resolvedRemoteId(configured.id);
      if (resolved) configured.remoteId = resolved;
      const disabled = await this.disabledCapabilities(configured.id);
      for (const capability of disabled) {
        if (capability in configured.capabilities) {
          configured.capabilities[capability as keyof SocialCapabilities] = false;
        }
      }
      return prior
        ? {
            ...configured,
            paused: prior.paused,
            status: prior.paused ? ("paused" as const) : baseStatus,
            statusReason: hasStoredToken ? undefined : configured.statusReason,
            tokenExpiresAt: prior.tokenExpiresAt,
            lastHealthCheckAt: prior.lastHealthCheckAt,
            lastError: prior.lastError,
          }
        : { ...configured, status: baseStatus, statusReason: hasStoredToken ? undefined : configured.statusReason };
    }));
    for (const account of accounts) await this.saveAccount(account);
    return accounts;
  }

  async saveAccount(account: SocialAccount) {
    await this.write(K.account(account.id), account);
    await this.redis.zadd(K.accounts, { score: Date.now(), member: account.id });
  }

  async listAccounts() {
    return this.listFromIndex<SocialAccount>(K.accounts, K.account, 20);
  }

  async getAccount(id: string) {
    return this.read<SocialAccount>(K.account(id));
  }

  async settings(): Promise<SocialSettings> {
    return (await this.read<SocialSettings>(K.settings)) ?? { ...DEFAULT_SOCIAL_SETTINGS };
  }

  async updateSettings(patch: Partial<Omit<SocialSettings, "updatedAt">>) {
    const next: SocialSettings = { ...(await this.settings()), ...patch, updatedAt: new Date().toISOString() };
    await this.write(K.settings, next);
    return next;
  }

  async saveCampaign(campaign: Campaign) {
    await this.write(K.campaign(campaign.id), campaign);
    await this.redis.zadd(K.campaigns, { score: Date.parse(campaign.createdAt), member: campaign.id });
  }

  async getCampaign(id: string) {
    return this.read<Campaign>(K.campaign(id));
  }

  async listCampaigns(limit = 30) {
    return this.listFromIndex<Campaign>(K.campaigns, K.campaign, limit);
  }

  async savePost(post: ChannelPost) {
    await this.write(K.post(post.id), post);
    await this.redis.zadd(K.posts, { score: Date.parse(post.createdAt), member: post.id });
  }

  async getPost(id: string) {
    return this.read<ChannelPost>(K.post(id));
  }

  async listPosts(limit = 100) {
    return this.listFromIndex<ChannelPost>(K.posts, K.post, limit);
  }

  async enqueueAction(input: Omit<SocialAction, "id" | "status" | "attempts" | "createdAt" | "updatedAt">) {
    const existing = await this.redis.get<string>(K.actionIdempotency(input.idempotencyKey));
    if (existing) return this.getAction(existing);
    const now = new Date().toISOString();
    const action: SocialAction = {
      ...input,
      id: randomUUID(),
      status: "queued",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    const claimed = await this.redis.set(K.actionIdempotency(input.idempotencyKey), action.id, { nx: true });
    if (!claimed) {
      const id = await this.redis.get<string>(K.actionIdempotency(input.idempotencyKey));
      return id ? this.getAction(id) : null;
    }
    await this.write(K.action(action.id), action);
    await this.redis.zadd(K.actions, { score: Date.parse(now), member: action.id });
    await this.redis.zadd(K.actionDue, { score: Date.parse(action.dueAt), member: action.id });
    return action;
  }

  async getAction(id: string) {
    return this.read<SocialAction>(K.action(id));
  }

  async listActions(limit = 100) {
    return this.listFromIndex<SocialAction>(K.actions, K.action, limit);
  }

  async claimDueActions(limit = 10, leaseSeconds = 90) {
    const now = Date.now();
    const ids = (await this.redis.zrange<string[]>(K.actionDue, 0, now, {
      byScore: true,
      offset: 0,
      count: limit * 3,
    })) ?? [];
    const claimed: SocialAction[] = [];
    for (const id of ids) {
      if (claimed.length >= limit) break;
      const lock = await this.redis.set(K.lease(id), "1", { nx: true, ex: leaseSeconds });
      if (!lock) continue;
      const action = await this.getAction(id);
      if (!action || !["queued", "retryable"].includes(action.status)) continue;
      const next: SocialAction = {
        ...action,
        status: "leased",
        leaseUntil: new Date(now + leaseSeconds * 1000).toISOString(),
        updatedAt: new Date(now).toISOString(),
      };
      await this.write(K.action(id), next);
      claimed.push(next);
    }
    return claimed;
  }

  async finishAction(action: SocialAction, patch: Partial<SocialAction>) {
    const next: SocialAction = { ...action, ...patch, updatedAt: new Date().toISOString() };
    await this.write(K.action(action.id), next);
    if (next.status === "completed" || next.status === "quarantined") {
      await this.redis.zrem(K.actionDue, action.id);
    } else {
      await this.redis.zadd(K.actionDue, { score: Date.parse(next.dueAt), member: action.id });
    }
    await this.redis.del(K.lease(action.id));
    return next;
  }

  async saveEngagement(event: EngagementEvent) {
    const claimed = await this.redis.set(K.eventSeen(event.platformEventId), event.id, { nx: true, ex: 90 * 24 * 60 * 60 });
    if (!claimed) return false;
    await this.write(K.engagement(event.id), event);
    await this.redis.zadd(K.engagements, { score: Date.parse(event.receivedAt), member: event.id });
    return true;
  }

  async listEngagements(limit = 100) {
    return this.listFromIndex<EngagementEvent>(K.engagements, K.engagement, limit);
  }

  async saveMetric(metric: MetricSnapshot) {
    await this.write(K.metric(metric.id), metric);
    await this.redis.zadd(K.metrics, { score: Date.parse(metric.capturedAt), member: metric.id });
  }

  async listMetrics(limit = 100) {
    return this.listFromIndex<MetricSnapshot>(K.metrics, K.metric, limit);
  }

  async recordConversion(conversion: SocialConversion) {
    await this.write(K.conversion(conversion.id), conversion);
    await this.redis.zadd(K.conversions, { score: Date.parse(conversion.occurredAt), member: conversion.id });
  }

  async listConversions(limit = 200) {
    return this.listFromIndex<SocialConversion>(K.conversions, K.conversion, limit);
  }

  async saveMedia(asset: MediaAsset) {
    await this.write(K.mediaItem(asset.id), asset);
    await this.redis.zadd(K.media, { score: Date.parse(asset.createdAt), member: asset.id });
  }

  async getMedia(id: string) {
    return this.read<MediaAsset>(K.mediaItem(id));
  }

  async audit(action: string, target?: string, detail?: Record<string, unknown>, actor: AuditLogEntry["actor"] = "system") {
    const entry: AuditLogEntry = { id: randomUUID(), at: new Date().toISOString(), actor, action, target, detail };
    await this.redis.lpush(K.audit, JSON.stringify(entry));
    await this.redis.ltrim(K.audit, 0, 499);
    return entry;
  }

  async auditLog(limit = 100) {
    const entries = (await this.redis.lrange<string[]>(K.audit, 0, limit - 1)) ?? [];
    return entries.map((entry) => parse<AuditLogEntry>(entry)).filter((entry): entry is AuditLogEntry => Boolean(entry));
  }

  async reserveSpend(usd: number) {
    const month = new Date().toISOString().slice(0, 7);
    const cents = Math.max(0, Math.round(usd * 100));
    const total = await this.redis.incrby(K.spend(month), cents);
    await this.redis.expire(K.spend(month), 400 * 24 * 60 * 60);
    const settings = await this.settings();
    const cap = Math.round(settings.monthlyBudgetUsd * 100);
    if (total > cap) {
      if (cents) await this.redis.incrby(K.spend(month), -cents);
      return { allowed: false, totalUsd: (total - cents) / 100, capUsd: settings.monthlyBudgetUsd };
    }
    return { allowed: true, totalUsd: total / 100, capUsd: settings.monthlyBudgetUsd };
  }

  async spendThisMonth() {
    return Number((await this.redis.get<number>(K.spend(new Date().toISOString().slice(0, 7)))) ?? 0) / 100;
  }

  /**
   * The cap bucket an action counts against: publish caps are weekly (the
   * `SOCIAL_CADENCE` postsPerWeek figure), everything else is daily.
   */
  capPeriod(kind: SocialActionKind, now = new Date()) {
    if (kind !== "publish") return now.toISOString().slice(0, 10);
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);
    return `w${monday.toISOString().slice(0, 10)}`;
  }

  /**
   * Atomic per-account, per-kind cadence cap. Same reserve-then-rollback shape as
   * `reserveSpend` here and `reserveSend` in lib/outreach-store.ts: the counter is
   * incremented FIRST so concurrent workers can never both see room, and the
   * increment is handed back by `releaseActionSlot` on any path that does not
   * complete an external write.
   */
  async reserveActionSlot(accountId: string, kind: SocialActionKind, cap: number) {
    const period = this.capPeriod(kind);
    const key = K.cap(accountId, kind, period);
    const used = await this.redis.incrby(key, 1);
    await this.redis.expire(key, 40 * 24 * 60 * 60);
    if (used > cap) {
      await this.redis.incrby(key, -1);
      return { allowed: false as const, used: used - 1, cap, period };
    }
    return { allowed: true as const, used, cap, period };
  }

  async releaseActionSlot(accountId: string, kind: SocialActionKind, period: string) {
    const key = K.cap(accountId, kind, period);
    const next = await this.redis.incrby(key, -1);
    if (next < 0) await this.redis.set(key, 0);
  }

  async actionSlotUsage(accountId: string, kind: SocialActionKind) {
    return Number((await this.redis.get<number>(K.cap(accountId, kind, this.capPeriod(kind)))) ?? 0);
  }

  /**
   * Claims the 30-day per-recipient DM cooldown. Atomic `nx` set, so the check and
   * the claim cannot race. Deliberately never released: a DM that fails after the
   * claim burns the cooldown, which errs toward never messaging someone twice.
   */
  async claimDmRecipient(accountId: string, actorIdHash: string) {
    const claimed = await this.redis.set(K.dmRecipient(accountId, actorIdHash), "1", {
      nx: true,
      ex: DM_COOLDOWN_SECONDS,
    });
    return Boolean(claimed);
  }

  async putOAuthState(state: string, value: Record<string, unknown>) {
    await this.redis.set(K.oauth(state), JSON.stringify(value), { ex: 10 * 60 });
  }

  async consumeOAuthState(state: string) {
    const value = await this.read<Record<string, unknown>>(K.oauth(state));
    if (value) await this.redis.del(K.oauth(state));
    return value;
  }

  async saveEncryptedToken(accountId: string, value: string) {
    await this.redis.set(K.token(accountId), value);
  }

  async encryptedToken(accountId: string) {
    return this.redis.get<string>(K.token(accountId));
  }

  async dashboard(): Promise<SocialDashboardSnapshot> {
    const [settings, accounts, campaigns, posts, actions, engagements, metrics, conversions, auditLog, monthSpendUsd] =
      await Promise.all([
        this.settings(),
        this.syncConfiguredAccounts(),
        this.listCampaigns(),
        this.listPosts(),
        this.listActions(),
        this.listEngagements(),
        this.listMetrics(),
        this.listConversions(),
        this.auditLog(),
        this.spendThisMonth(),
      ]);
    const readinessEntries = await Promise.all(
      accounts.map(async (account) => [account.id, await this.readiness(account.id)] as const),
    );
    const readiness = Object.fromEntries(
      readinessEntries.filter((entry): entry is [string, AccountReadiness] => Boolean(entry[1])),
    );
    return {
      configured: true,
      settings,
      accounts,
      campaigns,
      posts,
      actions,
      engagements,
      metrics,
      conversions,
      auditLog,
      monthSpendUsd,
      readiness,
    };
  }
}

let singleton: SocialStore | undefined;
export function socialStore() {
  singleton ??= new SocialStore();
  return singleton;
}
