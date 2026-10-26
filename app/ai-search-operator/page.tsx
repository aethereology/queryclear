import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { Accordion } from "@/components/Accordion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Search Operator",
  description:
    "A separate, human-approved early-access workflow for B2B SaaS teams: documented answer monitoring, draft content, and reviewable on-page fixes.",
  alternates: { canonical: "/ai-search-operator" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "AI Search Operator — queryclear",
    description:
      "An agent that does the modern-search work continuously — and you approve every move. Early access for B2B SaaS teams.",
  },
};

const capabilities = [
  {
    t: "Monitor",
    d: "Runs configured, timestamped answer samples for agreed buyer questions and records the engine, method, prompt, and observed brand mentions or source links.",
  },
  {
    t: "Create",
    d: "Drafts answer-first content and FAQ pages in your brand voice, aimed at the gaps it finds — queued for your review, never published behind your back.",
  },
  {
    t: "Fix",
    d: "Prepares on-page technical changes — schema, metadata, internal links, crawlability — as reviewable proposals you approve before anything ships.",
  },
  {
    t: "Measure",
    d: "Re-checks visibility over time so you can see what actually moved after the work — not a vanity dashboard, the before-and-after on real questions.",
  },
];

// Honest autonomy ladder. Review is what's available in early access today;
// the other two are explicitly roadmap, gated on brand-safety guardrails.
const modes = [
  {
    t: "Review",
    status: "Available now",
    d: "The agent proposes every action — content, fixes, outreach — and a human approves each one before it happens. Nothing goes live without your sign-off.",
  },
  {
    t: "Auto-publish",
    status: "On the roadmap",
    d: "The agent executes inside guardrails you pre-approve (e.g. schema and internal links) and escalates anything outside the box. Enabled per-customer once the guardrails are proven.",
  },
  {
    t: "Autopilot",
    status: "On the roadmap",
    d: "Full execution with a weekly review summary, for teams that have built trust over time. Opt-in, never the default.",
  },
];

const faqs = [
  {
    q: "Is it fully autonomous? Will it change my site on its own?",
    a: "No. In early access the operator runs in Review mode: it proposes content and fixes, and a person on your team approves each one before anything happens. It works against a staging or draft environment first — it does not make unattended edits to your live site. More autonomous modes are on the roadmap and are strictly opt-in, after brand-safety guardrails are in place.",
  },
  {
    q: "How is this different from an AI-visibility dashboard?",
    a: "Most tools in this category measure — they tell you you're invisible and hand you a task list. The operator is built to do the work: draft the content, prepare the technical fixes, and re-measure. You stay in control via the approval step; the agent removes the manual execution.",
  },
  {
    q: "Do you guarantee we'll show up or get cited in AI answers?",
    a: "No, and you should distrust anyone who does — AI answers are non-deterministic and no one controls them. What the operator controls is the quality and clarity of your site and content, and the steady, measured execution of the work that makes a brand easier to understand and cite.",
  },
  {
    q: "Who is this for?",
    a: "B2B SaaS teams (roughly Series A–C) who feel AI search eating into their funnel, already pay for SEO tooling, and don't have a dedicated AEO specialist to do the execution. If you're a local or service business, our done-for-you optimization track is the better fit — run a free audit.",
  },
  {
    q: "What does it cost?",
    a: "We're onboarding five founding design partners first, so pricing is set with each one and locked for your first year — no surprise increases. Request access below and we'll talk through scope and a fair founding rate.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Search Operator",
  url: `${site.url}/ai-search-operator`,
  description:
    "An agent that monitors AI search visibility, drafts answer-first content, and prepares on-page fixes for human approval. Early access for B2B SaaS teams.",
  isPartOf: { "@id": site.schemaIds.website },
};
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Search Operator",
  serviceType: "Managed AI search / AEO operator (early access)",
  provider: { "@id": site.schemaIds.organization },
  brand: { "@id": site.schemaIds.brand },
  description:
    "A human-approved operator that continuously monitors AI search visibility, drafts answer-first content, and prepares on-page technical fixes for B2B SaaS websites.",
  areaServed: "United States",
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "AI Search Operator",
      item: `${site.url}/ai-search-operator`,
    },
  ],
};

export default function OperatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main id="main-content">
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="operator">{site.operator.status} · {site.operator.forWho}</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              A human-led early-access program for ongoing website improvement.
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Most AI-search tools measure: they tell you you&apos;re invisible and
              hand you a task list. The {site.operator.name} does the work instead —
              it runs documented answer samples, drafts answer-first content, and
              prepares on-page fixes, with a human approving each step. This is a
              separate early-access track for B2B SaaS teams, not the local-service
              Website Upgrade or Care Plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="#early-access">{site.operator.cta.label}</Cta>
              <Cta href="/ai-visibility-stack" variant="ghost">See the method</Cta>
            </div>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="01">What the operator does</MonoLabel>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              It closes the loop — measure, create, fix, re-measure.
            </h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {capabilities.map((c) => (
                <StaggerItem key={c.t} className="card p-6">
                  <h3 className="text-lg">{c.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="02">You stay in control</MonoLabel>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              How much the agent does is your call.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-muted">
              The operator has an autonomy setting. Everyone starts in Review — the
              agent proposes, you approve. The other modes are on the roadmap and are
              always opt-in.
            </p>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
              {modes.map((m) => (
                <StaggerItem key={m.t} className="card p-6">
                  <p className="mono-label !text-lime-deep">{m.status}</p>
                  <h3 className="mt-2 text-lg">{m.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="border-b border-line py-16">
          <Container>
            <MonoLabel index="03">How it starts</MonoLabel>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              An audit is the first run, not the whole product.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              We begin with a paid audit of the public source material and labeled
              answer samples — the same
              scored review behind our{" "}
              <a href="/ai-visibility-audit" className="font-medium text-ink underline hover:text-lime-deep">
                AI Search Audit
              </a>{" "}
              (see a{" "}
              <a href="/audit" className="font-medium text-ink underline hover:text-lime-deep">
                sample report
              </a>
              ). From there the operator works the roadmap continuously — drafting,
              fixing, and re-measuring — instead of handing you a one-time PDF and
              wishing you luck.
            </p>
          </Container>
        </section>

        <section className="border-b border-line bg-paper-2 py-16">
          <Container>
            <MonoLabel index="04">Good to know</MonoLabel>
            <h2 className="mt-3 mb-8 text-3xl sm:text-4xl">Common questions.</h2>
            <Accordion items={faqs} className="max-w-3xl" />
          </Container>
        </section>

        <section id="early-access" className="scroll-mt-20 bg-pine py-20 text-paper md:py-28">
          <Container className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <MonoLabel index="05">Early access · fit reviewed personally</MonoLabel>
              <h2 className="mt-5 text-4xl text-paper sm:text-5xl">
                Become a founding partner.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                The early-access program includes
                hands-on setup and a direct line to {site.founder.name}, queryclear&apos;s
                founder and lead operator, while the
                operator proves out. In exchange we ask for honest feedback and,
                only if you&apos;re happy with the results, an optional case study.
                Scope and pricing are agreed before enrollment.
              </p>
            </div>
            <LeadForm
              defaultNeed={site.operator.interest}
              audience="saas"
              submitLabel="Request early access"
              note="No obligation. Kyle reviews fit and scope personally. Do not send passwords, source code, customer data, or other confidential information through this form."
            />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
