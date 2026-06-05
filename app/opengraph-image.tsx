import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Site-wide social share card. Next.js auto-applies this to openGraph.images
// and twitter.images for any route that doesn't define its own.
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colors mirror app/globals.css (paper / pine / lime).
const PINE = "#0c2a21";
const PAPER = "#f7f4ee";
const LIME = "#b6f03c";
const MUTED = "rgba(247,244,238,0.62)";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PINE,
          color: PAPER,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand lockup: ring with a lime dot at its edge + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 9999,
              border: `5px solid ${PAPER}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: -16,
                width: 22,
                height: 22,
                borderRadius: 9999,
                backgroundColor: LIME,
              }}
            />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {site.name}
          </div>
        </div>

        {/* Headline + supporting line */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            {site.tagline}
          </div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: MUTED }}>
            We make your website easier for AI answer engines to crawl,
            understand, trust, and cite.
          </div>
        </div>

        {/* Footer rail */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: "0.04em",
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 9999, backgroundColor: LIME }} />
          <div style={{ display: "flex" }}>AI Search Optimization · GEO · www.queryclear.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
