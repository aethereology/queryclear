"use client";

import { useState } from "react";
import { MonoLabel } from "@/components/ui";

const BTN =
  "btn-hex inline-flex items-center justify-center gap-2 border border-lime bg-lime px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime disabled:opacity-70";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 border border-line bg-paper px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-ink hover:border-pine-2 focus-visible:border-pine-2 disabled:opacity-70";
const INPUT =
  "input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2"
    />
  );
}

type Mode = "preview" | "send";

export function OutreachConsole() {
  const [secret, setSecret] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function run(mode: Mode) {
    setBusy(mode);
    setError(null);
    setSentTo(null);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: secret.trim(),
          domainUrl: domainUrl.trim(),
          email: email.trim(),
          businessName: businessName.trim() || undefined,
          mode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        subject?: string;
        html?: string;
        sent?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      if (mode === "preview") {
        setSubject(data.subject ?? null);
        setPreviewHtml(data.html ?? "");
      } else {
        setSentTo(email.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("preview");
        }}
        className="card p-6 sm:p-8"
      >
        <MonoLabel index="auth">Founder access</MonoLabel>
        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="oc-secret" className="mb-1.5 block text-sm font-medium">
              Outreach secret <span className="text-lime-deep">*</span>
            </label>
            <input
              id="oc-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              autoComplete="off"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="oc-domain" className="mb-1.5 block text-sm font-medium">
              Prospect website <span className="text-lime-deep">*</span>
            </label>
            <input
              id="oc-domain"
              value={domainUrl}
              onChange={(e) => setDomainUrl(e.target.value)}
              placeholder="prospect.com"
              required
              autoComplete="off"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="oc-email" className="mb-1.5 block text-sm font-medium">
              Recipient email{" "}
              <span className="font-normal text-muted">(required to send)</span>
            </label>
            <input
              id="oc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@prospect.com"
              autoComplete="off"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="oc-business" className="mb-1.5 block text-sm font-medium">
              Business name <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="oc-business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Med Spa"
              autoComplete="off"
              className={INPUT}
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={busy !== null} className={`${BTN_GHOST} sm:w-auto`}>
            {busy === "preview" ? (
              <>
                <Spinner /> Building…
              </>
            ) : (
              "Preview email"
            )}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("send")}
            className={`${BTN} sm:w-auto`}
          >
            {busy === "send" ? (
              <>
                <Spinner /> Sending…
              </>
            ) : (
              "Send for real"
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Preview runs the audit and renders the email without sending. Send runs the audit and
          emails the recipient via Resend.
        </p>
      </form>

      {error ? (
        <p role="alert" className="card p-5 text-sm text-ink">
          <span className="font-medium text-lime-deep">Error: </span>
          {error}
        </p>
      ) : null}

      {sentTo ? (
        <div className="card card-marker p-6 text-sm text-ink sm:p-8">
          <MonoLabel index="sent">Delivered</MonoLabel>
          <p className="mt-3">Cold-outreach audit sent to {sentTo}.</p>
        </div>
      ) : null}

      {previewHtml !== null ? (
        <div className="card p-6 sm:p-8">
          <MonoLabel index="preview">Email preview</MonoLabel>
          {subject ? (
            <p className="mt-3 text-sm text-muted">
              Subject: <span className="text-ink">{subject}</span>
            </p>
          ) : null}
          <iframe
            title="Outreach email preview"
            srcDoc={previewHtml}
            className="mt-4 h-[760px] w-full border border-line bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}
