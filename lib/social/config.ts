import type { SocialAccount, SocialCapabilities, SocialIdentity, SocialPlatform } from "./types";

const NONE: SocialCapabilities = {
  publish: false,
  readEngagements: false,
  reply: false,
  dm: false,
  delete: false,
  metrics: false,
  media: false,
};

function enabled(...names: string[]) {
  return names.every((name) => Boolean(process.env[name]));
}

export function parseRedditAllowlist(raw = process.env.REDDIT_ALLOWLIST ?? "") {
  return raw
    .split(",")
    .map((value) => value.trim().replace(/^r\//, "").toLowerCase())
    .filter(Boolean);
}

function account(
  id: string,
  platform: SocialPlatform,
  identity: SocialIdentity,
  label: string,
  remoteId: string | undefined,
  credentialsReady: boolean,
  capabilities: Partial<SocialCapabilities>,
  statusReason: string,
): SocialAccount {
  return {
    id,
    platform,
    identity,
    label,
    remoteId,
    paused: false,
    status: credentialsReady ? "ready" : "blocked",
    statusReason: credentialsReady ? undefined : statusReason,
    capabilities: { ...NONE, ...capabilities },
  };
}

export function configuredSocialAccounts(): SocialAccount[] {
  const linkedinReady = enabled("LINKEDIN_ACCESS_TOKEN");
  const xFounderReady = enabled("X_FOUNDER_ACCESS_TOKEN");
  const xBrandReady = enabled("X_BRAND_ACCESS_TOKEN");
  const metaReady = enabled("META_PAGE_ACCESS_TOKEN");
  // An empty allowlist must block Reddit at config time. Otherwise the account reads
  // as ready and every post fails `validatePlatformPost` at publish time instead —
  // a silent, per-post failure where a loud, one-time one belongs.
  const redditReady = enabled("REDDIT_ACCESS_TOKEN") && parseRedditAllowlist().length > 0;

  return [
    account(
      "linkedin-founder",
      "linkedin",
      "founder",
      "LinkedIn · founder",
      process.env.LINKEDIN_FOUNDER_URN,
      linkedinReady && enabled("LINKEDIN_FOUNDER_URN"),
      { publish: true, readEngagements: true, reply: true, delete: true, metrics: true, media: true },
      "Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_FOUNDER_URN.",
    ),
    account(
      "linkedin-brand",
      "linkedin",
      "brand",
      "LinkedIn · queryclear",
      process.env.LINKEDIN_ORGANIZATION_URN,
      // Deliberately never credential-ready on env vars alone. Organization posting
      // needs w_organization_social, which LinkedIn grants only through Community
      // Management API approval — so a filled-in token still cannot publish, and
      // treating it as ready would schedule posts that 403 and pause the account.
      // `syncConfiguredAccounts` promotes this to ready once a token has actually
      // been stored by a successful connect, which can only happen after approval.
      false,
      { publish: true, readEngagements: true, reply: true, delete: true, metrics: true, media: true },
      linkedinReady && enabled("LINKEDIN_ORGANIZATION_URN")
        ? "Needs w_organization_social, which comes only from LinkedIn's Community Management API. That product must be the ONLY product on its app, so it cannot share the founder account's app: create a second LinkedIn application with Community Management API as its sole product, get it approved, then set LINKEDIN_BRAND_CLIENT_ID and LINKEDIN_BRAND_CLIENT_SECRET and connect. Register the same redirect URI on it."
        : "Set LINKEDIN_ORGANIZATION_URN, plus LINKEDIN_BRAND_CLIENT_ID and LINKEDIN_BRAND_CLIENT_SECRET for a dedicated Community Management API application.",
    ),
    account(
      "x-founder",
      "x",
      "founder",
      "X · founder",
      process.env.X_FOUNDER_USER_ID,
      xFounderReady && enabled("X_FOUNDER_USER_ID"),
      // dm:false — a warm DM must be triggered by a real engagement, and X follow
      // events require the enterprise-only Account Activity API.
      { publish: true, readEngagements: true, reply: true, delete: true, metrics: true, media: true },
      "Set X_FOUNDER_ACCESS_TOKEN and X_FOUNDER_USER_ID.",
    ),
    account(
      "x-brand",
      "x",
      "brand",
      "X · queryclear",
      process.env.X_BRAND_USER_ID,
      xBrandReady && enabled("X_BRAND_USER_ID"),
      { publish: true, readEngagements: true, reply: true, delete: true, metrics: true, media: true },
      "Set X_BRAND_ACCESS_TOKEN and X_BRAND_USER_ID.",
    ),
    account(
      "instagram-brand",
      "instagram",
      "brand",
      "Instagram · queryclear",
      process.env.INSTAGRAM_ACCOUNT_ID,
      metaReady && enabled("INSTAGRAM_ACCOUNT_ID"),
      { publish: true, readEngagements: true, reply: true, dm: true, delete: true, metrics: true, media: true },
      "Set META_PAGE_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID for a Professional account.",
    ),
    account(
      "facebook-brand",
      "facebook",
      "brand",
      "Facebook Page · queryclear",
      process.env.META_PAGE_ID,
      metaReady && enabled("META_PAGE_ID"),
      { publish: true, readEngagements: true, reply: true, dm: true, delete: true, metrics: true, media: true },
      "Set META_PAGE_ACCESS_TOKEN and META_PAGE_ID.",
    ),
    account(
      "reddit-founder",
      "reddit",
      "founder",
      "Reddit · founder",
      process.env.REDDIT_USERNAME,
      redditReady && enabled("REDDIT_USERNAME"),
      // dm:false — automated Reddit PMs (/api/compose) are the single highest
      // ban-risk action available to this system. Posts and comments only.
      { publish: true, readEngagements: true, reply: true, delete: true, metrics: true },
      "Set REDDIT_ACCESS_TOKEN, REDDIT_USERNAME, and a non-empty REDDIT_ALLOWLIST.",
    ),
  ];
}

export const SOCIAL_CADENCE: Record<string, { postsPerWeek: number; repliesPerDay: number; dmsPerDay: number }> = {
  "linkedin-founder": { postsPerWeek: 4, repliesPerDay: 5, dmsPerDay: 2 },
  "linkedin-brand": { postsPerWeek: 3, repliesPerDay: 5, dmsPerDay: 2 },
  "x-founder": { postsPerWeek: 5, repliesPerDay: 5, dmsPerDay: 2 },
  "x-brand": { postsPerWeek: 5, repliesPerDay: 5, dmsPerDay: 2 },
  "instagram-brand": { postsPerWeek: 4, repliesPerDay: 5, dmsPerDay: 2 },
  "facebook-brand": { postsPerWeek: 4, repliesPerDay: 5, dmsPerDay: 2 },
  "reddit-founder": { postsPerWeek: 2, repliesPerDay: 3, dmsPerDay: 2 },
};

export const DEFAULT_SOCIAL_SETTINGS = {
  globalPaused: true,
  monthlyBudgetUsd: 90,
  redditAllowlist: parseRedditAllowlist(),
  updatedAt: new Date(0).toISOString(),
} as const;
