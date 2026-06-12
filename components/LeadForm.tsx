"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "submitting" | "error";

const fields = [
  { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
  {
    name: "website",
    label: "Website URL",
    type: "url",
    required: true,
    placeholder: "https://",
    defaultValue: "https://",
    autoComplete: "url",
  },
  { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization" },
  { name: "service", label: "Main service", type: "text", required: false, placeholder: "e.g. emergency plumbing" },
  { name: "city", label: "City / market", type: "text", required: false, autoComplete: "address-level2" },
] as const;

// Mirrors site.offers; captured so the intake records which offer pulled them.
const interestOptions = [
  "Free AI Search Snapshot",
  "AI Search Audit ($497)",
  "Website Upgrade",
  "Modern Search Website Build",
] as const;

export function LeadForm() {
  const router = useRouter();
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
      // Single success surface: /thank-you (stable URL for conversion tracking).
      router.push("/thank-you");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 text-ink sm:p-8">
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

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
              defaultValue={"defaultValue" in f ? f.defaultValue : undefined}
              className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="interest" className="mb-1.5 block text-sm font-medium">
            What do you need?
          </label>
          <select
            id="interest"
            name="interest"
            defaultValue=""
            className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors"
          >
            <option value="">Not sure yet — start with the free Snapshot</option>
            {interestOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
            Anything else?
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors"
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
        className="btn-hex mt-6 inline-flex w-full items-center justify-center gap-2 border border-lime bg-lime px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2"
            />
            Sending…
          </>
        ) : (
          "Request my free Snapshot"
        )}
      </button>
      <p className="mt-3 text-xs text-muted">
        Free, no obligation. We&apos;ll send a plain-English review — not a
        sales bot. By submitting, you agree to be contacted about your request.
        We do not sell your information.
      </p>
    </form>
  );
}
