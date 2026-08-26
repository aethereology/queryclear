"use client";

export const ANALYTICS_CONSENT_KEY = "queryclear:analytics-consent:v1";

type AnalyticsValue = string | number | boolean | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAnalyticsEvent(
  name: string,
  parameters: Record<string, AnalyticsValue> = {},
) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "granted") return;
  window.gtag?.("event", name, parameters);
}
