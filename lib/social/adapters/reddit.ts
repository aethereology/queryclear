import type { MetricSnapshot, PublishRequest, SocialAdapter } from "../types";
import { accessToken, formBearer, socialFetch, unsupported } from "./base";

const API = "https://oauth.reddit.com";
const userAgent = process.env.REDDIT_USER_AGENT ?? "web:queryclear-social:v1.0 (by /u/queryclear)";

function headers(token: string) {
  return { ...formBearer(token), "User-Agent": userAgent };
}

export const redditAdapter: SocialAdapter = {
  platform: "reddit",
  async health(account) {
    try {
      const token = await accessToken(account);
      await socialFetch(`${API}/api/v1/me`, { headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent } }, "Reddit health check");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Reddit health check failed." };
    }
  },
  async publish(request: PublishRequest) {
    const token = await accessToken(request.account);
    if (!request.subreddit) unsupported("Posting without an allowlisted subreddit", request.account);
    const body = new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: request.subreddit,
      title: request.title ?? request.text.slice(0, 250),
      text: request.text,
      resubmit: "false",
      sendreplies: "true",
    });
    const result = await socialFetch<{ json?: { data?: { name?: string; url?: string }; errors?: unknown[] } }>(
      `${API}/api/submit`,
      { method: "POST", headers: headers(token), body },
      "Reddit publish",
    );
    const remoteId = result.json?.data?.name;
    if (!remoteId) throw new Error(`Reddit did not create the post: ${JSON.stringify(result.json?.errors ?? [])}`);
    return { remoteId, permalink: result.json?.data?.url };
  },
  async delete(account, remoteId) {
    const token = await accessToken(account);
    await socialFetch(`${API}/api/del`, { method: "POST", headers: headers(token), body: new URLSearchParams({ id: remoteId }) }, "Reddit delete");
  },
  async reply(account, targetRemoteId, text) {
    const token = await accessToken(account);
    const result = await socialFetch<{ json?: { data?: { things?: Array<{ data?: { name?: string; permalink?: string } }> } } }>(
      `${API}/api/comment`,
      {
        method: "POST",
        headers: headers(token),
        body: new URLSearchParams({ api_type: "json", thing_id: targetRemoteId, text }),
      },
      "Reddit reply",
    );
    const data = result.json?.data?.things?.[0]?.data;
    if (!data?.name) throw new Error("Reddit did not return a comment ID.");
    return { remoteId: data.name, permalink: data.permalink ? `https://www.reddit.com${data.permalink}` : undefined };
  },
  async dm(account, targetRemoteId, text) {
    const token = await accessToken(account);
    await socialFetch(
      `${API}/api/compose`,
      {
        method: "POST",
        headers: headers(token),
        body: new URLSearchParams({ api_type: "json", to: targetRemoteId, subject: "Following up", text }),
      },
      "Reddit message",
    );
    return { remoteId: `message:${Date.now()}` };
  },
  async engagements(account, since) {
    const token = await accessToken(account);
    const result = await socialFetch<{
      data?: { children?: Array<{ data?: { name?: string; author?: string; body?: string; subject?: string; created_utc?: number; context?: string } }> };
    }>(
      `${API}/message/inbox?limit=100`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent } },
      "Reddit inbox",
    );
    return (result.data?.children ?? [])
      .map(({ data = {} }) => ({
        platformEventId: data.name ?? "",
        actorRemoteId: data.author ?? "unknown",
        kind: "reply" as const,
        content: data.body ?? data.subject ?? "",
        threadId: data.context,
        receivedAt: new Date(Number(data.created_utc ?? 0) * 1000).toISOString(),
      }))
      .filter((item) => item.platformEventId && item.receivedAt >= since);
  },
  async metrics(account, remoteId) {
    const token = await accessToken(account);
    const result = await socialFetch<{
      data?: { children?: Array<{ data?: { score?: number; num_comments?: number; ups?: number; permalink?: string } }> };
    }>(
      `${API}/api/info?id=${encodeURIComponent(remoteId)}`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent } },
      "Reddit metrics",
    );
    const data = result.data?.children?.[0]?.data ?? {};
    return {
      impressions: 0,
      likes: Number(data.ups ?? data.score ?? 0),
      comments: Number(data.num_comments ?? 0),
      shares: 0,
      clicks: 0,
      freeAuditLeads: 0,
      raw: result,
    } satisfies Omit<MetricSnapshot, "id" | "accountId" | "postId" | "capturedAt">;
  },
};
