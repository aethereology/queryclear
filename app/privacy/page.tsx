import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How queryclear collects, uses, discloses, secures, and retains inquiry, audit, client, payment, and business-contact information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — queryclear",
    description: "How queryclear handles website, audit, client, and business-contact information.",
  },
};

const LAST_UPDATED = "August 25, 2026";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${site.url}/privacy` },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy",
  url: `${site.url}/privacy`,
  description: "How queryclear handles personal and business information.",
  isPartOf: { "@id": site.schemaIds.website },
  publisher: { "@id": site.schemaIds.organization },
  dateModified: site.legal.privacyVersion,
};

export default function PrivacyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="privacy">Privacy</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-sm text-muted">
              Version {site.legal.privacyVersion} · Last updated: {LAST_UPDATED}
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="prose-legal max-w-3xl space-y-10 leading-relaxed text-muted">
            <div>
              <h2 className="text-2xl text-ink">1. Who operates queryclear</h2>
              <p className="mt-3">
                {site.legal.relationship} In this policy, “queryclear,” “we,” “us,”
                and “our” refer to {site.legal.operator}. Our mailing address is{" "}
                {site.legal.address.street}, {site.legal.address.city},{" "}
                {site.legal.address.region} {site.legal.address.postalCode}, United States.
                Questions or requests may be sent to{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">2. Information we collect</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-ink">Inquiry and account information:</strong>{" "}
                  name, work email, company, website, requested service, market,
                  message, preferences, approvals, and correspondence.
                </li>
                <li>
                  <strong className="text-ink">Audit and delivery information:</strong>{" "}
                  submitted domains, publicly available page content, crawl and
                  technical findings, prompts, answer samples, report content,
                  implementation notes, client-provided source material, and project records.
                </li>
                <li>
                  <strong className="text-ink">Payment and transaction information:</strong>{" "}
                  product, amount, payment status, billing contact, Stripe customer or
                  subscription identifiers, refunds, disputes, and consent records.
                  Stripe processes full payment-card details; queryclear does not store them.
                </li>
                <li>
                  <strong className="text-ink">Technical and engagement information:</strong>{" "}
                  IP address, request headers, device/browser information, requested
                  path, time, referring or campaign parameters, security and rate-limit
                  events, form state, report-view events, email delivery, replies,
                  bounces, complaints, and opt-outs.
                </li>
                <li>
                  <strong className="text-ink">Business-contact information:</strong>{" "}
                  business name, professional role, public business email or phone,
                  website, location, source URL, outreach status, and interaction
                  history obtained from public business sources or service providers.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl text-ink">3. How we use information</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>provide previews, audits, reports, implementation, support, and requested services;</li>
                <li>verify scope, business facts, access, eligibility, approvals, and deliverables;</li>
                <li>process payments, credits, renewals, cancellations, refunds, disputes, and accounting records;</li>
                <li>respond to inquiries and send transactional or service communications;</li>
                <li>measure and improve service reliability, accessibility, security, and conversion paths;</li>
                <li>detect abuse, enforce limits, investigate incidents, and protect our systems and users;</li>
                <li>conduct lawful business-to-business marketing using relevant public professional contact information;</li>
                <li>comply with law, contracts, tax/accounting duties, and valid legal requests.</li>
              </ul>
              <p className="mt-3">
                We do not sell personal information or provide it to third parties for
                their independent consumer advertising. We do not use submitted client
                materials to create a public case study without written permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">4. Automated audits and AI providers</h2>
              <p className="mt-3">
                A public audit may retrieve publicly accessible content from the URL
                you submit and send limited page content, technical findings, prompts,
                and instructions to our audit runtime and AI service providers. Results
                may include automated or modeled analysis and are labeled on the relevant
                product. Do not submit a URL containing credentials, access tokens,
                personal records, confidential data, or private staging information.
              </p>
              <p className="mt-3">
                Paid work may use human review and configured search or AI tools as
                described in the applicable scope. We require providers to process
                data for our service, but their infrastructure may operate in other
                jurisdictions and is subject to their security and retention controls.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">5. Service providers and disclosures</h2>
              <p className="mt-3">
                We disclose information to providers only as reasonably necessary for
                their role. Current categories and principal providers include:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Cloudflare and Vercel for network delivery, hosting, logs, and security;</li>
                <li>Upstash for rate limiting, queues, caches, reports, and operational records;</li>
                <li>OpenAI and configured audit-runtime providers for automated analysis;</li>
                <li>Resend and Microsoft 365/Graph for email delivery, routing, replies, and outreach operations;</li>
                <li>Stripe for checkout, billing, subscriptions, refunds, and payment records;</li>
                <li>Apify and public business sources for permitted business research and contact-data collection;</li>
                <li>Google Search Console, Google Analytics, and Bing Webmaster Tools when a client authorizes those integrations.</li>
              </ul>
              <p className="mt-3">
                We may also disclose information to professional advisers, auditors,
                insurers, regulators, courts, law enforcement, or a successor in a
                merger or asset transaction when legally permitted and reasonably necessary.
              </p>
            </div>

            <div id="analytics" className="scroll-mt-24">
              <h2 className="text-2xl text-ink">6. Cookies and analytics</h2>
              <p className="mt-3">
                The queryclear site may use strictly necessary storage for security,
                session, form, checkout, and administrative functions. Stripe and
                other linked services may set cookies on their own pages. At this
                policy version, queryclear does not use third-party advertising cookies.
                If a Google Analytics measurement ID is configured, analytics remains
                off until you accept the on-site control. You can decline or reopen
                Analytics preferences from the footer. We configure analytics events
                without form values, email addresses, or submitted website URLs.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">7. Retention</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Transient public-audit caches ordinarily expire within 24 hours.</li>
                <li>Declined, abandoned, or non-client inquiry records are retained for up to 24 months.</li>
                <li>Active client, contract, consent, invoice, payment, and transaction records may be retained for 7 years for legal, tax, accounting, dispute, and recordkeeping needs.</li>
                <li>B2B outreach activity is retained for up to 18 months after the last interaction.</li>
                <li>A minimal suppression record may be retained as long as necessary to honor an opt-out and prevent future contact.</li>
              </ul>
              <p className="mt-3">
                We may keep information longer when required by law, a dispute, a
                security investigation, or a documented legal hold. We may delete or
                de-identify information sooner when it is no longer needed.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">8. Your choices and rights</h2>
              <p className="mt-3">
                You may ask to access, correct, or delete information you provided,
                object to or limit certain processing, or request a portable copy where
                applicable. We may verify identity and retain information that law or
                legitimate recordkeeping requires. Email{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>{" "}
                with “Privacy request” in the subject.
              </p>
              <p className="mt-3">
                Transactional messages about a request, purchase, security event, or
                active service are not marketing. To stop marketing, use the included
                unsubscribe method or reply “unsubscribe.” We maintain the minimal
                suppression record needed to respect that choice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">9. Security and sensitive information</h2>
              <p className="mt-3">
                We use administrative, technical, and organizational safeguards
                appropriate to the service, but no internet system is risk-free. Do
                not submit passwords, payment-card details, government identifiers,
                medical records, protected health information, customer lists, source
                code, or other sensitive or confidential information through a public form.
                Secure transfer and access procedures must be agreed separately for paid work.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">10. Children, geography, and changes</h2>
              <p className="mt-3">
                queryclear is a business service and is not directed to children under
                13. Services are marketed to United States businesses. Information may
                be processed in the United States and other locations used by our providers.
              </p>
              <p className="mt-3">
                We may update this policy as the service, providers, or law changes.
                The version and date above identify the policy in effect. Material
                changes affecting an active paid service may also be communicated directly.
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
