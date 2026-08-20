import { createHmac, randomUUID } from "node:crypto";
import OpenAI from "openai";
import { put } from "@vercel/blob";
import { site } from "@/lib/site";
import { socialStore } from "./store";

function videoDay() {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(new Date());
  return day === "Tue" || day === "Thu";
}

function captions(script: string) {
  const words = script.trim().split(/\s+/);
  const chunks: string[] = [];
  while (words.length) chunks.push(words.splice(0, 8).join(" "));
  return chunks
    .map((line, index) => {
      const start = index * 3;
      const end = start + 3;
      const time = (seconds: number) => `00:00:${String(seconds).padStart(2, "0")},000`;
      return `${index + 1}\n${time(start)} --> ${time(end)}\n${line}\n`;
    })
    .join("\n");
}

export async function scheduleCampaignVideo(campaignId: string, topic: string, angle: string, cardUrl: string) {
  if (!videoDay()) return null;
  const required = [
    process.env.OPENAI_API_KEY,
    process.env.BLOB_READ_WRITE_TOKEN,
    process.env.SOCIAL_RENDER_GITHUB_TOKEN,
    process.env.SOCIAL_RENDER_GITHUB_REPO,
    process.env.SOCIAL_RENDER_CALLBACK_SECRET,
  ];
  if (required.some((value) => !value)) return null;
  const store = socialStore();
  const settings = await store.settings();
  const spend = await store.spendThisMonth();
  if (spend >= settings.monthlyBudgetUsd * 0.8) return null;
  const reserve = await store.reserveSpend(0.25);
  if (!reserve.allowed) return null;

  const script = `${topic}. ${angle} Run a free AI Search Audit at queryclear dot com to see what search systems can understand today. This narration was generated with an AI voice.`
    .replace(/\s+/g, " ")
    .slice(0, 650);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const speech = await openai.audio.speech.create({
    model: process.env.SOCIAL_TTS_MODEL ?? "gpt-4o-mini-tts",
    voice: "sage",
    input: script,
    instructions: "Clear, calm, useful brand narration. Never imitate a real person.",
    response_format: "mp3",
  });
  const mediaId = randomUUID();
  const audio = await put(`social/${campaignId}/${mediaId}.mp3`, Buffer.from(await speech.arrayBuffer()), {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const srt = captions(script);
  const captionFile = await put(`social/${campaignId}/${mediaId}.srt`, srt, {
    access: "public",
    contentType: "application/x-subrip",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const now = new Date().toISOString();
  await store.saveMedia({
    id: mediaId,
    campaignId,
    kind: "video",
    status: "rendering",
    mimeType: "video/mp4",
    width: 1080,
    height: 1920,
    altText: topic,
    aiDisclosure: "Narrated with an AI-generated voice.",
    createdAt: now,
    updatedAt: now,
  });

  const payload = {
    event_type: "render-social-video",
    client_payload: {
      mediaId,
      campaignId,
      cardUrl,
      audioUrl: audio.url,
      captionsUrl: captionFile.url,
      callbackUrl: `${site.url}/api/social/render/callback`,
    },
  };
  const response = await fetch(`https://api.github.com/repos/${process.env.SOCIAL_RENDER_GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SOCIAL_RENDER_GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    await store.saveMedia({
      ...(await store.getMedia(mediaId))!,
      status: "failed",
      updatedAt: new Date().toISOString(),
    });
    throw new Error(`GitHub video render dispatch failed with ${response.status}.`);
  }
  await store.audit("media.video.dispatched", mediaId, { campaignId });
  return mediaId;
}

export function renderCallbackSignature(raw: string) {
  const secret = process.env.SOCIAL_RENDER_CALLBACK_SECRET ?? "";
  return createHmac("sha256", secret).update(raw).digest("hex");
}
