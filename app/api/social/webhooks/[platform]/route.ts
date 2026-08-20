import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { engagementRisk, hashActor } from "@/lib/social/policy";
import { secretOk } from "@/lib/secret";
import { socialStore } from "@/lib/social/store";
import type { EngagementEvent, SocialPlatform } from "@/lib/social/types";

export const dynamic = "force-dynamic";

function metaSignatureOk(raw: string, signature: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  return secretOk(signature.slice(7), createHmac("sha256", secret).update(raw).digest("hex"));
}

function xSignatureOk(raw: string, signature: string | null) {
  const secret = process.env.X_WEBHOOK_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  return secretOk(signature.slice(7), createHmac("sha256", secret).update(raw).digest("base64"));
}

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params;
  const url = new URL(request.url);
  if (platform === "facebook" || platform === "instagram") {
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (token && challenge && process.env.META_WEBHOOK_VERIFY_TOKEN && secretOk(token, process.env.META_WEBHOOK_VERIFY_TOKEN)) {
      return new Response(challenge);
    }
  }
  if (platform === "x") {
    const crc = url.searchParams.get("crc_token");
    if (crc && process.env.X_WEBHOOK_SECRET) {
      return NextResponse.json({
        response_token: `sha256=${createHmac("sha256", process.env.X_WEBHOOK_SECRET).update(crc).digest("base64")}`,
      });
    }
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 401 });
}

export async function POST(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params;
  if (!["facebook", "instagram", "x"].includes(platform)) {
    return NextResponse.json({ error: "This platform does not provide a configured webhook flow." }, { status: 405 });
  }
  const raw = await request.text();
  const valid =
    platform === "x"
      ? xSignatureOk(raw, request.headers.get("x-twitter-webhooks-signature"))
      : metaSignatureOk(raw, request.headers.get("x-hub-signature-256"));
  if (!valid) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  const body = JSON.parse(raw) as Record<string, unknown>;
  const store = socialStore();
  await store.audit("webhook.received", platform, { bytes: raw.length }, "platform");

  const events: EngagementEvent[] = [];
  if (platform === "x") {
    const tweets = (body.tweet_create_events as Array<Record<string, unknown>> | undefined) ?? [];
    const dms = (body.direct_message_events as Array<Record<string, unknown>> | undefined) ?? [];
    for (const item of tweets) {
      const actor = String((item.user as { id_str?: string } | undefined)?.id_str ?? item.user_id_str ?? "unknown");
      const content = String(item.text ?? "");
      events.push({
        id: randomUUID(),
        platformEventId: `x:${String(item.id_str ?? item.id ?? randomUUID())}`,
        accountId: "x-brand",
        platform: "x",
        actorIdHash: hashActor("x", actor),
        actorRemoteId: actor,
        kind: "mention",
        content,
        threadId: String(item.in_reply_to_status_id_str ?? item.id_str ?? ""),
        receivedAt: new Date().toISOString(),
        risk: engagementRisk(content),
      });
    }
    for (const item of dms) {
      const actor = String((item.message_create as { sender_id?: string } | undefined)?.sender_id ?? "unknown");
      const content = String(
        (item.message_create as { message_data?: { text?: string } } | undefined)?.message_data?.text ?? "",
      );
      events.push({
        id: randomUUID(),
        platformEventId: `x:${String(item.id ?? randomUUID())}`,
        accountId: "x-brand",
        platform: "x",
        actorIdHash: hashActor("x", actor),
        actorRemoteId: actor,
        kind: "dm",
        content,
        receivedAt: new Date().toISOString(),
        risk: engagementRisk(content),
      });
    }
  } else {
    const entries = (body.entry as Array<{ changes?: Array<{ value?: Record<string, unknown> }>; messaging?: Array<Record<string, unknown>> }> | undefined) ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const actor = String((value.from as { id?: string } | undefined)?.id ?? "unknown");
        const content = String(value.message ?? value.text ?? "");
        const socialPlatform = platform as SocialPlatform;
        events.push({
          id: randomUUID(),
          platformEventId: `${platform}:${String(value.comment_id ?? value.id ?? randomUUID())}`,
          accountId: platform === "instagram" ? "instagram-brand" : "facebook-brand",
          platform: socialPlatform,
          actorIdHash: hashActor(socialPlatform, actor),
          actorRemoteId: actor,
          kind: "comment",
          content,
          threadId: String(value.post_id ?? value.media_id ?? ""),
          receivedAt: new Date().toISOString(),
          risk: engagementRisk(content),
        });
      }
    }
  }

  let saved = 0;
  for (const event of events) if (await store.saveEngagement(event)) saved += 1;
  return NextResponse.json({ received: true, saved });
}
