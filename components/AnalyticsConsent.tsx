"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_KEY, isPrivateAnalyticsPath, readAnalyticsConsent } from "@/lib/analytics";

const PREFERENCES_EVENT = "queryclear:open-analytics-preferences";
type Consent = "granted" | "denied" | null;
const subscribeToMount = () => () => undefined;

function validMeasurementId(value: string | undefined) {
  return value && /^G-[A-Z0-9]{6,20}$/i.test(value) ? value : null;
}

export function AnalyticsConsent({ measurementId }: { measurementId?: string }) {
  const id = validMeasurementId(measurementId);
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(readAnalyticsConsent);
  const privatePage = isPrivateAnalyticsPath(pathname);
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const open = () => setPreferencesOpen(true);
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    window[`ga-disable-${id}`] = privatePage || consent !== "granted";
    if (privatePage || consent !== "granted") return;
    try {
    window.dataLayer ??= [];
    window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    if (!document.getElementById("queryclear-ga4")) {
      const script = document.createElement("script");
      script.id = "queryclear-ga4";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: `${window.location.origin}${pathname}`,
      page_title: document.title,
    });
    } catch { /* Analytics availability must never affect the application. */ }
  }, [consent, id, pathname, privatePage]);

  if (privatePage || !id || !mounted || (consent !== null && !preferencesOpen)) return null;

  function choose(value: Exclude<Consent, null>) {
    try { window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value); } catch { /* Keep the choice in memory when storage is blocked. */ }
    setConsent(value);
    setPreferencesOpen(false);
    if (value === "denied") {
      try { window.gtag?.("consent", "update", { analytics_storage: "denied" }); } catch { /* Best effort. */ }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Analytics preferences"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6"
    >
      <p className="font-medium text-ink">Optional analytics</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        With your permission, we use Google Analytics to measure page use and
        completed conversion steps. It stays off until you accept, and our event
        payloads exclude form values, email addresses, and website URLs.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => choose("granted")}
          className="btn-hex border border-lime bg-lime px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-pine-2"
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          className="border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink hover:border-lime"
        >
          Decline
        </button>
        <a href="/privacy#analytics" className="self-center text-xs text-muted underline hover:text-ink">
          Learn more
        </a>
      </div>
    </div>
  );
}

export function AnalyticsPreferencesButton({ measurementId }: { measurementId?: string }) {
  if (!validMeasurementId(measurementId)) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(PREFERENCES_EVENT))}
      className="text-left text-paper/80 hover:text-lime"
    >
      Analytics preferences
    </button>
  );
}
