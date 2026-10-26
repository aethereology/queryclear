import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { FreeAudit } from "@/components/FreeAudit";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free AI Search-Readiness Preview",
  description:
    "Check up to five public pages for on-page search readiness, then review clearly labeled single-sample answer scenarios and prioritized next steps.",
  alternates: { canonical: "/free-audit" },
  openGraph: {
    title: "Free AI Search-Readiness Preview — queryclear",
    description:
      "A free, read-only check of public pages, with verified on-page findings and clearly labeled modeled answer scenarios.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free AI Search-Readiness Preview",
  url: `${site.url}/free-audit`,
  description:
    "A free, read-only search-readiness preview: public-page checks, modeled answer scenarios, and prioritized next steps.",
  isPartOf: { "@id": site.schemaIds.website },
};

const steps = [
  { n: "01", t: "Crawl", d: "We read your public pages the way a machine does — title, structure, schema, content." },
  { n: "02", t: "Model", d: "A general language model generates up to five buyer-intent questions and one answer sample for each. Named AI products are not queried." },
  { n: "03", t: "Prioritize", d: "You get ranked observations and a sample draft inferred from the public copy we fetched." },
];

export default function FreeAuditPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <Header />
      <main id="main-content">
        <section className="site-section border-b border-line">
          <Container className="py-16 sm:py-20">
            <MonoLabel index="free">Free automated preview</MonoLabel>
            <h1 className="mt-5 max-w-3xl">Find the clarity gaps in your website.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              A focused review of up to five public pages, with on-page evidence and practical next steps.
              Get a summary first; unlock the detailed report with your email.
            </p>
            <p className="mt-4 max-w-2xl text-sm text-muted">Includes clearly labeled modeled scenarios, not live measurements of named AI products.</p>
            <div className="mt-8">
              <FreeAudit />
            </div>
          </Container>
        </section>

        <section className="site-section border-b border-line bg-paper-2">
          <Container className="py-16">
            <MonoLabel index="how">How it works</MonoLabel>
            <h2 className="mt-4 text-3xl">What the preview actually does.</h2>
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
              On-page findings are based on the public pages fetched during this run. Answer-scenario
              results are model-generated hypotheses, not live engine measurements, citation rates,
              ranking data, or a promise of future visibility. Review every suggestion before acting.
              {" "}<Link className="underline" href="/audit-methodology">Read our audit methodology.</Link>
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
