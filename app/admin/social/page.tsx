import type { Metadata } from "next";
import { cookies } from "next/headers";
import { csrfForSession, verifyAdminSession } from "@/lib/social/security";
import { socialStore } from "@/lib/social/store";
import type { AccountReadiness, PreflightCheck, SocialAccount, SocialDashboardSnapshot } from "@/lib/social/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Social control room", robots: { index: false, follow: false } };

function AdminForm({
  csrf,
  action,
  target,
  children,
}: {
  csrf: string;
  action: string;
  target?: string;
  children: React.ReactNode;
}) {
  return (
    <form action="/api/social/admin/action" method="post">
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="action" value={action} />
      {target ? <input type="hidden" name="target" value={target} /> : null}
      {children}
    </form>
  );
}

const CHECK_MARK: Record<PreflightCheck["status"], string> = { pass: "✓", fail: "✕", warn: "!", skip: "–" };
const CHECK_STYLE: Record<PreflightCheck["status"], string> = {
  pass: "border-lime-deep bg-lime/20 text-pine-2",
  fail: "border-red-700/40 bg-red-50 text-red-800",
  warn: "border-amber-600/40 bg-amber-50 text-amber-800",
  skip: "border-line bg-paper-2 text-muted",
};

/**
 * One preflight result. A failing check must show what to do about it — the whole point
 * of the panel is that no blocker requires a trip to the platform's error page.
 */
function CheckRow({ check }: { check: PreflightCheck }) {
  return (
    <li className="flex gap-3 border-t border-dashed border-line py-2 first:border-t-0">
      <span
        aria-hidden
        className={`mt-[2px] grid h-5 w-5 shrink-0 place-items-center border font-mono text-[11px] ${CHECK_STYLE[check.status]}`}
      >
        {CHECK_MARK[check.status]}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink">
          <span className="sr-only">{check.status}: </span>
          {check.label}
        </p>
        {check.detail ? <p className="mt-1 break-words text-xs text-muted">{check.detail}</p> : null}
        {check.action ? (
          <p className="mt-1 text-xs text-ink">
            <span className="font-mono uppercase text-[10px] tracking-wider text-muted">next</span> {check.action}
          </p>
        ) : null}
        {check.value ? (
          <code className="mt-1 block w-full select-all overflow-x-auto whitespace-pre bg-paper-2 px-2 py-1 font-mono text-[11px] text-ink">
            {check.value}
          </code>
        ) : null}
        {check.docsUrl ? (
          <a
            href={check.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-mono text-[11px] underline decoration-lime-deep"
          >
            Open platform settings
          </a>
        ) : null}
      </div>
    </li>
  );
}

function AccountCard({
  account,
  csrf,
  readiness,
}: {
  account: SocialAccount;
  csrf: string;
  readiness?: AccountReadiness;
}) {
  const blocked = readiness ? !readiness.canPublish : account.status !== "ready";
  // Only offer Connect when it can actually succeed. An approval-gated scope makes the
  // button a dead end, and clicking it teaches nothing but a platform error page.
  const connectIsFutile = readiness?.blockedBy === "scope" && account.identity === "brand";
  return (
    <article className="border border-dashed border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase text-muted">
            {account.platform} / {account.identity}
          </p>
          <h3 className="mt-1 text-xl">{account.label}</h3>
          {account.remoteId ? (
            <p className="mt-1 break-all font-mono text-[11px] text-muted">{account.remoteId}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 border px-2 py-1 font-mono text-[10px] uppercase ${
            blocked ? "border-red-700/30 bg-red-50 text-red-800" : "border-lime-deep bg-lime/20"
          }`}
        >
          {account.paused ? "paused" : blocked ? "blocked" : "ready"}
        </span>
      </div>

      {readiness ? (
        <ul className="mt-4">
          {readiness.checks.map((check) => (
            <CheckRow key={`${check.id}-${check.label}`} check={check} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 border border-dashed border-line bg-paper-2 p-3 text-sm text-muted">
          {account.statusReason ?? account.lastError ?? "Not checked yet."} Run <strong>Preflight all accounts</strong> to
          see exactly what this account needs.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AdminForm csrf={csrf} action={account.paused ? "account-resume" : "account-pause"} target={account.id}>
          <button className="border border-dashed border-line px-3 py-2 font-mono text-[11px] uppercase">
            {account.paused ? "Resume" : "Pause"}
          </button>
        </AdminForm>
        {connectIsFutile ? (
          <span
            title="The platform must grant the publishing scope before connecting can succeed."
            className="border border-dashed border-line px-3 py-2 font-mono text-[11px] uppercase text-muted"
          >
            Connect blocked — awaiting platform approval
          </span>
        ) : (
          <a
            href={`/api/social/oauth/${account.platform}?identity=${account.identity}`}
            className="border border-dashed border-line px-3 py-2 font-mono text-[11px] uppercase"
          >
            {account.status === "ready" ? "Reconnect" : "Connect OAuth"}
          </a>
        )}
        {readiness ? (
          <span className="font-mono text-[10px] uppercase text-muted">
            checked {new Date(readiness.checkedAt).toLocaleString()}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-dashed border-line bg-paper p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Login({ error }: { error?: string }) {
  const unconfigured = error === "unconfigured";
  return (
    <main className="grid min-h-screen place-items-center bg-pine-2 px-6">
      <form action="/api/social/admin/session" method="post" className="w-full max-w-md border border-dashed border-white/20 bg-paper p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">queryclear // private</p>
        <h1 className="mt-4 text-4xl">Social control room.</h1>
        <p className="mt-3 text-muted">Enter the dedicated social admin secret. It is never shared with cron or platform credentials.</p>
        <label className="mt-8 block font-mono text-xs uppercase tracking-wider" htmlFor="secret">Admin secret</label>
        {/* autoComplete="off": browsers otherwise autofill a saved password for this
            origin (localhost is shared by every local project), silently submitting the
            wrong value and making a correct secret look rejected. */}
        <input
          id="secret"
          name="secret"
          type="password"
          required
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="input-halo mt-2 w-full border border-line bg-white px-4 py-3"
        />
        {unconfigured ? (
          <p className="mt-3 text-sm text-red-700">
            This deployment has no <code className="font-mono text-xs">SOCIAL_ADMIN_SECRET</code> set, so no secret can
            be accepted. Set it in the environment and restart.
          </p>
        ) : error ? (
          <p className="mt-3 text-sm text-red-700">
            That secret was not accepted. If your browser autofilled the field, clear it and type the value manually.
          </p>
        ) : null}
        <button className="btn-hex mt-5 w-full border border-pine-2 bg-lime px-5 py-3 font-mono text-xs uppercase tracking-wider text-pine-2">
          Enter control room
        </button>
      </form>
    </main>
  );
}

function Dashboard({
  snapshot,
  csrf,
  oauthError,
  connected,
}: {
  snapshot: SocialDashboardSnapshot;
  csrf: string;
  oauthError?: string;
  connected?: string;
}) {
  const quarantined = snapshot.actions.filter((action) => action.status === "quarantined");
  const published = snapshot.posts.filter((post) => post.status === "published");
  const queued = snapshot.actions.filter((action) => ["queued", "retryable", "leased"].includes(action.status));
  return (
    <main className="min-h-screen bg-paper-2 px-5 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-7xl">
        {oauthError ? (
          <div role="alert" className="mb-6 border border-dashed border-red-700/40 bg-paper p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-red-800">oauth failed</p>
            <p className="mt-2 break-words text-sm text-ink">{oauthError}</p>
            <p className="mt-2 text-sm text-muted">
              A <span className="font-mono text-xs">scope</span> or{" "}
              <span className="font-mono text-xs">redirect_uri</span> error comes from the platform: the app is
              missing the product that grants that scope, or the registered callback URL does not match this
              deployment. A message naming an environment variable is local — this deployment is missing
              configuration.
            </p>
          </div>
        ) : null}
        {connected === "1" ? (
          <div role="status" className="mb-6 border border-dashed border-lime-deep bg-lime/10 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-pine-2">connected and ready</p>
            <p className="mt-2 text-sm text-ink">
              Token stored, publishing identity resolved from the platform, and every preflight check passed. This
              account can publish.
            </p>
          </div>
        ) : connected === "check" ? (
          <div role="status" className="mb-6 border border-dashed border-amber-600/40 bg-amber-50 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-amber-800">connected, not yet publishable</p>
            <p className="mt-2 text-sm text-ink">
              The token was stored but preflight still found a blocker. The failing check on the account below says
              exactly what it needs.
            </p>
          </div>
        ) : null}
        <header className="flex flex-col gap-5 border-b border-dashed border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">queryclear // autonomous social</p>
            <h1 className="mt-3 text-5xl">Control room.</h1>
            <p className="mt-2 text-muted">Official APIs only. Every external write is logged, capped, and idempotent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminForm csrf={csrf} action={snapshot.settings.globalPaused ? "global-resume" : "global-pause"}>
              <button className={`btn-hex border px-4 py-2 font-mono text-xs uppercase ${snapshot.settings.globalPaused ? "border-pine-2 bg-lime" : "border-red-700 bg-red-50 text-red-800"}`}>
                {snapshot.settings.globalPaused ? "Resume all" : "Pause all"}
              </button>
            </AdminForm>
            <AdminForm csrf={csrf} action="preflight">
              <button className="btn-hex border border-line bg-paper px-4 py-2 font-mono text-xs uppercase">Preflight all accounts</button>
            </AdminForm>
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Mode" value={snapshot.settings.globalPaused ? "Paused" : "Live"} />
          <Stat label="Published" value={published.length} />
          <Stat label="Queue" value={queued.length} />
          <Stat label="Quarantine" value={quarantined.length} />
          <Stat label="Free-audit leads" value={snapshot.conversions.length} />
        </section>

        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div><p className="font-mono text-xs uppercase tracking-wider text-muted">01 // accounts</p><h2 className="mt-2 text-3xl">Connection health</h2></div>
            <p className="font-mono text-xs text-muted">${snapshot.monthSpendUsd.toFixed(2)} / ${snapshot.settings.monthlyBudgetUsd} this month</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {snapshot.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                csrf={csrf}
                readiness={snapshot.readiness[account.id]}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_.7fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">02 // publishing</p>
            <h2 className="mt-2 text-3xl">Recent posts</h2>
            <div className="mt-4 space-y-3">
              {snapshot.posts.slice(0, 20).map((post) => (
                <article key={post.id} className="border border-dashed border-line bg-paper p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] uppercase text-muted">{post.accountId} · {post.status}</p>
                    <time className="font-mono text-[10px] text-muted">{new Date(post.scheduledAt).toLocaleString()}</time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{post.text}</p>
                  {post.policyDecision?.reasons.length ? <p className="mt-3 text-xs text-red-800">{post.policyDecision.reasons.join(" · ")}</p> : null}
                  <div className="mt-3 flex gap-3">
                    {post.permalink ? <a className="font-mono text-xs underline decoration-lime-deep" href={post.permalink} target="_blank" rel="noreferrer">View post</a> : null}
                    {post.status === "published" ? (
                      <AdminForm csrf={csrf} action="delete-post" target={post.id}>
                        <button className="font-mono text-xs text-red-800 underline">Remove owned post</button>
                      </AdminForm>
                    ) : null}
                  </div>
                </article>
              ))}
              {!snapshot.posts.length ? <p className="border border-dashed border-line bg-paper p-5 text-muted">No campaigns have run yet.</p> : null}
            </div>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">03 // policy</p>
            <h2 className="mt-2 text-3xl">Quarantine</h2>
            <div className="mt-4 space-y-3">
              {quarantined.slice(0, 20).map((action) => (
                <article key={action.id} className="border border-dashed border-red-700/30 bg-red-50 p-4">
                  <p className="font-mono text-[11px] uppercase text-red-800">{action.kind} · {action.accountId}</p>
                  <p className="mt-2 text-sm">{action.lastError ?? "Blocked by policy."}</p>
                  <AdminForm csrf={csrf} action="retry" target={action.id}>
                    <button className="mt-3 font-mono text-xs underline">Retry after review</button>
                  </AdminForm>
                </article>
              ))}
              {!quarantined.length ? <p className="border border-dashed border-line bg-paper p-4 text-muted">No quarantined actions.</p> : null}
            </div>

            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-wider text-muted">04 // reddit</p>
              <h2 className="mt-2 text-3xl">Community allowlist</h2>
              <AdminForm csrf={csrf} action="allowlist">
                <textarea name="allowlist" defaultValue={snapshot.settings.redditAllowlist.join(", ")} rows={4} className="input-halo mt-4 w-full border border-line bg-paper p-3 font-mono text-sm" />
                <button className="btn-hex mt-2 border border-pine-2 bg-lime px-4 py-2 font-mono text-xs uppercase">Save allowlist</button>
              </AdminForm>
            </div>
          </div>
        </section>

        <section className="mt-10 pb-12">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">05 // immutable log</p>
          <div className="mt-3 overflow-x-auto border border-dashed border-line bg-pine-2 text-paper">
            <table className="w-full min-w-[700px] text-left font-mono text-xs">
              <thead><tr className="border-b border-dashed border-white/20 text-lime"><th className="p-3">Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
              <tbody>{snapshot.auditLog.slice(0, 50).map((entry) => <tr key={entry.id} className="border-b border-dashed border-white/10"><td className="p-3">{entry.at}</td><td>{entry.actor}</td><td>{entry.action}</td><td>{entry.target ?? "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function SocialAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("social_admin")?.value;
  const query = await searchParams;
  if (!verifyAdminSession(session)) {
    const loginError = Array.isArray(query.login_error) ? query.login_error[0] : query.login_error;
    return <Login error={loginError} />;
  }
  let snapshot: SocialDashboardSnapshot | null = null;
  let loadError: unknown;
  try {
    snapshot = await socialStore().dashboard();
  } catch (error) {
    loadError = error;
  }
  if (!snapshot) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper-2 p-8">
        <div className="max-w-xl border border-dashed border-red-700/40 bg-paper p-8">
          <p className="font-mono text-xs uppercase text-red-800">configuration required</p>
          <h1 className="mt-3 text-4xl">The control room needs Redis.</h1>
          <p className="mt-4 text-muted">{loadError instanceof Error ? loadError.message : "Social storage is unavailable."}</p>
        </div>
      </main>
    );
  }
  const oauthError = Array.isArray(query.oauth_error) ? query.oauth_error[0] : query.oauth_error;
  return (
    <Dashboard
      snapshot={snapshot}
      csrf={csrfForSession(session!)}
      oauthError={oauthError}
      connected={Array.isArray(query.connected) ? query.connected[0] : query.connected}
    />
  );
}
