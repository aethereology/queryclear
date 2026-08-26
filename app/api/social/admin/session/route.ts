import { NextResponse } from "next/server";
import { createAdminSession, sessionCookieOptions } from "@/lib/social/security";
import { secretOk } from "@/lib/secret";
import { operationsStore } from "@/lib/operations-store";

const MAX_BODY_BYTES = 2 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS = 5;

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function loginRedirect(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/admin/social?login_error=${error}`, request.url), 303);
}

export async function POST(request: Request) {
  const expected = process.env.SOCIAL_ADMIN_SECRET;
  // Distinguish "the server has no secret configured" from "that secret is wrong".
  // Collapsing both into one message makes an unset env var look like a typo, which is
  // unfalsifiable from the login screen.
  if (!expected || expected.length < 32) {
    return loginRedirect(request, "unconfigured");
  }
  try {
    const limit = await operationsStore().rateLimit(
      "social-admin-login",
      clientIp(request),
      LOGIN_ATTEMPTS,
      LOGIN_WINDOW_MS,
    );
    if (!limit.allowed) return loginRedirect(request, "locked");
  } catch {
    console.error("[social-admin] login rate-limit storage unavailable");
    return loginRedirect(request, "unavailable");
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (contentType !== "application/x-www-form-urlencoded" || declaredLength > MAX_BODY_BYTES) {
    return loginRedirect(request, "invalid");
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return loginRedirect(request, "invalid");
  const provided = new URLSearchParams(raw).get("secret") ?? "";
  if (!provided || !secretOk(provided, expected)) {
    console.warn("[social-admin] rejected login attempt");
    return loginRedirect(request, "1");
  }
  const response = NextResponse.redirect(new URL("/admin/social", request.url), 303);
  response.cookies.set("social_admin", createAdminSession(), sessionCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/social", request.url), 303);
  response.cookies.set("social_admin", "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
