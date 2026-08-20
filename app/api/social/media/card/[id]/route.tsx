import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { socialStore } from "@/lib/social/store";

export const runtime = "nodejs";

const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "brand", "queryclear-logo.png"),
).toString("base64")}`;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = socialStore();
  const asset = await store.getMedia(id);
  if (!asset || asset.kind !== "card") return new Response("Not found", { status: 404 });
  const campaign = await store.getCampaign(asset.campaignId);
  if (!campaign) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f4ee",
          color: "#17180f",
          padding: 82,
          border: "20px solid #12352a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: "#12352a" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} width={260} height={50} alt="" />
          <span>{"// modern search"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ fontSize: 28, textTransform: "uppercase", letterSpacing: 4, color: "#5b5a4d" }}>
            {campaign.category.replace("-", " ")}
          </div>
          <div style={{ fontSize: 70, lineHeight: 1.05, fontWeight: 700, maxWidth: 970 }}>{campaign.topic}</div>
          <div style={{ width: 180, height: 10, background: "#b6f03c" }} />
        </div>
        <div style={{ fontSize: 26, color: "#5b5a4d" }}>Clearer sites. Better answers. Measured honestly.</div>
      </div>
    ),
    { width: 1200, height: 1200 },
  );
}
