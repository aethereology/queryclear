import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { SiteBackground } from "@/components/SiteBackground";
import { site } from "@/lib/site";
import "./globals.css";

const bricolage = localFont({
  src: [
    { path: "./fonts/rz-regular.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

const plexSans = localFont({
  src: [
    { path: "./fonts/hagrid-trial-regular.ttf", weight: "400 700", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
  // Hagrid's own digit glyphs render as broken/overlapping shapes at any size
  // (trial-file glyph corruption, not a style choice) — exclude 0-9 from its
  // coverage so the browser falls through to Plex Mono, which has real glyphs.
  declarations: [
    { prop: "unicode-range", value: "U+0000-002F, U+003A-10FFFF" },
  ],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "modern SEO",
    "AI search optimization",
    "GEO",
    "AI Overviews",
    "answer engine optimization",
    "schema markup",
    "local SEO",
    "service business websites",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  brand: { "@type": "Brand", name: site.name },
  parentOrganization: {
    "@type": "Organization",
    name: site.parentOrg,
    url: site.parentOrgUrl,
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased relative isolate flex min-h-full flex-col overflow-x-hidden`}
      >
        <SiteBackground />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
