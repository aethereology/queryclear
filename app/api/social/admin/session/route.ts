import { NextResponse } from "next/server";
import { createAdminSession, sessionCookieOptions } from "@/lib/social/security";
import { secretOk } from "@/lib/secret";

export async function POST(request: Request) {
  const form = await request.formData();
  const provided = String(form.get("secret") ?? "");
  const expected = process.env.SOCIAL_ADMIN_SECRET;
  // Distinguish "the server has no secret configured" from "that secret is wrong".
  // Collapsing both into one message makes an unset env var look like a typo, which is
  // unfalsifiable from the login screen.
  if (!expected) {
    return NextResponse.redirect(new URL("/admin/social?login_error=unconfigured", request.url), 303);
  }
  if (!provided || !secretOk(provided, expected)) {
    return NextResponse.redirect(new URL("/admin/social?login_error=1", request.url), 303);
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
