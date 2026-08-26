import { NextResponse } from "next/server";
import {
  reportAccessCookieName,
  reportAccessTokenExpiresAt,
  verifyReportAccessToken,
} from "@/lib/report-access";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

function responseHeaders() {
  return {
    "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  };
}

function redirectOrigin(requestUrl: URL): string {
  if (
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname) &&
    ["http:", "https:"].includes(requestUrl.protocol)
  ) {
    return requestUrl.origin;
  }
  return new URL(site.url).origin;
}

/** Exchange a signed bearer link for a scoped HttpOnly cookie, then clean the URL. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("slug") ?? "";
  const access = requestUrl.searchParams.get("access") ?? "";
  if (!verifyReportAccessToken(slug, access)) {
    return NextResponse.json(
      { error: "Report link is invalid or expired." },
      { status: 404, headers: responseHeaders() },
    );
  }

  const expiresAt = reportAccessTokenExpiresAt(access);
  if (!expiresAt) {
    return NextResponse.json(
      { error: "Report link is invalid or expired." },
      { status: 404, headers: responseHeaders() },
    );
  }

  const destination = new URL(
    `/reports/${encodeURIComponent(slug)}`,
    redirectOrigin(requestUrl),
  );
  const response = NextResponse.redirect(destination, 303);
  for (const [key, value] of Object.entries(responseHeaders())) response.headers.set(key, value);
  response.cookies.set(reportAccessCookieName(slug), access, {
    httpOnly: true,
    secure: destination.protocol === "https:",
    sameSite: "lax",
    path: `/reports/${slug}`,
    maxAge: Math.max(1, expiresAt - Math.floor(Date.now() / 1000)),
  });
  return response;
}
