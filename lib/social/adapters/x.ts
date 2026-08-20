import type { MetricSnapshot, PublishRequest, SocialAdapter } from "../types";
import { accessToken, bearer, socialFetch, unsupported } from "./base";

const API = "https://api.x.com/2";

export const xAdapter: SocialAdapter = {
  platform: "x",

  async health(account) {
    try {
      const token = await accessToken(account);
      await socialFetch(`${API}/users/me`, { headers: bearer(token) }, "X health check");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "X health check failed." };
    }
  },

  async publish(request: PublishRequest) {
    const token = await accessToken(request.account);
    if (request.mediaUrls.length) unsupported("Remote-URL media upload", request.account);
    const result = await socialFetch<{ data?: { id?: string } }>(
      `${API}/tweets`,
      { method: "POST", headers: bearer(token), body: JSON.stringify({ text: request.text }) },
      "X publish",
    );
    const remoteId = result.data?.id;
    if (!remoteId) throw new Error("X did not return a post ID.");
    return { remoteId, permalink: `https://x.com/i/web/status/${remoteId}` };
  },

  async delete(account, remoteId) {
    const token = await accessToken(account);
    await socialFetch(`${API}/tweets/${remoteId}`, { method: "DELETE", headers: bearer(token) }, "X delete");
  },

  async reply(account, targetRemoteId, text) {
    const token = await accessToken(account);
    const result = await socialFetch<{ data?: { id?: string } }>(
      `${API}/tweets`,
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify({ text, reply: { in_reply_to_tweet_id: targetRemoteId } }),
      },
      "X reply",
    );
    if (!result.data?.id) throw new Error("X did not return a reply ID.");
    return { remoteId: result.data.id, permalink: `https://x.com/i/web/status/${result.data.id}` };
  },

  async dm(account, targetRemoteId, text) {
    const token = await accessToken(account);
    const result = await socialFetch<{ data?: { dm_event_id?: string } }>(
      `${API}/dm_conversations/with/${encodeURIComponent(targetRemoteId)}/messages`,
      { method: "POST", headers: bearer(token), body: JSON.stringify({ text }) },
      "X DM",
    );
    if (!result.data?.dm_event_id) throw new Error("X did not return a DM event ID.");
    return { remoteId: result.data.dm_event_id };
  },

  async engagements(account, since) {
    if (!account.remoteId) return [];
    const token = await accessToken(account);
    const startTime = encodeURIComponent(since);
    const result = await socialFetch<{
      data?: Array<{ id: string; text: string; author_id?: string; created_at?: string; conversation_id?: string }>;
    }>(
      `${API}/users/${account.remoteId}/mentions?max_results=100&start_time=${startTime}&tweet.fields=author_id,created_at,conversation_id`,
      { headers: bearer(token) },
      "X mentions",
    );
    return (result.data ?? []).map((item) => ({
      platformEventId: item.id,
      actorRemoteId: item.author_id ?? "unknown",
      kind: "mention" as const,
      content: item.text,
      threadId: item.conversation_id,
      receivedAt: item.created_at ?? new Date().toISOString(),
    }));
  },

  async metrics(account, remoteId) {
    const token = await accessToken(account);
    const result = await socialFetch<{
      data?: {
        public_metrics?: { impression_count?: number; like_count?: number; reply_count?: number; retweet_count?: number };
      };
    }>(`${API}/tweets/${remoteId}?tweet.fields=public_metrics`, { headers: bearer(token) }, "X metrics");
    const stats = result.data?.public_metrics ?? {};
    return {
      impressions: Number(stats.impression_count ?? 0),
      likes: Number(stats.like_count ?? 0),
      comments: Number(stats.reply_count ?? 0),
      shares: Number(stats.retweet_count ?? 0),
      clicks: 0,
      freeAuditLeads: 0,
      raw: result,
    } satisfies Omit<MetricSnapshot, "id" | "accountId" | "postId" | "capturedAt">;
  },
};
