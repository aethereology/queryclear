"use client";

export const ANALYTICS_CONSENT_KEY = "queryclear:analytics-consent:v1";

export function isPrivateAnalyticsPath(pathname: string): boolean {
  return /^\/(?:r|reports|admin|outreach)(?:\/|$)/.test(pathname) || pathname === "/ai-visibility-audit/success";
}

export function readAnalyticsConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch { return null; }
}

type AnalyticsValue = string | number | boolean | undefined;

declare global {
  interface Window {
    [key: `ga-disable-${string}`]: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAnalyticsEvent(
  name: string,
  parameters: Record<string, AnalyticsValue> = {},
) {
  if (typeof window === "undefined") return;
  try {
    if (isPrivateAnalyticsPath(window.location.pathname) || readAnalyticsConsent() !== "granted") return;
    window.gtag?.("event", name, parameters);
  } catch {
    // Privacy settings or a blocked analytics script must never break a form.
  }
}
