import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { Container, MonoLabel, Cta } from "@/components/ui";
import { SnapshotCta } from "@/components/SnapshotCta";
import { Stagger, StaggerItem, ClipReveal } from "@/components/motion";
import { TypingPanel } from "@/components/TypingPanel";
import { HumanMachineToggle } from "@/components/HumanMachineToggle";
import { Accordion } from "@/components/Accordion";
import { HeroCircuit } from "@/components/HeroCircuit";
import { site } from "@/lib/site";

const whatWeBuild = [
  { t: "Modern-search-ready websites", d: "Built from the ground up with clear service pages, fast performance, useful content, and search-friendly structure." },
  { t: "Existing website optimization", d: "We tighten the pages you have: structure, content clarity, metadata, schema, internal links, local details, and conversion paths." },
  { t: "AI Search Snapshots & Audits", d: "A quick free review of how your site reads to modern search — or a deeper scored audit with a prioritized fix roadmap." },
  { t: "Service page rebuilds", d: "Pages that state plainly what you do, who you serve, where, why you're credible, and what to do next." },
  { t: "Local visibility improvements", d: "We align your website, service pages, FAQs, and local business details so customers and search systems understand your market." },
];

const steps = [
  { n: "01", t: "Snapshot", d: "We review your site's search clarity, service pages, local signals, technical foundations, and AI-search readiness." },
  { n: "02", t: "Plan", d: "A practical, plain-English roadmap showing what to fix first — biggest impact at the top." },
  { n: "03", t: "Build / optimize", d: "We implement: technical SEO fixes, page structure, metadata, service content, FAQs, schema where useful, speed, accessibility." },
  { n: "04", t: "Submit / measure", d: "Sitemap, robots, Search Console, and Bing Webmaster Tools setup so the site can be discovered and monitored." },
  { n: "05", t: "Monitor", d: "We re-run the AI visibility tests and track what changed." },
];

const deliverables = [
  "Search-focused titles & meta descriptions",
  "Clear homepage & service-page structure",
  "Helpful FAQ sections",
  "Local business & service-area clarity",
  "Internal linking improvements",
  "JSON-LD schema where useful",
  "Open Graph metadata",
  "sitemap.xml & robots.txt",
  "Search Console & Bing setup guidance",
  "Accessible forms & CTAs",
  "Page experience & speed recommendations",
  "AI-search prompt testing",
  "Optional llms.txt support file",
  "Plain-English implementation roadmap",
];

const faqs = [
  {
    q: "What is AI Search Optimization?",
    a: "AI Search Optimization is modern SEO for the way people search now. It improves your website's technical structure, content clarity, service pages, local details, metadata, and trust signals so search engines and AI-powered search experiences can better understand your business. Some people call this GEO or AEO, but the foundation is still strong SEO: useful content, crawlable pages, clear structure, and accurate business information.",
  },
  {
    q: "Do you guarantee rankings or AI citations?",
    a: "No, and you should distrust anyone who does. What we control is the quality of your website's foundation: clear pages, useful content, crawlability, metadata, schema where appropriate, local details, and a better experience for visitors. That's the part we do well.",
  },
  {
    q: "How is this different from regular SEO?",
    a: "It isn't separate from SEO — it's a modern version of it that accounts for AI-powered search experiences, answer summaries, and future AI agents. Traditional SEO still matters. We build on it by making your website clearer, more useful, better structured, and easier for both people and search systems to evaluate.",
  },
  {
    q: "What do I get from the free Snapshot?",
    a: "A quick, plain-English review of your website's biggest search-readiness opportunities. It is not a full audit. If you want a deeper scored report with prompt testing and a prioritized implementation roadmap, that's our paid AI Search Audit.",
  },
  {
    q: "Do I need llms.txt?",
    a: "No. An llms.txt file isn't required to appear in search or AI results, and it isn't a ranking factor. We sometimes publish one as a small supplemental file for AI-oriented tools, but the core strategy is stronger SEO: useful content, clear service pages, crawlability, local details, metadata, and a better user experience.",
  },
  {
    q: "Do you use AI to write content?",
    a: "We may use AI tools to help draft, organize, or speed up content work, but we don't publish generic AI filler. The goal is to capture the real expertise, services, process, proof, and customer questions behind your business — then turn that into clear, useful website content.",
  },
  {
    q: "Who is queryclear for?",
    a: "Service businesses that depend on search, trust, and high-intent leads — med spas, aesthetic practices, contractors, clinics, consultants, attorneys, dentists, and local professional firms.",
  },
  {
    q: "Can I do this myself?",
    a: "If you're hands-on, yes — we offer a $97 DIY kit (The Local AI Visibility Stack) with our playbook and copy-paste templates so you can apply the method on your own. It's a refundable founding pre-order at queryclear.com/stack-kit. Most owners still start with the free Snapshot — it's the easiest way to see what to fix first.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Modern SEO / AI Search Optimization",
  name: "Modern Search Website Optimization",
  description: site.description,
  provider: { "@type": "Organization", name: site.name, url: site.url },
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="site-section relative overflow-hidden">
          <Container className="relative grid items-center gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
            <div>
              <div className="fade-up">
                <MonoLabel>Modern SEO · AI search</MonoLabel>
              </div>
              <h1
                className="fade-up mt-6 text-balance text-5xl leading-[1.02] sm:text-6xl"
                style={{ animationDelay: "0.08s" }}
              >
                Modern SEO for the AI search era.
              </h1>
              <p
                className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-muted"
                style={{ animationDelay: "0.16s" }}
              >
                Websites built to be understood — by Google, AI search, and
                real customers. We help service businesses make their sites
                clearer, more useful, and easier to discover across Google
                Search, AI Overviews, ChatGPT-style answer engines, and future
                AI agents.
              </p>
              <div
                className="fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "0.24s" }}
              >
                <SnapshotCta href={site.primaryCta.href}>
                  {site.primaryCta.label}
                </SnapshotCta>
                <Cta href={site.secondaryCta.href} variant="ghost">
                  {site.secondaryCta.label}
                </Cta>
              </div>
            </div>

            {/* the signature: what the machine reads */}
            <div className="fade-up" style={{ animationDelay: "0.32s" }}>
              <HeroCircuit />
              <p className="mono-label mb-2">{"// what modern search can understand"}</p>
              <TypingPanel
                lines={[
                  <span key="c" className="text-paper/40"># business profile</span>,
                  <span key="b">
                    <span className="k">Business</span>:{" "}
                    <span className="s">Goldleaf Aesthetics &amp; Med Spa</span>
                  </span>,
                  <span key="se">
                    <span className="k">Serves</span>:{" "}
                    <span className="s">Westhaven metro</span>
                  </span>,
                  <span key="o">
                    <span className="k">Offers</span>:{" "}
                    <span className="s">Botox, fillers, laser, facials</span>
                  </span>,
                  <span key="j" className="mt-2 block">
                    <span className="text-paper/40">
                      &#123; &quot;@type&quot;: &quot;
                    </span>
                    <span className="k">MedicalBusiness</span>
                    <span className="text-paper/40">
                      &quot;, &quot;name&quot;: &quot;
                    </span>
                    <span className="s">Goldleaf…</span>
                    <span className="text-paper/40">&quot; &#125;</span>
                  </span>,
                  <span key="ok" className="mt-3 block text-lime">
                    ✓ clear · crawlable · useful · structured
                  </span>,
                ]}
              />
            </div>
          </Container>
        </section>

        {/* ── TWO TRACKS ───────────────────────────────────── */}
        <section className="site-section border-y border-line bg-paper-2 py-16 md:py-20">
          <Container>
            <MonoLabel index="00">Two ways to work with us</MonoLabel>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
              Done-for-you optimization — or an operator that keeps doing it.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="card flex flex-col p-7">
                <p className="mono-label !text-lime-deep">For local &amp; service businesses</p>
                <h3 className="mt-3 text-xl">Done-for-you optimization</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  We audit your site and implement the fixes — clearer service
                  pages, schema, local signals, conversion paths. A free Snapshot,
                  a $497 audit, a website upgrade, or a full build.
                </p>
                <div className="mt-5">
                  <Cta href="#offers" variant="ghost">See the offers</Cta>
                </div>
              </div>
              <div className="card flex flex-col p-7">
                <p className="mono-label !text-lime-deep">
                  For {site.operator.forWho} · {site.operator.status}
                </p>
                <h3 className="mt-3 text-xl">The {site.operator.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {site.operator.tagline} An agent monitors AI search visibility,
                  drafts answer-first content, and prepares on-page fixes — you
                  approve every step. Now onboarding founding design partners.
                </p>
                <div className="mt-5">
                  <Cta href={site.operator.path}>Meet the operator</Cta>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ── PROBLEM ──────────────────────────────────────── */}
        <Section id="problem" index="01" label="The problem">
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            <ClipReveal
              lines={["Your customers search differently now.", "Is your site clear enough to be chosen?"]}
            />
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ["Hard to understand", "Many business websites look good but never clearly say what the business does, where it serves, and why it should be trusted."],
              ["Weak search foundations", "Pages that are hard to crawl, thin, duplicated, slow, or missing key business details give modern search systems less to work with."],
              ["Generic content doesn't stand out", "AI-powered search compares many sources at once. Helpful, specific, experience-based content matters more than recycled SEO copy."],
            ].map(([t, d]) => (
              <div key={t} className="bg-paper p-7">
                <h3 className="text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SOLUTION ─────────────────────────────────────── */}
        <Section id="solution" index="02" label="What we optimize" tinted>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl">
                We make your site legible — to people and to machines.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted">
                We improve the foundations that help search engines, AI-powered
                results, and future browser agents understand your business. The
                goal isn&apos;t to write for robots — it&apos;s to make your
                site clearer, more useful, and easier to evaluate.
              </p>
              <ul className="mt-7 grid gap-2.5 text-sm">
                {["Technical SEO foundation", "Crawlability & indexability", "Service-page clarity & helpful FAQs", "Local business & service-area details", "Schema & metadata where useful", "Internal links & content structure", "Page experience & accessibility", "Optional llms.txt support file"].map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 bg-lime" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <HumanMachineToggle
                human={
                  <div className="card p-5">
                    <p className="mono-label mb-2">Human view</p>
                    <p className="font-display text-2xl leading-tight">
                      Look refreshed, not done — Botox &amp; fillers in Westhaven.
                    </p>
                  </div>
                }
                machine={
                  <div className="machine-panel">
                    <div><span className="k">name</span>: <span className="s">Goldleaf Aesthetics</span></div>
                    <div><span className="k">service</span>: <span className="s">med spa</span></div>
                    <div><span className="k">area</span>: <span className="s">Westhaven</span></div>
                    <div><span className="k">providers</span>: <span className="s">licensed RN injectors</span></div>
                    <div className="mt-2 text-lime">↳ citable</div>
                  </div>
                }
              />
            </div>
          </div>
        </Section>

        {/* ── WHAT WE BUILD ────────────────────────────────── */}
        <Section id="build" index="03" label="What we build">
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            From a quick search snapshot to a full modern-search upgrade.
          </h2>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeBuild.map((c) => (
              <StaggerItem key={c.t} className="card card-marker flex flex-col p-6 pl-9">
                <h3 className="text-xl">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
              </StaggerItem>
            ))}
            <StaggerItem className="card flex flex-col justify-between bg-pine p-6 text-paper">
              <h3 className="text-xl text-paper">Not sure where you stand?</h3>
              <div className="mt-4">
                <SnapshotCta href={site.primaryCta.href}>
                  Start with a free Snapshot
                </SnapshotCta>
              </div>
            </StaggerItem>
          </Stagger>
        </Section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <Section id="how" index="04" label="How it works" tinted>
          <h2 className="max-w-2xl text-4xl sm:text-5xl">A clear path, every time.</h2>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((s) => (
              <StaggerItem key={s.n} className="flex flex-col bg-paper p-6">
                <span className="font-mono text-sm text-lime-deep tnum">{s.n}</span>
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        {/* ── DELIVERABLES ─────────────────────────────────── */}
        <Section id="deliverables" index="05" label="Deliverables">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <h2 className="text-4xl sm:text-5xl">What you actually get.</h2>
            <Stagger className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <StaggerItem key={d}>
                  <span className="flex items-center gap-3 pb-3 text-sm">
                    <span className="font-mono text-lime-deep">✓</span>
                    {d}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <Section id="faq" index="06" label="Good to know" tinted>
          <h2 className="text-4xl sm:text-5xl">Questions, answered.</h2>
          <Accordion
            className="mt-10"
            items={faqs.map((f) => ({ q: f.q, a: f.a }))}
          />
        </Section>

        {/* ── OFFER LADDER ─────────────────────────────────── */}
        <Section id="offers" index="07" label="Start here">
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            Start with the right level of help.
          </h2>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.offers.map((o) => (
              <StaggerItem key={o.name} className="card flex flex-col p-6">
                <p className="mono-label">{o.price}</p>
                <h3 className="mt-3 text-xl">{o.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {o.desc}
                </p>
                <div className="mt-5">
                  {o.need === null ? (
                    <Cta href={o.href} variant="ghost">
                      {o.cta}
                    </Cta>
                  ) : (
                    <SnapshotCta href={o.href} variant="ghost" defaultNeed={o.need}>
                      {o.cta}
                    </SnapshotCta>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-6 text-sm text-muted">
            &quot;From&quot; prices are starting points — every project is
            scoped and confirmed in writing before work begins.
          </p>
        </Section>

        {/* ── CTA + LEAD FORM ──────────────────────────────── */}
        <section id="audit-cta" className="scroll-mt-20 bg-pine py-20 text-paper md:py-28">
          <Container className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <MonoLabel index="08">Get started</MonoLabel>
              <h2 className="mt-5 text-4xl text-paper sm:text-5xl">
                <ClipReveal lines={["Get your free", "AI Search Snapshot."]} />
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                Tell us about your business and we&apos;ll review your
                website&apos;s biggest opportunities for modern search:
                clarity, crawlability, service pages, local signals, and
                AI-search readiness. Free, no obligation — you get a
                plain-English review, not a sales bot.
              </p>
            </div>
            <LeadForm />
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Section({
  id,
  index,
  label,
  children,
}: {
  id: string;
  index: string;
  label: string;
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="site-section scroll-mt-20 py-20 md:py-24"
    >
      <Container>
        <div className="mb-3">
          <MonoLabel index={index}>{label}</MonoLabel>
        </div>
        {children}
      </Container>
    </section>
  );
}
