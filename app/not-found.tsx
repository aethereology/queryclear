import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, Cta, MonoLabel } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found (404)",
  description:
    "That page doesn't exist or has moved. Find the AI visibility audit, the method, the sample audit, or get in touch.",
  robots: { index: false, follow: true },
};

// A few high-value destinations so a 404 still routes people somewhere useful.
const destinations = [
  { href: "/ai-visibility-audit", label: "AI visibility audit", note: "See how AI search understands your business." },
  { href: "/ai-visibility-stack", label: "The AI Visibility Stack", note: "The 7-layer method we audit and build against." },
  { href: "/audit", label: "Sample audit", note: "A full example audit on a fictional business." },
  { href: "/contact", label: "Contact", note: "Ask a question or request a real audit." },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line">
          <Container className="py-20 md:py-28">
            <MonoLabel index="404">Page not found</MonoLabel>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-5xl">
              This page isn&apos;t here.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              The link may be broken or the page may have moved. Here are the
              places most people are looking for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/">Back to home</Cta>
              <Cta href={`/${site.primaryCta.href}`} variant="ghost" showArrow={false}>
                {site.primaryCta.label}
              </Cta>
            </div>
          </Container>
        </section>

        <section className="py-16">
          <Container>
            <ul className="grid gap-4 sm:grid-cols-2">
              {destinations.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className="card card-marker block h-full rounded-[10px] p-6 pl-10"
                  >
                    <span className="font-display text-xl tracking-tight">
                      {d.label}
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted">
                      {d.note}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
