import { cookies } from "next/headers";
import Link from "next/link";
import { verifyAdminSession, csrfForSession } from "@/lib/social/security";
import { OwnerAuditConsole } from "@/components/OwnerAuditConsole";
export const dynamic = "force-dynamic";
export const metadata = { title: "Owner audit console | QueryClear", robots: { index: false, follow: false } };
export default async function OwnerAudits({ searchParams }: { searchParams: Promise<{ login_error?: string }> }) {
  const loginError = (await searchParams).login_error;
  const configured = (process.env.SOCIAL_ADMIN_SECRET?.length ?? 0) >= 32;
  const session = (await cookies()).get("social_admin")?.value ?? "";
  return <main id="main-content" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/" className="font-semibold">QueryClear</Link><span className="font-mono text-xs uppercase tracking-widest text-muted">Owner workspace</span></div>
    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your audit workspace.</h1>
    <p className="mt-4 max-w-2xl text-muted">Run a website audit, review the evidence, and turn findings into a clear action plan.</p>
    {verifyAdminSession(session) ? <OwnerAuditConsole csrf={csrfForSession(session)} /> : <section className="card mt-10 max-w-xl p-6 sm:p-8" aria-labelledby="access-title">
      <h2 id="access-title" className="text-2xl font-semibold">Owner access required</h2>
      {configured ? <form action="/api/social/admin/session?returnTo=audits" method="post" className="mt-5 space-y-4">
        <label htmlFor="owner-secret" className="block font-medium">Administrator credential</label>
        <input id="owner-secret" name="secret" type="password" autoComplete="current-password" required className="w-full rounded border border-line bg-paper px-4 py-3" />
        <button className="rounded bg-ink px-5 py-3 text-paper">Sign in</button>
        {loginError && <p role="alert">Sign-in could not be completed. Check your credential or try again later.</p>}
      </form> : <p className="mt-4 text-muted">Owner access is not configured yet. Your site administrator must enable it securely before you can sign in.</p>}
      <p className="mt-4 text-sm text-muted">This workspace is for the site owner. Customer accounts are not enabled.</p>
    </section>}
  </main>;
}
