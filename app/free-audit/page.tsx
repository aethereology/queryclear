import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { FreeAudit } from "@/components/FreeAudit";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AI Search Audit",
  description:
    "Run a free, read-only audit. See whether AI answer engines can find, understand, and cite your site — with a prioritized fix list and a sample draft in your brand voice.",
  alternates: { canonical: "/free-audit" },
  openGraph: {
    title: "Free AI Search Audit — queryclear",
    description:
      "See whether AI answer engines can find and cite your site. Free, read-only, with a prioritized fix list.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free AI Search Audit",
  url: `${site.url}/free-audit`,
  description:
    "A free, read-only AI search readiness audit: on-page technical checks, AI-visibility probing, and a prioritized fix list.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const steps = [
  { n: "01", t: "Crawl", d: "We read your public pages the way a machine does — title, structure, schema, content." },
  { n: "02", t: "Probe", d: "We test the buyer-intent questions AI assistants get asked, and whether you surface." },
  { n: "03", t: "Prioritize", d: "You get a ranked fix list + a sample draft written in your own brand voice." },
];

export default function FreeAuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <Header />
      <main>
        <section className="site-section border-b border-line">
          <Container className="py-16 sm:py-20">
            <MonoLabel index="free">AI Search Audit</MonoLabel>
            <h1 className="mt-5 max-w-3xl">Can AI answer engines find and cite your site?</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Run a free, read-only audit. We check your on-page technical readiness, test whether AI
              assistants cite you for buyer-intent questions, and hand you a prioritized list of fixes —
              plus a sample draft in your brand voice.
            </p>
            <div className="mt-10">
              <FreeAudit />
            </div>
          </Container>
        </section>

        <section className="site-section border-b border-line bg-paper-2">
          <Container className="py-16">
            <MonoLabel index="how">How it works</MonoLabel>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="card p-6">
                  <span className="font-display text-2xl text-lime-deep">{s.n}</span>
                  <h3 className="mt-2 text-lg">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted">
              We measure how <span className="text-ink">ready</span> a site is for AI search — not a
              promise of rankings or citations. AI-visibility results are modeled estimates, clearly
              marked, until each engine&apos;s API is connected. No fake guarantees.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
