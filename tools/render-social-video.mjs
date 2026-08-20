import { createHmac } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { put } from "@vercel/blob";

const exec = promisify(execFile);
const payload = JSON.parse(process.env.SOCIAL_RENDER_PAYLOAD ?? "{}");
const required = ["mediaId", "campaignId", "cardUrl", "audioUrl", "captionsUrl", "callbackUrl"];
for (const field of required) if (!payload[field]) throw new Error(`Render payload is missing ${field}.`);
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required.");
if (!process.env.SOCIAL_RENDER_CALLBACK_SECRET) throw new Error("SOCIAL_RENDER_CALLBACK_SECRET is required.");

const dir = await mkdtemp(path.join(tmpdir(), "queryclear-social-"));
const cardPath = path.join(dir, "card.png");
const audioPath = path.join(dir, "voice.mp3");
const captionsPath = path.join(dir, "captions.srt");
const outputPath = path.join(dir, "video.mp4");

const download = async (url, destination) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset download failed: ${response.status}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
};
await Promise.all([
  download(payload.cardUrl, cardPath),
  download(payload.audioUrl, audioPath),
  download(payload.captionsUrl, captionsPath),
]);

const escapedCaptions = captionsPath.replaceAll("\\", "/").replaceAll(":", "\\:");
await exec(
  "ffmpeg",
  [
    "-y",
    "-loop",
    "1",
    "-i",
    cardPath,
    "-i",
    audioPath,
    "-vf",
    `scale=1080:1080,pad=1080:1920:0:420:color=0x0c2a21,subtitles='${escapedCaptions}':force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00F7F4EE,OutlineColour=&H000C2A21,BorderStyle=3,Outline=2,MarginV=100'`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath,
  ],
  { maxBuffer: 10 * 1024 * 1024 },
);

const blob = await put(`social/${payload.campaignId}/${payload.mediaId}.mp4`, await readFile(outputPath), {
  access: "public",
  contentType: "video/mp4",
  addRandomSuffix: false,
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
const callbackBody = JSON.stringify({
  mediaId: payload.mediaId,
  url: blob.url,
  mimeType: "video/mp4",
  width: 1080,
  height: 1920,
});
const signature = createHmac("sha256", process.env.SOCIAL_RENDER_CALLBACK_SECRET).update(callbackBody).digest("hex");
const callback = await fetch(payload.callbackUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-social-signature": signature },
  body: callbackBody,
});
if (!callback.ok) throw new Error(`Render callback failed: ${callback.status}`);
console.log(blob.url);
