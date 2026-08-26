"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { site } from "@/lib/site";
import { trackAnalyticsEvent } from "@/lib/analytics";

// Starts a Stripe Checkout session for a given product and redirects to it.
// Mirrors PreorderButton but is product-parameterized (POSTs { product }).
export function CheckoutButton({
  product,
  label,
  variant = "primary",
  className = "",
}: {
  product: string;
  label: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const termsId = useId();
  const requestIdRef = useRef<string | null>(null);

  async function startCheckout() {
    requestIdRef.current ??= globalThis.crypto.randomUUID();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          termsAccepted: true,
          termsVersion: site.legal.termsVersion,
          requestId: requestIdRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Couldn't start checkout.");
      }
      trackAnalyticsEvent("begin_checkout", { product });
      window.location.href = data.url;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
    }
  }

  // Class strings mirror <Cta> in components/ui.tsx — keep in sync.
  const base =
    "btn-hex group inline-flex items-center justify-center gap-2 border px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider disabled:opacity-70";
  const styles =
    variant === "primary"
      ? "border-lime bg-lime text-pine-2 hover:border-pine-2 hover:bg-pine-2 hover:text-lime active:border-pine-2 active:bg-pine-2 active:text-lime focus-visible:border-pine-2 focus-visible:bg-pine-2 focus-visible:text-lime"
      : "border-line bg-transparent text-ink hover:border-lime hover:bg-lime hover:text-pine-2 active:border-lime active:bg-lime active:text-pine-2 focus-visible:border-lime focus-visible:bg-lime focus-visible:text-pine-2";

  return (
    <div className={className}>
      <label htmlFor={termsId} className="mb-3 flex max-w-xl items-start gap-2 text-left text-xs leading-relaxed opacity-75">
        <input
          id={termsId}
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-lime-deep"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="underline hover:text-lime-deep">
            Terms of Service
          </Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy" className="underline hover:text-lime-deep">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading || !accepted}
        aria-describedby={!accepted ? `${termsId}-help` : undefined}
        className={`${base} ${styles}`}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-pine-2/40 border-t-pine-2"
            />
            Starting checkout…
          </>
        ) : (
          <>
            {label}
            <span
              aria-hidden="true"
              className="transition-transform duration-100 ease-out group-hover:translate-x-1 group-active:translate-x-1"
            >
              →
            </span>
          </>
        )}
      </button>
      {!accepted && (
        <p id={`${termsId}-help`} className="mt-2 text-xs opacity-70">
          Check the box above to continue to secure checkout.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
