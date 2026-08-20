"use client";

import { useEffect } from "react";

// A raw GET is a weak engagement signal because corporate email scanners often
// prefetch links. Require a visible, sustained page view before recording the
// open. This is still intentionally best-effort: the report never depends on it.
const MEANINGFUL_VIEW_MS = 10_000;

export function OutreachOpenTracker({ token }: { token: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;

    const signal = () => {
      if (sent) return;
      sent = true;
      void fetch("/api/outreach/report-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        keepalive: true,
      }).catch(() => {
        // Engagement tracking must never interfere with reading the report.
      });
    };

    const arm = () => {
      if (sent || document.visibilityState !== "visible") return;
      timer = setTimeout(signal, MEANINGFUL_VIEW_MS);
    };

    const disarm = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };

    const onVisibilityChange = () => {
      disarm();
      arm();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    arm();
    return () => {
      disarm();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token]);

  return null;
}
