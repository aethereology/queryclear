import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The AI Visibility Stack",
  description:
    "The queryclear AI Visibility Stack: the seven layers that decide whether search engines and AI answer engines can find, understand, trust, and recommend a business — and what each layer requires on your site.",
  alternates: { canonical: "/ai-visibility-stack" },
  openGraph: {
    title: "The AI Visibility Stack — queryclear",
    description:
      "Seven layers that decide whether AI answer engines can find, understand, trust, and recommend your business.",
  },
};

const layers = [
  {
    n: "01",
    name: "Entity Clarity",
    what: "A machine can tell exactly who you are — your business name, category, location, service area, and how to reach you — with no ambiguity.",
    needs: "A clear About page, consistent name/category everywhere, Organization (and LocalBusiness) schema, and an AI-readable business summary.",
  },
  {
    n: "02",
    name: "Service Specificity",
    what: "Each thing you offer is stated plainly enough that an answer engine can match it to a real question a customer asks.",
    needs: "A dedicated, crawlable page per service — what it is, who it's for, where you do it — instead of one vague list.",
  },
  {
    n: "03",
    name: "Proof Density",
    what: "The site carries enough credible signals — credentials, examples, reviews, real specifics — that a system can treat you as trustworthy.",
    needs: "Honest proof: real reviews, case examples, credentials, and specifics. Never invented. (We don't fabricate any of this.)",
  },
  {
    n: "04",
    name: "Local Relevance",
    what: "Your business is clearly tied to the places you actually serve, so 'near me' and city-based questions can surface you.",
    needs: "Service-area language, location pages where they're genuine, and alignment with your Google Business Profile.",
  },
  {
    n: "05",
    name: "Answer Coverage",
    what: "The site directly answers the real questions buyers ask before choosing — so an AI has something concrete to quote.",
    needs: "FAQ blocks, clear pricing guidance, comparisons, and process explanations written for humans and machines.",
  },
  {
    n: "06",
    name: "Machine Readability",
    what: "Search engines and AI systems can actually crawl, parse, and summarize the site without tripping over it.",
    needs: "Valid JSON-LD schema, a sitemap, sensible robots rules, semantic HTML, unique metadata per page — and optionally an llms.txt support file.",
  },
  {
    n: "07",
    name: "Conversion Path",
    what: "Once someone — or an AI-referred visitor — lands, the next step is obvious and easy to take.",
    needs: "A clear, accessible CTA, a working contact or booking path, and forms that don't get in the way.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "The AI Visibility Stack",
  url: `${site.url}/ai-visibility-stack`,
  description:
    "The seven layers that decide whether search engines and AI answer engines can find, understand, trust, and recommend a business.",
  isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: "The AI Visibility Stack", item: `${site.url}/ai-visibility-stack` },
  ],
};

export default function StackPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="py-16 md:py-20">
            <MonoLabel index="method">Our method</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">The AI Visibility Stack</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Whether an AI answer engine can find, understand, trust, and recommend
              a business comes down to seven layers. We use this stack to audit every
              site and to decide what to fix first. It&apos;s the same framework
              behind our{" "}
              <a href="/audit" className="font-medium text-ink underline hover:text-lime-deep">
                sample audit
              </a>{" "}
              — and behind this site.
            </p>
          </Container>
        </section>

        {/* Layers */}
        <section className="py-16">
          <Container>
            <MonoLabel index="layers">The seven layers</MonoLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl">From &ldquo;who are you?&rdquo; to &ldquo;here&apos;s what to do next.&rdquo;</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Lower layers come first: a machine has to identify you before it can
              recommend you. A gap low in the stack undermines everything above it.
            </p>
            <Stagger className="mt-10 grid gap-4">
              {layers.map((l) => (
                <StaggerItem key={l.n} className="card grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-start">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                    <span className="font-display text-3xl text-lime-deep">{l.n}</span>
                  </div>
                  <div>
                    <h3 className="text-xl">{l.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">What it means: </span>{l.what}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">What your site needs: </span>{l.needs}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* How we use it */}
        <section className="border-y border-line bg-paper-2 py-16">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <MonoLabel index="use">How we use it</MonoLabel>
            </div>
            <div className="max-w-2xl space-y-4 leading-relaxed text-muted">
              <p>
                In an audit, we score each layer against your actual site and run real
                AI-visibility tests for your category. The result is a prioritized,
                plain-English fix list — biggest impact first — not a generic checklist.
              </p>
              <p>
                We&apos;re deliberate about honesty here: the stack improves how
                clearly machines can understand and trust you. It does not, and cannot,
                guarantee rankings or AI citations. What it does is remove the reasons
                a system would skip you.
              </p>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-pine py-20 text-paper">
          <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl text-paper sm:text-4xl">See your stack scored.</h2>
              <p className="mt-3 max-w-xl text-paper/70">
                Run a free AI Search Audit. The full $497 audit scores
                your site against all seven layers and shows what to fix first.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/ai-visibility-audit">Get the AI Search Audit</Cta>
              <Cta href="/scorecard" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                Score your own site
              </Cta>
              <Cta href="/audit" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                See a sample audit
              </Cta>
              <Cta href="/care-plan" variant="ghost" className="!text-paper !border-paper/30 hover:!bg-white/10">
                Keep it current — Care Plan
              </Cta>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
