export const SOCIAL_PLATFORMS = ["linkedin", "x", "instagram", "facebook", "reddit"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialIdentity = "founder" | "brand";
export type SocialActionKind = "publish" | "reply" | "dm" | "delete";
export type SocialActionStatus = "queued" | "leased" | "completed" | "retryable" | "quarantined";
export type CampaignStatus =
  | "researching"
  | "drafted"
  | "passed"
  | "quarantined"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type SocialCapabilities = {
  publish: boolean;
  readEngagements: boolean;
  reply: boolean;
  dm: boolean;
  delete: boolean;
  metrics: boolean;
  media: boolean;
};

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  identity: SocialIdentity;
  label: string;
  remoteId?: string;
  status: "ready" | "limited" | "blocked" | "paused";
  statusReason?: string;
  paused: boolean;
  capabilities: SocialCapabilities;
  tokenExpiresAt?: string;
  lastHealthCheckAt?: string;
  lastError?: string;
};

export type CampaignSource = {
  url: string;
  title: string;
  publisher?: string;
  fetchedAt: string;
  claim: string;
};

export type Campaign = {
  id: string;
  slug: string;
  topic: string;
  objective: "free-audit-leads";
  category: "evergreen" | "trend" | "audit-insight" | "promotion";
  angle: string;
  callToAction: string;
  sources: CampaignSource[];
  status: CampaignStatus;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
  policyDecision?: PolicyDecision;
};

export type ChannelPost = {
  id: string;
  campaignId: string;
  accountId: string;
  platform: SocialPlatform;
  identity: SocialIdentity;
  text: string;
  title?: string;
  subreddit?: string;
  mediaIds: string[];
  trackedUrl: string;
  scheduledAt: string;
  status: "drafted" | "passed" | "quarantined" | "scheduled" | "published" | "failed" | "deleted";
  platformPostId?: string;
  permalink?: string;
  policyDecision?: PolicyDecision;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  campaignId: string;
  kind: "card" | "carousel" | "illustration" | "video" | "audio" | "captions";
  status: "planned" | "rendering" | "ready" | "failed";
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  altText?: string;
  aiDisclosure?: string;
  createdAt: string;
  updatedAt: string;
};

export type EngagementEvent = {
  id: string;
  platformEventId: string;
  accountId: string;
  platform: SocialPlatform;
  actorIdHash: string;
  actorRemoteId?: string;
  kind: "follow" | "mention" | "comment" | "reply" | "dm";
  content: string;
  threadId?: string;
  receivedAt: string;
  risk: "low" | "medium" | "high";
  respondedAt?: string;
};

export type SocialAction = {
  id: string;
  kind: SocialActionKind;
  accountId: string;
  postId?: string;
  eventId?: string;
  targetRemoteId?: string;
  text?: string;
  mediaUrls?: string[];
  idempotencyKey: string;
  status: SocialActionStatus;
  dueAt: string;
  attempts: number;
  leaseUntil?: string;
  remoteId?: string;
  permalink?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * One verifiable precondition for an account to publish. The point of the shape is
 * that a failure carries its own remediation: `action` is what the operator must do
 * and `value` is any exact string they need (a redirect URI, a resolved URN), so a
 * blocked account never has to be diagnosed by clicking Connect and reading the
 * platform's error page.
 */
export type PreflightCheck = {
  id: "credentials" | "callback" | "token" | "scope" | "author" | "capabilities" | "target";
  label: string;
  status: "pass" | "fail" | "warn" | "skip";
  detail?: string;
  action?: string;
  value?: string;
  docsUrl?: string;
};

export type AccountReadiness = {
  accountId: string;
  canPublish: boolean;
  blockedBy?: PreflightCheck["id"];
  checks: PreflightCheck[];
  checkedAt: string;
};

export type PolicyDecision = {
  decision: "pass" | "block" | "escalate";
  reasons: string[];
  checkedAt: string;
  moderationFlagged?: boolean;
  reviewerModel?: string;
};

export type MetricSnapshot = {
  id: string;
  accountId: string;
  postId?: string;
  capturedAt: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  freeAuditLeads: number;
  raw?: Record<string, unknown>;
};

export type SocialConversion = {
  id: string;
  postId?: string;
  platform?: SocialPlatform;
  campaign?: string;
  kind: "free-audit-lead";
  source: "report-unlock" | "capacity-gate";
  occurredAt: string;
};

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: "system" | "admin" | "platform";
  action: string;
  target?: string;
  detail?: Record<string, unknown>;
};

export type SocialSettings = {
  globalPaused: boolean;
  monthlyBudgetUsd: number;
  redditAllowlist: string[];
  updatedAt: string;
};

export type SocialDashboardSnapshot = {
  configured: boolean;
  settings: SocialSettings;
  accounts: SocialAccount[];
  campaigns: Campaign[];
  posts: ChannelPost[];
  actions: SocialAction[];
  engagements: EngagementEvent[];
  metrics: MetricSnapshot[];
  conversions: SocialConversion[];
  auditLog: AuditLogEntry[];
  monthSpendUsd: number;
  /** Last persisted preflight per account id, so the console explains blockers on load. */
  readiness: Record<string, AccountReadiness>;
};

export type PublishRequest = {
  account: SocialAccount;
  text: string;
  title?: string;
  subreddit?: string;
  mediaUrls: string[];
  idempotencyKey: string;
};

export type PublishResult = {
  remoteId: string;
  permalink?: string;
};

export type RemoteEngagement = {
  platformEventId: string;
  actorRemoteId: string;
  kind: EngagementEvent["kind"];
  content: string;
  threadId?: string;
  receivedAt: string;
};

export type SocialAdapter = {
  platform: SocialPlatform;
  health(account: SocialAccount): Promise<{ ok: boolean; reason?: string }>;
  /**
   * Platform-specific readiness checks. Implement when the platform can be
   * interrogated for scope/identity before a write is attempted; `preflightAccount`
   * falls back to `health` otherwise.
   */
  preflight?(account: SocialAccount): Promise<PreflightCheck[]>;
  /**
   * Resolves the canonical author id from the token itself, so it is never
   * hand-entered. Implement where the platform exposes it.
   */
  resolveAuthorUrn?(account: SocialAccount): Promise<string>;
  publish(request: PublishRequest): Promise<PublishResult>;
  delete(account: SocialAccount, remoteId: string): Promise<void>;
  reply(account: SocialAccount, targetRemoteId: string, text: string): Promise<PublishResult>;
  dm(account: SocialAccount, targetRemoteId: string, text: string): Promise<PublishResult>;
  engagements(account: SocialAccount, since: string): Promise<RemoteEngagement[]>;
  metrics(account: SocialAccount, remoteId: string): Promise<Omit<MetricSnapshot, "id" | "accountId" | "postId" | "capturedAt">>;
};
