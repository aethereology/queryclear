import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel } from "@/components/ui";
import { OutreachConsole } from "@/components/OutreachConsole";

// Founder-only internal tool. Keep it out of search + AI crawlers entirely:
// noindex here, disallowed in app/robots.ts, and deliberately NOT added to
// app/sitemap.ts or app/llms.txt. Access is gated server-side by OUTREACH_SECRET.
export const metadata: Metadata = {
  title: "Outreach console",
  robots: { index: false, follow: false },
};

export default function OutreachPage() {
  return (
    <>
      <Header />
      <main>
        <section className="site-section border-b border-line">
          <Container className="py-16 sm:py-20">
            <MonoLabel index="internal">Internal · cold outreach</MonoLabel>
            <h1 className="mt-5 max-w-3xl">Run an audit and send a cold-outreach email.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Enter a prospect&apos;s site to run a read-only audit and preview the branded
              cold-outreach email — same fix list and offers as the free audit, framed as outreach.
              Preview first; send only when it looks right.
            </p>
            <div className="mt-10">
              <OutreachConsole />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
