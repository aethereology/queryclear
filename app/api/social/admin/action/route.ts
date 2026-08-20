import { NextResponse } from "next/server";
import { preflightAndRepair } from "@/lib/social/preflight";
import { csrfForSession, verifyAdminSession, verifyCsrf } from "@/lib/social/security";
import { socialStore } from "@/lib/social/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)social_admin=([^;]+)/)?.[1];
  const session = cookie ? decodeURIComponent(cookie) : undefined;
  if (!verifyAdminSession(session)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const form = await request.formData();
  if (!verifyCsrf(session!, String(form.get("csrf") ?? request.headers.get("x-csrf-token") ?? ""))) {
    return NextResponse.json({ error: "Invalid CSRF token." }, { status: 403 });
  }
  const action = String(form.get("action") ?? "");
  const target = String(form.get("target") ?? "");
  const store = socialStore();

  try {
    if (action === "global-pause" || action === "global-resume") {
      await store.updateSettings({ globalPaused: action === "global-pause" });
      await store.audit(action, "global", undefined, "admin");
    } else if (action === "account-pause" || action === "account-resume") {
      const account = await store.getAccount(target);
      if (!account) throw new Error("Account not found.");
      const paused = action === "account-pause";
      await store.saveAccount({
        ...account,
        paused,
        status: paused ? "paused" : account.capabilities.publish ? "ready" : "blocked",
        lastError: paused ? "Paused by administrator." : undefined,
      });
      await store.audit(action, target, undefined, "admin");
    } else if (action === "allowlist") {
      const allowlist = String(form.get("allowlist") ?? "")
        .split(",")
        .map((value) => value.trim().replace(/^r\//, "").toLowerCase())
        .filter(Boolean);
      await store.updateSettings({ redditAllowlist: [...new Set(allowlist)] });
      await store.audit("reddit.allowlist.updated", "settings", { count: allowlist.length }, "admin");
    } else if (action === "retry") {
      const queued = await store.getAction(target);
      if (!queued || !["quarantined", "retryable"].includes(queued.status)) throw new Error("Action is not retryable.");
      await store.finishAction(queued, {
        status: "queued",
        dueAt: new Date().toISOString(),
        lastError: undefined,
      });
      await store.audit("action.retried", target, undefined, "admin");
    } else if (action === "delete-post") {
      const post = await store.getPost(target);
      if (!post?.platformPostId) throw new Error("Published post not found.");
      await store.enqueueAction({
        kind: "delete",
        accountId: post.accountId,
        postId: post.id,
        targetRemoteId: post.platformPostId,
        idempotencyKey: `delete:${post.id}`,
        dueAt: new Date().toISOString(),
      });
      await store.audit("post.delete.queued", target, undefined, "admin");
    } else if (action === "health-check" || action === "preflight") {
      // Runs for EVERY account, including blocked ones — a blocked account is exactly
      // the one whose blocker needs explaining. Repairs what it can (resolved author
      // identity) and persists per-check remediation for the dashboard.
      const accounts = await store.syncConfiguredAccounts();
      const results = await Promise.all(
        accounts.map(async (account) => {
          try {
            const readiness = await preflightAndRepair(account);
            return { id: account.id, canPublish: readiness.canPublish, blockedBy: readiness.blockedBy };
          } catch (error) {
            return { id: account.id, canPublish: false, error: error instanceof Error ? error.message : "failed" };
          }
        }),
      );
      await store.audit(
        "accounts.preflight",
        "all",
        { ready: results.filter((r) => r.canPublish).map((r) => r.id), blocked: results.filter((r) => !r.canPublish) },
        "admin",
      );
    } else {
      return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/admin/social", request.url), 303);
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/admin/social?action_error=${encodeURIComponent(error instanceof Error ? error.message : "Action failed.")}`, request.url),
      303,
    );
  }
}

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)social_admin=([^;]+)/)?.[1];
  const session = cookie ? decodeURIComponent(cookie) : undefined;
  if (!verifyAdminSession(session)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ csrf: csrfForSession(session!) });
}
