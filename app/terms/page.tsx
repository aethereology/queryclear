import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using the queryclear website and services. queryclear improves AI search readiness; it does not guarantee rankings or AI citations.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — queryclear",
    description:
      "Terms for using queryclear. We improve AI search readiness and do not guarantee rankings or AI citations.",
  },
};

const LAST_UPDATED = "June 3, 2026";

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
  description: "The terms for using the queryclear website and services.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
  dateModified: "2026-06-03",
};

export default function TermsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="terms">Terms</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          </Container>
        </section>

        <section className="py-16">
          <Container className="max-w-2xl space-y-10 leading-relaxed text-muted">
            <p>
              These terms apply when you use the queryclear website or engage our
              services. queryclear is a product of Aethelo, under SparkCreatives Inc.
              By using the site or requesting an audit, you agree to what&apos;s below.
            </p>

            <div>
              <h2 className="text-2xl text-ink">What we do</h2>
              <p className="mt-3">
                queryclear provides AI search optimization (GEO) services: audits and
                improvements to a website&apos;s structure, structured data, content
                clarity, crawlability, and machine-readable summaries so that search
                engines and AI answer engines can better crawl, understand, trust, and
                summarize a business.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">No guarantee of rankings or AI citations</h2>
              <p className="mt-3">
                This matters, so we say it plainly: we improve the parts of your site
                we can control — clarity, structure, and technical readiness. We do{" "}
                <strong className="text-ink">not</strong> guarantee specific search
                rankings, traffic, leads, AI citations, or that any particular answer
                engine will surface or recommend your business. Search engines and AI
                systems are operated by third parties, change frequently, and are
                outside our control. Anyone who guarantees rankings or citations is
                not being honest.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Your responsibilities</h2>
              <p className="mt-3">
                You agree to give us accurate information and to have the right to
                request work on the website and content you submit. We build on
                truthful details only — we won&apos;t invent reviews, ratings,
                credentials, addresses, or other business facts, and we ask that you
                don&apos;t ask us to.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Audits and deliverables</h2>
              <p className="mt-3">
                A free audit is provided as-is for your information and carries no
                obligation on either side. Paid engagements (such as a paid audit
                report or a website upgrade) are governed by the specific scope,
                price, and terms we agree with you in writing before work begins.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Intellectual property</h2>
              <p className="mt-3">
                The content, frameworks, and methods on this site are owned by
                queryclear / Aethelo. Deliverables we create for you become yours as
                set out in our written agreement, while we retain our general methods,
                templates, and know-how.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Limitation of liability</h2>
              <p className="mt-3">
                To the extent permitted by law, queryclear is not liable for indirect
                or consequential losses, or for outcomes that depend on third-party
                search and AI systems. Nothing here limits liability that cannot be
                limited by law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-ink">Changes &amp; contact</h2>
              <p className="mt-3">
                We may update these terms as our service evolves; we&apos;ll change the
                &ldquo;last updated&rdquo; date above when we do. Questions? Email{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline hover:text-lime-deep">
                  {site.email}
                </a>
                . See also our{" "}
                <a href="/privacy" className="font-medium text-ink underline hover:text-lime-deep">
                  Privacy Policy
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
