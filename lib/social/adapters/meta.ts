import type { MetricSnapshot, PublishRequest, SocialAdapter } from "../types";
import { accessToken, socialFetch, unsupported } from "./base";

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v23.0"}`;

function form(values: Record<string, string>) {
  return new URLSearchParams(values).toString();
}

async function graphPost<T>(path: string, token: string, values: Record<string, string>) {
  return socialFetch<T>(
    `${GRAPH}/${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({ ...values, access_token: token }),
    },
    `Meta ${path}`,
  );
}

export const facebookAdapter: SocialAdapter = {
  platform: "facebook",
  async health(account) {
    try {
      const token = await accessToken(account);
      await socialFetch(`${GRAPH}/${account.remoteId}?fields=id,name&access_token=${encodeURIComponent(token)}`, {}, "Facebook health check");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Facebook health check failed." };
    }
  },
  async publish(request: PublishRequest) {
    const token = await accessToken(request.account);
    if (!request.account.remoteId) unsupported("Publishing", request.account);
    const endpoint = request.mediaUrls[0] ? `${request.account.remoteId}/photos` : `${request.account.remoteId}/feed`;
    const result = await graphPost<{ id?: string; post_id?: string }>(
      endpoint,
      token,
      request.mediaUrls[0]
        ? { url: request.mediaUrls[0], caption: request.text, published: "true" }
        : { message: request.text },
    );
    const remoteId = result.post_id ?? result.id;
    if (!remoteId) throw new Error("Facebook did not return a post ID.");
    return { remoteId, permalink: `https://www.facebook.com/${remoteId.replace("_", "/posts/")}` };
  },
  async delete(account, remoteId) {
    const token = await accessToken(account);
    await socialFetch(`${GRAPH}/${remoteId}?access_token=${encodeURIComponent(token)}`, { method: "DELETE" }, "Facebook delete");
  },
  async reply(account, targetRemoteId, text) {
    const token = await accessToken(account);
    const result = await graphPost<{ id?: string }>(`${targetRemoteId}/comments`, token, { message: text });
    if (!result.id) throw new Error("Facebook did not return a comment ID.");
    return { remoteId: result.id };
  },
  /**
   * `targetRemoteId` is a COMMENT id, not a user id.
   *
   * Meta's only compliant unsolicited-DM path is a private reply to a comment:
   * `me/messages` with messaging_type=RESPONSE is valid solely inside the 24-hour
   * window a *user-initiated* message opens, which a comment or follow does not open.
   * Addressing the comment also removes the need for an IGSID — Instagram comment
   * payloads carry a username, which is not a valid message recipient.
   *
   * Meta permits exactly one private reply per comment, within 7 days of it. The
   * one-per-comment rule is enforced upstream by the `dm:{platformEventId}`
   * idempotency key; the 7-day rule by `privateReplyWindowOpen` in policy.ts.
   */
  async dm(account, targetRemoteId, text) {
    const token = await accessToken(account);
    const result = await graphPost<{ id?: string }>(`${targetRemoteId}/private_replies`, token, { message: text });
    if (!result.id) throw new Error("Meta did not return a private-reply ID.");
    return { remoteId: result.id };
  },
  async engagements(account, since) {
    const token = await accessToken(account);
    const result = await socialFetch<{
      data?: Array<{ id: string; message?: string; from?: { id?: string }; created_time?: string; parent?: { id?: string } }>;
    }>(
      `${GRAPH}/${account.remoteId}/feed?fields=comments.limit(100){id,message,from,created_time,parent}&since=${encodeURIComponent(since)}&access_token=${encodeURIComponent(token)}`,
      {},
      "Facebook engagements",
    );
    return (result.data ?? []).flatMap((post) => {
      const comments = (post as unknown as { comments?: { data?: Array<Record<string, unknown>> } }).comments?.data ?? [];
      return comments.map((comment) => ({
        platformEventId: String(comment.id),
        actorRemoteId: String((comment.from as { id?: string } | undefined)?.id ?? "unknown"),
        kind: "comment" as const,
        content: String(comment.message ?? ""),
        threadId: post.id,
        receivedAt: String(comment.created_time ?? new Date().toISOString()),
      }));
    });
  },
  async metrics(account, remoteId) {
    const token = await accessToken(account);
    const result = await socialFetch<{ shares?: { count?: number }; comments?: { summary?: { total_count?: number } }; reactions?: { summary?: { total_count?: number } } }>(
      `${GRAPH}/${remoteId}?fields=shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)&access_token=${encodeURIComponent(token)}`,
      {},
      "Facebook metrics",
    );
    return {
      impressions: 0,
      likes: Number(result.reactions?.summary?.total_count ?? 0),
      comments: Number(result.comments?.summary?.total_count ?? 0),
      shares: Number(result.shares?.count ?? 0),
      clicks: 0,
      freeAuditLeads: 0,
      raw: result,
    };
  },
};

export const instagramAdapter: SocialAdapter = {
  platform: "instagram",
  async health(account) {
    return facebookAdapter.health(account);
  },
  async publish(request) {
    const token = await accessToken(request.account);
    if (!request.account.remoteId || !request.mediaUrls[0]) unsupported("Instagram publishing without public media", request.account);
    const isVideo = /\.(mp4|mov)(?:\?|$)/i.test(request.mediaUrls[0]);
    const container = await graphPost<{ id?: string }>(`${request.account.remoteId}/media`, token, {
      [isVideo ? "video_url" : "image_url"]: request.mediaUrls[0],
      ...(isVideo ? { media_type: "REELS" } : {}),
      caption: request.text,
    });
    if (!container.id) throw new Error("Instagram did not create a media container.");
    const result = await graphPost<{ id?: string }>(`${request.account.remoteId}/media_publish`, token, {
      creation_id: container.id,
    });
    if (!result.id) throw new Error("Instagram did not return a media ID.");
    return { remoteId: result.id, permalink: `https://www.instagram.com/p/${result.id}/` };
  },
  async delete(account, remoteId) {
    return facebookAdapter.delete(account, remoteId);
  },
  async reply(account, targetRemoteId, text) {
    return facebookAdapter.reply(account, targetRemoteId, text);
  },
  async dm(account, targetRemoteId, text) {
    return facebookAdapter.dm(account, targetRemoteId, text);
  },
  async engagements(account, since) {
    const token = await accessToken(account);
    const result = await socialFetch<{
      data?: Array<{ id: string; caption?: string; comments?: { data?: Array<{ id: string; text?: string; username?: string; timestamp?: string }> } }>;
    }>(
      `${GRAPH}/${account.remoteId}/media?fields=id,caption,comments.limit(100){id,text,username,timestamp}&since=${encodeURIComponent(since)}&access_token=${encodeURIComponent(token)}`,
      {},
      "Instagram engagements",
    );
    return (result.data ?? []).flatMap((post) =>
      (post.comments?.data ?? []).map((comment) => ({
        platformEventId: comment.id,
        actorRemoteId: comment.username ?? "unknown",
        kind: "comment" as const,
        content: comment.text ?? "",
        threadId: post.id,
        receivedAt: comment.timestamp ?? new Date().toISOString(),
      })),
    );
  },
  async metrics(account, remoteId) {
    const token = await accessToken(account);
    const result = await socialFetch<{ data?: Array<{ name: string; values?: Array<{ value?: number }> }> }>(
      `${GRAPH}/${remoteId}/insights?metric=views,reach,likes,comments,shares,saved&access_token=${encodeURIComponent(token)}`,
      {},
      "Instagram metrics",
    );
    const values = Object.fromEntries((result.data ?? []).map((metric) => [metric.name, Number(metric.values?.[0]?.value ?? 0)]));
    return {
      impressions: values.views ?? values.reach ?? 0,
      likes: values.likes ?? 0,
      comments: values.comments ?? 0,
      shares: values.shares ?? 0,
      clicks: 0,
      freeAuditLeads: 0,
      raw: result,
    } satisfies Omit<MetricSnapshot, "id" | "accountId" | "postId" | "capturedAt">;
  },
};
