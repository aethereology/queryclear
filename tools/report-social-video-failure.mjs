import { createHmac } from "node:crypto";

const payload = JSON.parse(process.env.SOCIAL_RENDER_PAYLOAD ?? "{}");
if (!payload.mediaId || !payload.callbackUrl || !process.env.SOCIAL_RENDER_CALLBACK_SECRET) process.exit(0);
const body = JSON.stringify({ mediaId: payload.mediaId, error: "GitHub Actions video render failed." });
const signature = createHmac("sha256", process.env.SOCIAL_RENDER_CALLBACK_SECRET).update(body).digest("hex");
await fetch(payload.callbackUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-social-signature": signature },
  body,
});
