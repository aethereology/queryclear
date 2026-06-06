import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /reports/* are private per-client deliverables — keep them out of crawlers
    // (belt-and-suspenders with per-page robots:noindex and sitemap exclusion).
    rules: { userAgent: "*", allow: "/", disallow: "/reports/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
