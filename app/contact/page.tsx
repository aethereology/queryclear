import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with queryclear or request a free AI Search Snapshot. Email us or send your site details and we'll review how modern search sees your business.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact queryclear",
    description:
      "Email us or request a free AI Search Snapshot. We reply with a real review, not a sales bot.",
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact queryclear",
  url: `${site.url}/contact`,
  description:
    "Contact queryclear or request a free AI Search Snapshot.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const orgContactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  email: site.email,
  parentOrganization: { "@type": "Organization", name: site.parentOrg, url: site.parentOrgUrl },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: site.email,
    availableLanguage: "English",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${site.url}/contact` },
  ],
};

const details = [
  { label: "Email", value: site.email, href: `mailto:${site.email}` },
  { label: "Company", value: "A SparkCreatives Inc. brand.", href: site.parentOrgUrl },
  { label: "Where we work", value: "Remote — we work with businesses online, wherever you are." },
  { label: "Response time", value: "We reply within a couple of business days, usually sooner." },
];

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgContactSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="contact">Get in touch</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              Tell us about your site. We&apos;ll tell you how modern search sees it.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              The fastest way to start is to request a free AI Search Snapshot below.
              Prefer email? Reach us any time at{" "}
              <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                {site.email}
              </a>
              . A real person replies — not a sales bot.
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-start">
            {/* Details */}
            <div>
              <h2 className="text-2xl sm:text-3xl">How to reach us</h2>
              <dl className="mt-8 grid gap-6">
                {details.map((d) => (
                  <div key={d.label} className="border-b border-line pb-5">
                    <dt className="mono-label">{d.label}</dt>
                    <dd className="mt-2 text-ink">
                      {d.href ? (
                        <a href={d.href} className="underline hover:text-lime-deep">
                          {d.value}
                        </a>
                      ) : (
                        d.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-xs leading-relaxed text-muted">
                We use the details you send only to prepare and deliver your
                Snapshot or audit and to reply to you. We don&apos;t sell or
                share them. See our{" "}
                <a href="/privacy" className="underline hover:text-ink">privacy policy</a>.
                We don&apos;t guarantee rankings or AI citations.
              </p>
            </div>

            {/* Form */}
            <div id="audit-cta" className="scroll-mt-20">
              <h2 className="mb-4 text-2xl sm:text-3xl">Request a free Snapshot</h2>
              <LeadForm />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
