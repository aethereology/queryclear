import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/lib/site";

export const runtime = "nodejs";

// Site-wide social share card. Next.js auto-applies this to openGraph.images
// and twitter.images for any route that doesn't define its own.
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colors mirror app/globals.css (paper / pine / lime).
const PINE = "#102f26";
const PAPER = "#fafbf8";
const LIME = "#d2ed82";
const MUTED = "rgba(247,244,238,0.62)";
const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "brand", "queryclear-logo-light.png"),
).toString("base64")}`;

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
        {/* Brand lockup: open Q / query field + wordmark */}
        <img src={LOGO_DATA_URI} width={340} height={66} alt="" />

        {/* Headline + supporting line */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            {site.tagline}
          </div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: MUTED }}>
            On-page evidence. Clearly labeled modeled scenarios.
            A practical plan for the pages you control.
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
          <div style={{ display: "flex" }}>Website clarity · Evidence · Action · www.queryclear.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
