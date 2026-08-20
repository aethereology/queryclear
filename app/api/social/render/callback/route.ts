import { NextResponse } from "next/server";
import { verifyHmacBody } from "@/lib/social/security";
import { socialStore } from "@/lib/social/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyHmacBody(raw, request.headers.get("x-social-signature"), "SOCIAL_RENDER_CALLBACK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = JSON.parse(raw) as {
    mediaId?: string;
    url?: string;
    mimeType?: string;
    durationSeconds?: number;
    width?: number;
    height?: number;
    error?: string;
  };
  if (!body.mediaId) return NextResponse.json({ error: "mediaId is required." }, { status: 400 });
  const store = socialStore();
  const asset = await store.getMedia(body.mediaId);
  if (!asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  const updated = {
    ...asset,
    status: body.error ? ("failed" as const) : ("ready" as const),
    url: body.url ?? asset.url,
    mimeType: body.mimeType ?? asset.mimeType,
    durationSeconds: body.durationSeconds ?? asset.durationSeconds,
    width: body.width ?? asset.width,
    height: body.height ?? asset.height,
    updatedAt: new Date().toISOString(),
  };
  await store.saveMedia(updated);
  await store.audit("media.render.callback", asset.id, { status: updated.status, error: body.error });
  return NextResponse.json({ ok: true });
}
