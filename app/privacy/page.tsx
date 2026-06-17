import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How queryclear collects, uses, and protects the information you submit — including audit-request details. We use it only to deliver your audit and reply to you. We don't sell or share it.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — queryclear",
    description:
      "How queryclear handles the information you submit. We use it only to prepare your audit and reply to you.",
  },
};

const LAST_UPDATED = "June 3, 2026";

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
  description: "How queryclear collects, uses, and protects information you submit.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
  dateModified: "2026-06-03",
};

export default function PrivacyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="privacy">Privacy</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="prose-legal max-w-2xl space-y-10 leading-relaxed text-muted">
            <p>
              This policy explains what information queryclear collects when you use
              this site or request an audit or website inquiry, how we use it, and the
              choices you have. queryclear is a SparkCreatives Inc. brand. Plain
              language, no surprises.
            </p>

            <div>
              <h2 className="text-2xl text-ink">What we collect</h2>
              <p className="mt-3">
                When you submit the audit / contact form, we collect the details you
                choose to provide: your name, email address, website URL, business
                name, and optionally your main service, city or market, and any
                message. We don&apos;t require anything beyond what&apos;s needed to
                prepare a useful audit and reply to you.
              </p>
              <p className="mt-3">
                Like most websites, our hosting provider may process basic technical
                data (such as IP address and request logs) to operate the site
                securely and prevent abuse. We use this only for operating and
                protecting the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">How we use it</h2>
              <p className="mt-3">We use the information you submit only to:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6">
                <li>prepare and deliver the AI search audit you requested;</li>
                <li>reply to you and answer your questions;</li>
                <li>follow up about the services you asked about.</li>
              </ul>
              <p className="mt-3">
                We do <strong className="text-ink">not</strong> sell, rent, or share
                your information with third parties for their own marketing.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Service providers we rely on</h2>
              <p className="mt-3">
                To run the site and respond to you, we use a small number of trusted
                providers — for example, our website host and an email delivery
                service that sends your confirmation and routes your message to us.
                These providers process data only to provide their service to us.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">How long we keep it</h2>
              <p className="mt-3">
                We keep audit-request details for as long as needed to respond to you
                and maintain our business records, and no longer than necessary. You
                can ask us to delete your information at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Your choices</h2>
              <p className="mt-3">
                You can ask us to access, correct, or delete the information you&apos;ve
                given us, or to stop contacting you. Just email{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>{" "}
                and we&apos;ll take care of it.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">No guarantees</h2>
              <p className="mt-3">
                queryclear improves how clearly search engines and AI answer engines
                can understand a website. We do not guarantee search rankings or AI
                citations — see our{" "}
                <a href="/terms" className="font-medium text-ink underline hover:text-lime-deep">
                  Terms
                </a>{" "}
                for details.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Changes &amp; contact</h2>
              <p className="mt-3">
                We may update this policy as our service evolves; we&apos;ll change the
                &ldquo;last updated&rdquo; date above when we do. Questions about
                privacy? Email{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>
                .
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
