import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteBackground } from "@/components/SiteBackground";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";
import { site } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
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
  icons: {
    icon: "/icon.svg",
  },
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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": site.schemaIds.organization,
      name: site.legal.operator,
      legalName: site.legal.operator,
      url: site.parentOrgUrl,
      taxID: site.legal.taxId,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.legal.address.street,
        addressLocality: site.legal.address.city,
        addressRegion: site.legal.address.region,
        postalCode: site.legal.address.postalCode,
        addressCountry: site.legal.address.country,
      },
      brand: { "@id": site.schemaIds.brand },
    },
    {
      "@type": "Brand",
      "@id": site.schemaIds.brand,
      name: site.name,
      url: site.url,
      description: site.description,
      logo: `${site.url}/brand/queryclear-logo.svg`,
    },
    {
      "@type": "WebSite",
      "@id": site.schemaIds.website,
      name: site.name,
      url: site.url,
      description: site.description,
      publisher: { "@id": site.schemaIds.organization },
      about: { "@id": site.schemaIds.brand },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          {children}
        </div>
        <AnalyticsConsent measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
