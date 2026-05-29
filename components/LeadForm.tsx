"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const fields = [
  { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
  { name: "website", label: "Website URL", type: "url", required: true, placeholder: "https://", autoComplete: "url" },
  { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization" },
  { name: "service", label: "Main service", type: "text", required: false, placeholder: "e.g. emergency plumbing" },
  { name: "city", label: "City / market", type: "text", required: false, autoComplete: "address-level2" },
] as const;

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="card grid-texture flex flex-col items-start gap-3 p-8 text-ink"
      >
        <p className="mono-label text-lime-deep">[ received ]</p>
        <h3 className="text-2xl">Thanks — your audit request is in.</h3>
        <p className="text-muted">
          We&apos;ll review your site and reply with your free AI search audit.
          No spam, no obligation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 text-ink sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className={f.name === "service" || f.name === "city" ? "" : "sm:col-span-1"}
          >
            <label htmlFor={f.name} className="mb-1.5 block text-sm font-medium">
              {f.label}
              {f.required && <span className="text-lime-deep"> *</span>}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type}
              required={f.required}
              autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
              placeholder={"placeholder" in f ? f.placeholder : undefined}
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-pine"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
            Anything else?
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-pine"
          />
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-pine-2 transition-colors hover:bg-lime-deep disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Book my free AI search audit"}
      </button>
      <p className="mt-3 text-xs text-muted">
        Free, no obligation. We reply with a real audit, not a sales bot.
      </p>
    </form>
  );
}
