"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trackAnalyticsEvent } from "@/lib/analytics";

type Status = "idle" | "submitting" | "error";

const serviceBusinessFields = [
  { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
  {
    name: "website",
    label: "Website URL",
    type: "text",
    required: true,
    placeholder: "yourbusiness.com",
    autoComplete: "url",
    inputMode: "url",
  },
  { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization" },
  { name: "service", label: "Main service", type: "text", required: false, placeholder: "e.g. emergency plumbing" },
  { name: "city", label: "City / market", type: "text", required: false, autoComplete: "address-level2" },
] as const;

const saasFields = [
  { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
  {
    name: "website",
    label: "Company website",
    type: "text",
    required: true,
    placeholder: "company.com",
    autoComplete: "url",
    inputMode: "url",
  },
  { name: "business", label: "Company name", type: "text", required: true, autoComplete: "organization" },
  { name: "service", label: "Product category / use case", type: "text", required: false, placeholder: "e.g. field-service SaaS" },
  { name: "city", label: "Primary markets", type: "text", required: false, placeholder: "e.g. United States and Canada" },
] as const;

// Mirrors the public service-business offers; captured so the intake records
// which offer pulled the inquiry.
export const interestOptions = [
  "AI Search Audit ($497)",
  "Website Upgrade",
  "Modern Search Website Build",
  "AI Search Care Plan",
] as const;

const saasInterestOptions = ["AI Search Operator (early access)"] as const;

export type InterestOption = (typeof interestOptions)[number];
type LeadFormInterest = InterestOption | (typeof saasInterestOptions)[number];

const FIELD_LIMITS: Record<string, number> = { name: 120, email: 254, website: 2048, business: 160, service: 120, city: 120 };

const DEFAULT_NOTE = (
  <>
    No obligation. A real person reads every inquiry and replies — not a sales
    bot. We do not sell your information. Do not send passwords, patient data,
    payment details, or other sensitive information.
  </>
);

export function LeadForm({
  defaultNeed = "",
  submitLabel = "Send my project details",
  note = DEFAULT_NOTE,
  audience = "service-business",
}: {
  defaultNeed?: LeadFormInterest | "";
  submitLabel?: string;
  note?: React.ReactNode;
  audience?: "service-business" | "saas";
}) {
  const router = useRouter();
  // The form can render twice on one page (embedded section + SnapshotCta
  // overlay), so every id/htmlFor must be instance-unique.
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [websiteError, setWebsiteError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status !== "error") return;
    if (websiteError) formRef.current?.querySelector<HTMLInputElement>('input[name="website"]')?.focus();
    else errorRef.current?.focus();
  }, [status, error, websiteError]);
  const fields = audience === "saas" ? saasFields : serviceBusinessFields;
  const displayedInterestOptions = audience === "saas" ? saasInterestOptions : interestOptions;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    setWebsiteError(false);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const websiteInput = String(data.website ?? "").trim();
    const normalizedWebsite = /^[a-z][a-z\d+.-]*:\/\//i.test(websiteInput)
      ? websiteInput
      : `https://${websiteInput}`;
    try {
      const parsedWebsite = new URL(normalizedWebsite);
      if (
        !["http:", "https:"].includes(parsedWebsite.protocol) ||
        !parsedWebsite.hostname ||
        parsedWebsite.username ||
        parsedWebsite.password ||
        parsedWebsite.port
      ) {
        throw new Error("Website must use HTTP or HTTPS.");
      }
      data.website = parsedWebsite.toString();
    } catch {
      setStatus("error");
      setWebsiteError(true);
      setError("Enter a valid website, such as yourbusiness.com.");
      return;
    }
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(25000),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || result?.ok !== true) {
        const message = typeof result?.error === "string" ? result.error : "We could not confirm your request. Your details are still here; please try again.";
        throw new Error(message);
      }
      trackAnalyticsEvent("generate_lead", {
        lead_type: audience,
        interest: String(data.interest ?? "unspecified").slice(0, 80),
      });
      // Single success surface: /thank-you (stable URL for conversion tracking).
      router.push("/thank-you");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error && ["TimeoutError", "AbortError"].includes(err.name)
        ? "The connection timed out before we could confirm receipt. Your details are still here. Check your email before retrying."
        : err instanceof TypeError ? "We could not connect. Check your connection and try again; your details are still here."
        : err instanceof Error ? err.message : "We could not confirm your request. Please try again.");
    }
  }

  return (
    <form ref={formRef} aria-busy={status === "submitting"} onSubmit={onSubmit} className="card p-6 text-ink sm:p-8">
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input
          id={`${uid}-company`}
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
            <label htmlFor={`${uid}-${f.name}`} className="mb-1.5 block text-sm font-medium">
              {f.label}
              {f.required && <span className="text-lime-deep"> *</span>}
            </label>
            <input
              id={`${uid}-${f.name}`}
              name={f.name}
              type={f.type}
              required={f.required}
              maxLength={FIELD_LIMITS[f.name]}
              autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
              inputMode={"inputMode" in f ? f.inputMode : undefined}
              placeholder={"placeholder" in f ? f.placeholder : undefined}
              aria-invalid={websiteError && f.name === "website" ? true : undefined}
              aria-describedby={websiteError && f.name === "website" ? `${uid}-form-status` : undefined}
              className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-interest`} className="mb-1.5 block text-sm font-medium">
            What do you need?
          </label>
          <select
            id={`${uid}-interest`}
            name="interest"
            defaultValue={defaultNeed}
            className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors"
          >
            <option value="">Not sure yet — tell us about your site</option>
            {displayedInterestOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-message`} className="mb-1.5 block text-sm font-medium">
            Anything else?
          </label>
          <textarea
            id={`${uid}-message`}
            name="message"
            rows={3}
            maxLength={2000}
            className="input-halo w-full border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors"
          />
        </div>
      </div>

      {status === "error" && (
        <p ref={errorRef} tabIndex={-1} id={`${uid}-form-status`} role="alert" className="mt-4 text-sm text-red-700">
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
          submitLabel
        )}
      </button>
      <p className="mt-3 text-xs text-muted">{note}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        By submitting, you agree that we may contact you about this request. See our{" "}
        <Link href="/privacy" className="font-medium text-ink underline hover:text-lime-deep">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-medium text-ink underline hover:text-lime-deep">
          Terms of Service
        </Link>
        .
      </p>
    </form>
  );
}
