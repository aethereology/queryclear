import { callbackUrl } from "./oauth";
import { socialAdapter } from "./adapters";
import { envTokenPresent } from "./adapters/base";
import { socialStore } from "./store";
import type { AccountReadiness, PreflightCheck, SocialAccount } from "./types";

/**
 * Preflight answers "can this account publish, and if not, exactly what do I do?"
 * before any external write is attempted.
 *
 * It exists because the alternative is diagnosis by trial: click Connect, read the
 * platform's error page, fix one thing, repeat. Every failing check therefore carries
 * its own remediation (`action`) and any exact string the operator needs (`value`),
 * and the results are persisted so the dashboard keeps showing them.
 */

/** Ordered worst-first so the dashboard can lead with the real blocker. */
const SEVERITY: Record<PreflightCheck["status"], number> = { fail: 0, warn: 1, skip: 2, pass: 3 };

/**
 * Checks that must pass before an account may publish, ordered by REMEDIATION DEPTH —
 * the operator should be shown the change that unblocks everything else first. A missing
 * platform product outranks a stale token, because reconnecting cannot succeed until the
 * product exists. Picking the blocker by array position instead would surface "reconnect
 * the account" for an account that physically cannot be connected yet.
 */
const BLOCKING: ReadonlyArray<PreflightCheck["id"]> = ["credentials", "callback", "target", "scope", "token", "author"];

async function genericChecks(account: SocialAccount): Promise<PreflightCheck[]> {
  const checks: PreflightCheck[] = [];

  // Two credential sources for one account is actively destructive on platforms that
  // allow a single live token per app+member — LinkedIn among them. Minting a token in
  // the developer portal revokes the OAuth-stored one and vice versa, so the account
  // breaks every time the other source is touched, with no obvious cause.
  const stored = await socialStore().encryptedToken(account.id);
  if (stored && envTokenPresent(account)) {
    checks.push({
      id: "credentials",
      label: "Single credential source",
      status: "warn",
      detail:
        "This account has BOTH an OAuth-stored token and a hand-set environment token. LinkedIn permits one live token per app and member, so creating either one revokes the other — the account will keep breaking until only one source remains.",
      action:
        "Delete the platform access-token environment variable and rely on the connection made from this page, which refreshes itself.",
    });
  }

  if (!account.remoteId) {
    checks.push({
      id: "target",
      label: "Publishing target configured",
      status: "fail",
      detail: `${account.label} has no remote id (page, profile, or organization).`,
      action: account.statusReason ?? "Set the account's id environment variable.",
    });
  }
  // Report only capabilities a platform REFUSED at runtime. Capabilities that are false
  // by design — LinkedIn has no member DM API — are not warnings, and surfacing them
  // trains the operator to ignore the panel.
  const degraded = await socialStore().disabledCapabilities(account.id);
  if (degraded.length) {
    checks.push({
      id: "capabilities",
      label: "Capabilities disabled after a platform refusal",
      status: degraded.includes("publish") ? "fail" : "warn",
      detail: `${degraded.join(", ")} — turned off automatically after LinkedIn/the platform returned 401 or 403.`,
      action: "Fix the underlying scope, then reconnect to restore them.",
    });
  }
  return checks;
}

export async function preflightAccount(account: SocialAccount): Promise<AccountReadiness> {
  const adapter = socialAdapter(account.platform);
  const checks: PreflightCheck[] = [];

  if (adapter.preflight) {
    try {
      checks.push(...(await adapter.preflight(account)));
    } catch (error) {
      checks.push({
        id: "credentials",
        label: "Preflight",
        status: "fail",
        detail: error instanceof Error ? error.message : "Preflight failed.",
        action: "Reconnect the account.",
      });
    }
  } else {
    // Platforms without a dedicated preflight still get a real network check plus the
    // redirect URI they must register — never a bare "looks fine".
    const health = await adapter.health(account);
    checks.push({
      id: "token",
      label: "Platform reachable with stored credentials",
      status: health.ok ? "pass" : "fail",
      detail: health.reason,
      action: health.ok ? undefined : "Reconnect the account.",
    });
    checks.push({
      id: "callback",
      label: "Redirect URI registered",
      status: "warn",
      detail: "Cannot be read back from the platform. Confirm this exact string is registered.",
      action: "Register this URL verbatim in the platform app.",
      value: callbackUrl(account.platform),
    });
  }

  checks.push(...(await genericChecks(account)));
  checks.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status]);

  // Deepest remediation first, not first-in-array.
  const blocker = BLOCKING.map((id) => checks.find((check) => check.id === id && check.status === "fail")).find(Boolean);
  return {
    accountId: account.id,
    canPublish: !blocker,
    blockedBy: blocker?.id,
    checks,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Runs preflight, self-heals what can be fixed without the operator, and persists the
 * result. Self-healing is the point: an author URN that the platform can report should
 * never be a value a human has to paste correctly.
 */
export async function preflightAndRepair(account: SocialAccount): Promise<AccountReadiness> {
  const store = socialStore();
  const adapter = socialAdapter(account.platform);
  let current = account;

  if (adapter.resolveAuthorUrn) {
    try {
      const resolved = await adapter.resolveAuthorUrn(current);
      if (resolved && resolved !== current.remoteId) {
        await store.setResolvedRemoteId(current.id, resolved);
        await store.audit("account.author-urn.resolved", current.id, { from: current.remoteId, to: resolved });
        current = { ...current, remoteId: resolved };
      }
    } catch {
      // Not fatal: preflight below reports why it could not be verified.
    }
  }

  const readiness = await preflightAccount(current);
  await store.saveReadiness(readiness);
  await store.saveAccount({
    ...current,
    status: current.paused ? "paused" : readiness.canPublish ? "ready" : "limited",
    statusReason: readiness.canPublish
      ? undefined
      : readiness.checks.find((check) => check.id === readiness.blockedBy)?.action,
    lastHealthCheckAt: readiness.checkedAt,
    lastError: readiness.canPublish
      ? undefined
      : readiness.checks.find((check) => check.id === readiness.blockedBy)?.detail,
  });
  return readiness;
}
