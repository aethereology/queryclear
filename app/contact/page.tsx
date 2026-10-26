import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact queryclear about a website audit, fixed-scope upgrade, new website build, or Care Plan eligibility.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact queryclear",
    description:
      "Email us or send a website inquiry. We reply with a real review, not a sales bot.",
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact queryclear",
  url: `${site.url}/contact`,
  description:
    "Contact queryclear about a website upgrade, a new build, or an audit.",
  isPartOf: { "@id": site.schemaIds.website },
};

const orgContactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": site.schemaIds.organization,
  name: site.legal.operator,
  legalName: site.legal.operator,
  url: site.parentOrgUrl,
  brand: { "@id": site.schemaIds.brand },
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.legal.address.street,
    addressLocality: site.legal.address.city,
    addressRegion: site.legal.address.region,
    postalCode: site.legal.address.postalCode,
    addressCountry: site.legal.address.country,
  },
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
  { label: "Lead operator", value: `${site.founder.name}, ${site.founder.role}` },
  { label: "Legal operator", value: site.legal.operator, href: site.parentOrgUrl },
  { label: "Business address", value: `${site.legal.address.street}, ${site.legal.address.city}, ${site.legal.address.region} ${site.legal.address.postalCode}` },
  { label: "Where we work", value: "Remote delivery for United States businesses." },
  { label: "Response time", value: "We reply within one business day." },
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
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="contact">Get in touch</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              A clearer website starts with a conversation.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Tell us about your site below and what you&apos;re after — an
              upgrade, a new build, or an audit. Want a free read first?{" "}
              <a href="/free-audit" className="font-medium text-ink underline hover:text-lime-deep">
                Run a free readiness preview
              </a>
              . Prefer email? Reach us any time at{" "}
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
                We use the details you send to evaluate and respond to your request,
                operate the service, and maintain required records. We use the
                service providers disclosed in our policy and do not sell your
                information for third-party marketing. Do not send passwords,
                patient data, payment details, or other sensitive information. See our{" "}
                <a href="/privacy" className="underline hover:text-ink">privacy policy</a>.
                We don&apos;t guarantee rankings or AI citations.
              </p>
            </div>

            {/* Form */}
            <div id="audit-cta" className="scroll-mt-20">
              <h2 className="mb-4 text-2xl sm:text-3xl">Tell us about your site</h2>
              <LeadForm />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
