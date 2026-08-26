import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing queryclear's website, automated preview, paid audit, implementation projects, Care Plan, billing, and service limitations.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — queryclear",
    description: "Terms for queryclear's website, audits, projects, maintenance, and billing.",
  },
};

const LAST_UPDATED = "August 25, 2026";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${site.url}/terms` },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service",
  url: `${site.url}/terms`,
  description: "Terms for using queryclear's website and services.",
  isPartOf: { "@id": site.schemaIds.website },
  publisher: { "@id": site.schemaIds.organization },
  dateModified: site.legal.termsVersion,
};

export default function TermsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="terms">Terms</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-sm text-muted">
              Version {site.legal.termsVersion} · Last updated: {LAST_UPDATED}
            </p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-3xl space-y-10 leading-relaxed text-muted">
            <div>
              <h2 className="text-2xl text-ink">1. Operator and acceptance</h2>
              <p className="mt-3">
                {site.legal.relationship} “queryclear,” “we,” “us,” and “our” refer
                to {site.legal.operator}. Our mailing address is {site.legal.address.street},{" "}
                {site.legal.address.city}, {site.legal.address.region} {site.legal.address.postalCode}.
                {" "}{site.legal.serviceFeeNotice}
              </p>
              <p className="mt-3">
                These terms apply to the queryclear website, automated previews,
                paid audits, projects, subscriptions, and related communications.
                By using the site you agree to the website provisions. By checking
                the acceptance box and purchasing, or by signing a statement of work
                (“SOW”), you agree to the applicable commercial provisions and our{" "}
                <a href="/privacy" className="font-medium text-ink underline hover:text-lime-deep">Privacy Policy</a>.
              </p>
              <p className="mt-3">
                Services are offered to business customers. You represent that you
                are at least 18, have authority to act for the business, and may
                lawfully submit the website, materials, accounts, and instructions involved.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">2. Website and acceptable use</h2>
              <p className="mt-3">You may use the site only for lawful business purposes. You may not:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>attempt to access private systems, credentials, reports, administrative areas, or data without authorization;</li>
                <li>submit malware, abusive traffic, private-network targets, credentialed URLs, or content that infringes another person’s rights;</li>
                <li>circumvent rate limits, security controls, eligibility checks, or payment requirements;</li>
                <li>misrepresent identity, authority, business facts, reviews, credentials, locations, claims, or source material;</li>
                <li>use an audit or report to harass, deceive, unlawfully profile, or make unsupported claims about another business.</li>
              </ul>
              <p className="mt-3">
                We may block, suspend, or investigate activity that threatens the
                service, providers, customers, or third parties.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">3. Free automated readiness preview</h2>
              <p className="mt-3">
                The free product is an automated, read-only readiness preview of
                publicly accessible material. It may use one or more crawlers, rules,
                automated models, caches, and sample prompts. It is point-in-time,
                incomplete, and may contain errors. Modeled or sampled results are
                not represented as verified output from every named search or AI engine.
              </p>
              <p className="mt-3">
                The preview is informational and is not a comprehensive SEO,
                accessibility, security, privacy, legal, medical, or regulatory audit.
                It does not include implementation, support, or a promise to retain a report.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">4. $497 AI Search Audit</h2>
              <p className="mt-3">Unless a written order says otherwise, the fixed audit includes:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>one public website and up to {site.auditProduct.pageLimit} public URLs;</li>
                <li>up to {site.auditProduct.promptLimit} total prompt-engine observations distributed across up to {site.auditProduct.engineLimit} named engines selected at kickoff;</li>
                <li>seven-layer evidence-linked scoring, technical findings, labeled answer samples, and a prioritized roadmap;</li>
                <li>delivery within 7 business days after complete intake;</li>
                <li>one {site.auditProduct.walkthroughMinutes}-minute walkthrough and one factual-correction round.</li>
              </ul>
              <p className="mt-3">
                Each prompt × engine check consumes one observation; for example,
                checking the same prompt in three engines uses three observations.
                Answer samples identify the engine, prompt, date, and access method
                and distinguish live, modeled, and manually observed results where
                applicable. The audit does not include website edits, private or
                login-gated systems, additional domains, or the exclusions stated on
                the product page.
              </p>
              <p className="mt-3">
                The $497 fee may be credited once toward a Website Upgrade or Website
                Build of ${site.auditProduct.creditMinimumImplementationUsd.toLocaleString()} or more for the
                same site if the implementation SOW is signed within {site.auditProduct.creditDays} days
                after report delivery. The credit is not cash, cannot exceed the
                implementation fee, and cannot be combined unless agreed in writing.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">5. Upgrades and website builds</h2>
              <p className="mt-3">
                Website Upgrades and Builds require a signed SOW before work begins.
                The SOW identifies pages, platform, deliverables, exclusions, client
                dependencies, access, milestones, fees, payment schedule, revision
                rounds, acceptance, ownership, launch, correction period, support,
                and change-order procedure. “From” prices describe the published
                base scope, not a quote for unknown requirements.
              </p>
              <p className="mt-3">
                Work outside the signed scope requires written approval and may
                change price and schedule. If an SOW conflicts with these Terms, the
                SOW controls for that engagement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">6. AI Search Care Plan</h2>
              <p className="mt-3">
                The Care Plan is available only after queryclear confirms the site’s
                baseline, platform, access, approval workflow, and scope eligibility
                in writing. It costs $997 per month unless the written enrollment says otherwise.
              </p>
              <p className="mt-3">
                The plan includes the monthly items and boundaries published on the
                Care Plan page. An update is one small approved change to one existing
                page or shared template involving copy, metadata, schema, or internal
                links. Up to two updates are included per billing month; unused updates
                do not roll over. New pages, redesigns, migrations, custom development,
                emergencies, and third-party fees are separate work.
              </p>
              <p className="mt-3">
                The plan is month-to-month with no long-term commitment. Cancel by
                emailing {site.email} before the next renewal. Cancellation stops
                future renewals and service continues through the paid period. Paid
                periods are not prorated except where law requires.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">7. Fees, taxes, cancellations, and refunds</h2>
              <p className="mt-3">
                Prices are in U.S. dollars and exclude applicable taxes and third-party
                costs unless stated. You authorize Stripe to charge the disclosed
                one-time or recurring amount. Failed or disputed payments may pause work.
              </p>
              <p className="mt-3">
                For the $497 audit, email us immediately to cancel. We provide a full
                refund if substantive research has not begun. Once research begins,
                the fee is non-refundable except where required by law or if we cannot
                deliver the agreed scope. Project cancellation, deposits, milestones,
                and refunds are governed by the SOW. Client delay pauses delivery and
                does not by itself create a refund right.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">8. Client responsibilities</h2>
              <p className="mt-3">You are responsible for:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>accurate, complete, and timely business facts, source material, access, feedback, and approvals;</li>
                <li>the legality and substantiation of services, claims, credentials, reviews, images, testimonials, pricing, offers, and regulated content;</li>
                <li>backups and authorized access unless the SOW assigns those duties to us;</li>
                <li>reviewing staging or preview work and obtaining legal, medical, privacy, accessibility, security, or regulatory advice appropriate to your business;</li>
                <li>maintaining third-party accounts, subscriptions, domains, licenses, and post-handoff security.</li>
              </ul>
              <p className="mt-3">
                Do not send credentials or sensitive data through public forms. Paid
                work requiring access must use the secure method agreed at kickoff.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">9. Intellectual property and publicity</h2>
              <p className="mt-3">
                You retain ownership of materials you provide. Subject to full payment,
                client-specific deliverables are licensed or assigned as stated in the
                SOW. queryclear and {site.legal.operator} retain pre-existing code,
                frameworks, rubrics, templates, tools, processes, improvements,
                generalized know-how, and third-party components.
              </p>
              <p className="mt-3">
                Third-party software and assets remain subject to their own licenses.
                We will not publish your name, logo, testimonial, confidential results,
                or a case study without written permission. Permission may be revoked
                prospectively, but does not require recall of materials already lawfully distributed.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">10. Confidentiality and security</h2>
              <p className="mt-3">
                Each party will use reasonable care to protect non-public information
                received for an engagement and use it only for delivery, administration,
                legal compliance, and agreed purposes. Confidentiality does not cover
                information that is public without breach, independently developed,
                already lawfully known, or lawfully received from another source.
                Required disclosures may be made when legally compelled.
              </p>
              <p className="mt-3">
                No internet service is risk-free. Any project-specific security,
                data-processing, incident, or subprocessor commitments must be stated
                in the SOW or a signed data-processing or security addendum.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">11. Third-party systems</h2>
              <p className="mt-3">
                Search engines, AI tools, hosting providers, analytics, CMS platforms,
                payment providers, email services, booking tools, and other third
                parties control their own availability, rules, outputs, pricing, and
                changes. We are not responsible for their decisions, outages, policy
                changes, lost access, or content removal, but we will perform the
                specific integration or validation duties accepted in writing.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">12. No outcome guarantee</h2>
              <p className="mt-3">
                We commit to the agreed process and deliverables, not third-party
                outcomes. We do not guarantee rankings, indexing, traffic, leads,
                conversions, revenue, recommendations, AI citations, or any specific
                answer. Search and AI outputs are probabilistic, personalized, dynamic,
                and controlled by third parties.
              </p>
              <p className="mt-3">
                Except for express written commitments, services and website materials
                are provided “as is” and “as available,” to the maximum extent permitted
                by law. We disclaim implied warranties of merchantability, fitness for
                a particular purpose, and non-infringement to that extent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">13. Limitation of liability</h2>
              <p className="mt-3">
                To the maximum extent permitted by law, neither party is liable for
                indirect, incidental, special, consequential, exemplary, or punitive
                damages, or for lost profits, revenue, data, goodwill, or business
                opportunity arising from the services.
              </p>
              <p className="mt-3">
                To the maximum extent permitted by law, queryclear’s aggregate liability
                arising from a service is limited to the greater of $500 or the fees
                you paid queryclear for that service during the six months before the
                event giving rise to the claim. These limits do not apply where liability
                cannot lawfully be limited, or to fraud or willful misconduct.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">14. Governing law and disputes</h2>
              <p className="mt-3">
                Florida law governs these Terms without regard to conflicts rules.
                Before filing a claim, the parties will attempt in good faith for 30
                days to resolve it after written notice. Unless a signed SOW says
                otherwise or law requires another forum, state and federal courts in
                Duval County, Florida have exclusive jurisdiction, and each party
                consents to that venue.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">15. General terms and contact</h2>
              <p className="mt-3">
                Neither party may assign an active engagement without consent, except
                in connection with a merger, reorganization, or sale of substantially
                all relevant assets. Delay in enforcement is not a waiver. If one
                provision is unenforceable, the remainder stays effective. Electronic
                records, checkboxes, and signatures may be used to evidence agreement.
              </p>
              <p className="mt-3">
                We may update website terms prospectively by changing the version and
                date above. The accepted version continues to govern an existing paid
                order unless the parties agree otherwise or a required legal change is
                communicated. These Terms, the accepted order, Privacy Policy, and any
                signed SOW or addendum form the complete agreement for their subject.
              </p>
              <p className="mt-3">
                Questions or legal notices: {site.legal.operator}, {site.legal.address.street},{" "}
                {site.legal.address.city}, {site.legal.address.region} {site.legal.address.postalCode},{" "}
                or{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>.
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
