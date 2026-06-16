import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Every public route belongs here AND in app/llms.txt/route.ts.
// Deliberate exceptions: /thank-you (noindex post-conversion page) and
// /reports/* (private client reports, noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/ai-visibility-audit`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/ai-search-operator`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/ai-visibility-stack`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/audit`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/scorecard`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/local-ai-search-optimization`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/med-spa-ai-search-optimization`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/geo-audit`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/ai-search-ready-website`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/schema-for-ai-search`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/llms-txt-for-businesses`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/stack-kit`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${site.url}/contact`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${site.url}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${site.url}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
