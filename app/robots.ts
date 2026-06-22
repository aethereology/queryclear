import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /reports/* (private client deliverables), /outreach (founder-only console),
    // and /r/* (per-prospect pre-unlocked outreach reports) stay out of crawlers
    // (belt-and-suspenders with per-page robots:noindex and sitemap exclusion).
    rules: { userAgent: "*", allow: "/", disallow: ["/reports/", "/outreach", "/r/"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
