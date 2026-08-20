import { randomUUID } from "node:crypto";
import { site } from "@/lib/site";
import { SOCIAL_CADENCE } from "./config";
import { socialAdapter } from "./adapters";
import { SocialApiError } from "./adapters/base";
import { adaptCampaign, draftEngagementResponse, researchCampaign, reviewExternalWrites, SocialBudgetError } from "./openai";
import {
  deterministicPolicy,
  engagementRisk,
  hashActor,
  isWeekend,
  privateReplyCapable,
  trackedAuditUrl,
  validatePlatformPost,
  warmDmEligible,
  budgetMode,
} from "./policy";
import { socialStore } from "./store";
import { scheduleCampaignVideo } from "./media";
import type { Campaign, ChannelPost, EngagementEvent, SocialAccount, SocialCapabilities } from "./types";

/**
 * A 401/403 on a READ means the account lacks that scope or API tier — X mention
 * reads, for example, are not on the free tier. Disabling the single capability keeps
 * publishing alive and stops a once-every-15-minutes retry from flooding the
 * 500-entry audit log. Pausing the whole account would take posting down with it.
 */
async function degradeOnForbidden(
  account: SocialAccount,
  capability: keyof SocialCapabilities,
  error: unknown,
  fallbackAuditAction: string,
) {
  const store = socialStore();
  const message = error instanceof Error ? error.message : "Unknown error";
  if (error instanceof SocialApiError && [401, 403].includes(error.status)) {
    const changed = await store.disableCapability(account.id, capability);
    await store.saveAccount({ ...account, lastError: message });
    if (changed) {
      await store.audit("capability.degraded", account.id, { capability, status: error.status, message });
    }
    return;
  }
  await store.audit(fallbackAuditAction, account.id, { message });
}

function categoryForToday(date = new Date()): Campaign["category"] {
  const weighted: Campaign["category"][] = [
    "evergreen",
    "trend",
    "evergreen",
    "audit-insight",
    "trend",
    "evergreen",
    "promotion",
    "trend",
    "audit-insight",
    "evergreen",
  ];
  const day = Math.floor(date.getTime() / 86_400_000);
  return weighted[day % weighted.length];
}

function todayAtEastern(hour: number, minute = 0) {
  const now = new Date();
  const easternDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")
    ?.value.replace("GMT", "");
  return new Date(`${easternDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset || "-04:00"}`).toISOString();
}

function accountRunsToday(accountId: string, weekday: string) {
  const days: Record<string, string[]> = {
    "linkedin-founder": ["Mon", "Tue", "Thu", "Fri"],
    "linkedin-brand": ["Mon", "Wed", "Fri"],
    "x-founder": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "x-brand": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "instagram-brand": ["Mon", "Tue", "Thu", "Fri"],
    "facebook-brand": ["Mon", "Tue", "Thu", "Fri"],
    "reddit-founder": ["Tue", "Thu"],
  };
  return days[accountId]?.includes(weekday) ?? false;
}

export async function runResearch() {
  const store = socialStore();
  if (isWeekend()) return { skipped: "weekend" };
  const settings = await store.settings();
  if (settings.globalPaused) return { skipped: "global-pause" };
  const currentBudgetMode = budgetMode(await store.spendThisMonth(), settings.monthlyBudgetUsd);
  if (currentBudgetMode === "stopped") return { skipped: "budget-cap" };

  const metrics = await store.listMetrics(50);
  const performanceContext = metrics.length
    ? `Recent aggregate: ${metrics.reduce((sum, item) => sum + item.impressions, 0)} impressions, ${metrics.reduce((sum, item) => sum + item.clicks, 0)} clicks, ${metrics.reduce((sum, item) => sum + item.freeAuditLeads, 0)} free-audit leads.`
    : "No previous social metrics.";
  // Every model call reserves its own spend inside lib/social/openai.ts, so a
  // budget refusal surfaces here as SocialBudgetError rather than an overspend.
  let draft: Awaited<ReturnType<typeof researchCampaign>>;
  try {
    draft = await researchCampaign(currentBudgetMode === "reduced" ? "evergreen" : categoryForToday(), performanceContext);
  } catch (error) {
    if (error instanceof SocialBudgetError) return { skipped: "budget-cap", reason: error.message };
    throw error;
  }
  const now = new Date().toISOString();
  const campaignId = randomUUID();
  const campaign: Campaign = {
    id: campaignId,
    slug: `${draft.slug}-${now.slice(0, 10)}`,
    topic: draft.topic,
    objective: "free-audit-leads",
    category: draft.category,
    angle: draft.angle,
    callToAction: draft.callToAction,
    sources: draft.sources,
    status: "drafted",
    scheduledAt: todayAtEastern(10),
    createdAt: now,
    updatedAt: now,
  };
  await store.saveCampaign(campaign);
  const campaignCardId = randomUUID();
  const campaignCardUrl = `${site.url}/api/social/media/card/${campaignCardId}`;
  await store.saveMedia({
    id: campaignCardId,
    campaignId,
    kind: "card",
    status: "ready",
    url: campaignCardUrl,
    mimeType: "image/png",
    width: 1200,
    height: 1200,
    altText: campaign.topic,
    createdAt: now,
    updatedAt: now,
  });
  let campaignVideoId: string | null = null;
  try {
    campaignVideoId = await scheduleCampaignVideo(campaignId, campaign.topic, campaign.angle, campaignCardUrl);
  } catch (error) {
    await store.audit("media.video.failed", campaignId, { message: error instanceof Error ? error.message : "Video planning failed." });
  }

  const accounts = (await store.syncConfiguredAccounts()).filter((account) => account.status === "ready" && !account.paused);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(new Date());
  const scheduledAccounts = accounts.filter((account) => accountRunsToday(account.id, weekday));
  const postIds = Object.fromEntries(scheduledAccounts.map((account) => [account.id, randomUUID()]));
  const trackedUrls = Object.fromEntries(
    scheduledAccounts.map((account) => [
      account.id,
      trackedAuditUrl(account.platform, campaign.slug, postIds[account.id], site.url),
    ]),
  );
  let adapted: Awaited<ReturnType<typeof adaptCampaign>>;
  let decisions: Awaited<ReturnType<typeof reviewExternalWrites>>;
  try {
    adapted = await adaptCampaign(campaign, scheduledAccounts, trackedUrls, settings.redditAllowlist);
    decisions = await reviewExternalWrites(
      adapted.posts.map((post) => ({ accountId: post.accountId, text: post.text })),
      campaign.sources,
    );
  } catch (error) {
    if (error instanceof SocialBudgetError) {
      // The campaign exists but no variant cleared the review gate, so nothing may
      // publish. Quarantine it rather than leaving it looking scheduled.
      await store.saveCampaign({ ...campaign, status: "quarantined", updatedAt: new Date().toISOString() });
      await store.audit("campaign.budget-exhausted", campaignId, { message: error.message });
      return { campaignId, passed: 0, quarantined: 0, skipped: "budget-cap" };
    }
    throw error;
  }

  let passed = 0;
  let quarantined = 0;
  for (const [index, account] of scheduledAccounts.entries()) {
    const variant = adapted.posts.find((post) => post.accountId === account.id);
    if (!variant) continue;
    const platformReasons = validatePlatformPost(account.platform, variant.text, {
      mediaCount: ["instagram", "facebook", "linkedin"].includes(account.platform) ? 1 : 0,
      subreddit: variant.subreddit,
      redditAllowlist: settings.redditAllowlist,
    });
    const decision = decisions[account.id] ?? deterministicPolicy(variant.text, { hasSources: campaign.sources.length > 0 });
    if (platformReasons.length) {
      decision.decision = "escalate";
      decision.reasons.push(...platformReasons);
    }
    const postId = postIds[account.id];
    const mediaIds: string[] = [];
    if (["instagram", "facebook"].includes(account.platform) && campaignVideoId) {
      mediaIds.push(campaignVideoId);
    }
    if (["instagram", "facebook", "linkedin"].includes(account.platform)) {
      mediaIds.push(campaignCardId);
    }
    const scheduledAt = todayAtEastern(10 + (index % 7), (index * 7) % 60);
    const post: ChannelPost = {
      id: postId,
      campaignId,
      accountId: account.id,
      platform: account.platform,
      identity: account.identity,
      text: variant.text,
      title: variant.title || undefined,
      subreddit: variant.subreddit || undefined,
      mediaIds,
      trackedUrl: trackedUrls[account.id],
      scheduledAt,
      status: decision.decision === "pass" ? "scheduled" : "quarantined",
      policyDecision: decision,
      createdAt: now,
      updatedAt: now,
    };
    await store.savePost(post);
    if (post.status === "scheduled") {
      passed += 1;
      await store.enqueueAction({
        kind: "publish",
        accountId: account.id,
        postId,
        idempotencyKey: `publish:${postId}`,
        dueAt: scheduledAt,
      });
    } else {
      quarantined += 1;
      await store.audit("post.quarantined", postId, { reasons: decision.reasons });
    }
  }

  const updated: Campaign = {
    ...campaign,
    status: passed ? "scheduled" : "quarantined",
    updatedAt: new Date().toISOString(),
  };
  await store.saveCampaign(updated);
  await store.audit("campaign.created", campaign.id, { passed, quarantined, category: campaign.category });
  return { campaignId, passed, quarantined, spendUsd: await store.spendThisMonth() };
}

function retryDelay(attempts: number) {
  return Math.min(6 * 60 * 60 * 1000, 2 ** Math.max(0, attempts) * 60_000);
}

export async function runPublish(limit = 12) {
  const store = socialStore();
  const settings = await store.settings();
  if (settings.globalPaused) return { skipped: "global-pause" };
  if (budgetMode(await store.spendThisMonth(), settings.monthlyBudgetUsd) === "stopped") return { skipped: "budget-cap" };
  const actions = await store.claimDueActions(limit);
  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const action of actions) {
    const account = await store.getAccount(action.accountId);
    if (!account || account.paused || account.status !== "ready") {
      await store.finishAction(action, { status: "quarantined", lastError: "Account is unavailable or paused." });
      results.push({ id: action.id, status: "quarantined" });
      continue;
    }
    const cadence = SOCIAL_CADENCE[account.id];
    const cap =
      action.kind === "dm"
        ? cadence?.dmsPerDay
        : action.kind === "reply"
          ? cadence?.repliesPerDay
          : action.kind === "publish"
            ? cadence?.postsPerWeek
            : undefined;

    // Atomic reservation, not a count over a fetched list: two workers (or two
    // actions for one account inside a single batch) must never both see room.
    // Released below on every path that does not complete an external write.
    let reservedPeriod: string | null = null;
    if (cap !== undefined) {
      const slot = await store.reserveActionSlot(account.id, action.kind, cap);
      if (!slot.allowed) {
        await store.finishAction(action, {
          status: "retryable",
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastError: `Account ${action.kind} cap of ${cap} reached for ${slot.period}.`,
        });
        results.push({ id: action.id, status: "deferred" });
        continue;
      }
      reservedPeriod = slot.period;
    }

    try {
      const adapter = socialAdapter(account.platform);
      let result: { remoteId: string; permalink?: string };
      if (action.kind === "publish") {
        const post = action.postId ? await store.getPost(action.postId) : null;
        if (!post || post.status !== "scheduled" || post.policyDecision?.decision !== "pass") {
          throw new SocialApiError("Post is not approved and scheduled.", 409, false);
        }
        const media = await Promise.all(post.mediaIds.map((id) => store.getMedia(id)));
        result = await adapter.publish({
          account,
          text: post.text,
          title: post.title,
          subreddit: post.subreddit,
          mediaUrls: media.map((item) => item?.url).filter((url): url is string => Boolean(url)),
          idempotencyKey: action.idempotencyKey,
        });
        await store.savePost({
          ...post,
          status: "published",
          platformPostId: result.remoteId,
          permalink: result.permalink,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (action.kind === "reply" && action.targetRemoteId && action.text) {
        result = await adapter.reply(account, action.targetRemoteId, action.text);
      } else if (action.kind === "dm" && action.targetRemoteId && action.text) {
        result = await adapter.dm(account, action.targetRemoteId, action.text);
      } else if (action.kind === "delete" && action.targetRemoteId) {
        await adapter.delete(account, action.targetRemoteId);
        result = { remoteId: action.targetRemoteId };
        if (action.postId) {
          const post = await store.getPost(action.postId);
          if (post) await store.savePost({ ...post, status: "deleted", updatedAt: new Date().toISOString() });
        }
      } else {
        throw new SocialApiError("Action payload is incomplete.", 400, false);
      }
      await store.finishAction(action, { status: "completed", remoteId: result.remoteId, permalink: result.permalink });
      await store.audit(`action.${action.kind}.completed`, action.id, { remoteId: result.remoteId });
      results.push({ id: action.id, status: "completed" });
    } catch (error) {
      // Nothing went out, so hand the cadence slot back. Without this the cap leaks
      // exactly the way the outreach send cap did before commit 35af4e2.
      if (reservedPeriod) await store.releaseActionSlot(account.id, action.kind, reservedPeriod);
      const retryable = error instanceof SocialApiError ? error.retryable : true;
      const attempts = action.attempts + 1;
      const terminal = !retryable || attempts >= 4;
      const message = error instanceof Error ? error.message : "Unknown platform failure.";
      await store.finishAction(action, {
        status: terminal ? "quarantined" : "retryable",
        attempts,
        dueAt: new Date(Date.now() + retryDelay(attempts)).toISOString(),
        lastError: message,
      });
      await store.audit("action.failed", action.id, { attempts, retryable, message });
      if (error instanceof SocialApiError && [400, 403].includes(error.status)) {
        if (action.kind === "publish") {
          // A publish permission failure is account-level and warrants attention.
          await store.saveAccount({ ...account, paused: true, status: "paused", lastError: message });
        } else if (action.kind === "reply" || action.kind === "dm") {
          // A refused reply/DM is a scope or window problem with that one capability.
          // Keep publishing alive.
          await degradeOnForbidden(account, action.kind, error, "action.failed");
        }
      }
      results.push({ id: action.id, status: terminal ? "quarantined" : "retryable", error: message });
    }
  }
  return { claimed: actions.length, results };
}

export async function runEngage() {
  const store = socialStore();
  const settings = await store.settings();
  // This job runs every 15 minutes across every account and drafts with a model, so
  // it is the highest-frequency spend path in the system. It must check the cap
  // before doing any work — it previously did not, leaving the cap enforcing almost
  // nothing.
  const mode = budgetMode(await store.spendThisMonth(), settings.monthlyBudgetUsd);
  if (mode === "stopped") return { ingested: 0, queued: 0, skipped: "budget-cap" };
  const accounts = await store.syncConfiguredAccounts();
  const since = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  let ingested = 0;
  let queued = 0;

  for (const account of accounts.filter((item) => item.status === "ready" && !item.paused && item.capabilities.readEngagements)) {
    try {
      const remoteEvents = await socialAdapter(account.platform).engagements(account, since);
      for (const remote of remoteEvents) {
        const risk = engagementRisk(remote.content);
        const event: EngagementEvent = {
          id: randomUUID(),
          platformEventId: `${account.platform}:${remote.platformEventId}`,
          accountId: account.id,
          platform: account.platform,
          actorIdHash: hashActor(account.platform, remote.actorRemoteId),
          actorRemoteId: remote.actorRemoteId,
          kind: remote.kind,
          content: remote.content,
          threadId: remote.threadId,
          receivedAt: remote.receivedAt,
          risk,
        };
        if (!(await store.saveEngagement(event))) continue;
        ingested += 1;
        if (risk === "high") {
          await store.saveAccount({ ...account, paused: true, status: "paused", lastError: "Sensitive interaction received." });
          await store.audit("account.paused.sensitive-event", account.id, { eventId: event.id });
          continue;
        }
        if (settings.globalPaused || risk !== "low") continue;

        // A public reply is the default response. A Meta comment may ALSO earn one
        // private reply — the only platform-compliant warm-DM path available (see
        // privateReplyCapable). Optional DM work stops first when the budget tightens.
        const modes: Array<"reply" | "dm"> = [];
        if (account.capabilities.reply) modes.push("reply");
        if (
          mode === "normal" &&
          privateReplyCapable(account, event) &&
          warmDmEligible({ event, account, sentToday: await store.actionSlotUsage(account.id, "dm") }) &&
          (await store.claimDmRecipient(account.id, event.actorIdHash))
        ) {
          modes.push("dm");
        }

        for (const responseMode of modes) {
          let drafted: Awaited<ReturnType<typeof draftEngagementResponse>>;
          try {
            drafted = await draftEngagementResponse(account, event.content, responseMode);
          } catch (error) {
            if (error instanceof SocialBudgetError) {
              await store.audit("engagement.budget-exhausted", event.id, { message: error.message });
              return { ingested, queued, skipped: "budget-cap" };
            }
            throw error;
          }
          if (drafted.decision?.decision !== "pass") {
            await store.audit("engagement.response.quarantined", event.id, {
              mode: responseMode,
              reasons: drafted.decision?.reasons,
            });
            continue;
          }
          await store.enqueueAction({
            kind: responseMode,
            accountId: account.id,
            eventId: event.id,
            // A private reply addresses the COMMENT; a public reply addresses the thread.
            targetRemoteId:
              responseMode === "dm" ? remote.platformEventId : (event.threadId ?? remote.platformEventId),
            text: drafted.text,
            idempotencyKey: `${responseMode}:${event.platformEventId}`,
            dueAt: new Date().toISOString(),
          });
          queued += 1;
        }
      }
    } catch (error) {
      await degradeOnForbidden(account, "readEngagements", error, "engagement.poll.failed");
    }
  }
  return { ingested, queued };
}

export async function runMetrics() {
  const store = socialStore();
  const posts = (await store.listPosts(200)).filter((post) => post.status === "published" && post.platformPostId);
  let captured = 0;
  for (const post of posts) {
    const account = await store.getAccount(post.accountId);
    if (!account || !account.capabilities.metrics || account.paused) continue;
    try {
      const values = await socialAdapter(account.platform).metrics(account, post.platformPostId!);
      await store.saveMetric({
        ...values,
        id: randomUUID(),
        accountId: account.id,
        postId: post.id,
        capturedAt: new Date().toISOString(),
      });
      captured += 1;
    } catch (error) {
      await degradeOnForbidden(account, "metrics", error, "metrics.capture.failed");
    }
  }
  return { captured };
}
