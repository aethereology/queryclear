import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, MonoLabel, Cta } from "@/components/ui";

export default function ReportNotFound() {
  return <>
    <Header />
    <main id="main-content">
      <section className="site-section border-b border-line">
        <Container className="py-20 sm:py-28">
          <MonoLabel index="report">Report unavailable</MonoLabel>
          <h1 className="mt-5 max-w-3xl">This report link is no longer available.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">The link may have expired or may be incomplete. Automated previews are kept for a limited time, so an older email may point to a report that is no longer stored.</p>
          <p className="mt-4 max-w-2xl text-muted">Run a fresh preview to check your current website. Once it is ready, download a copy to keep your findings.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Cta href="/free-audit">Run a fresh preview</Cta>
            <Cta href="/contact" variant="ghost">Get help with your report</Cta>
          </div>
        </Container>
      </section>
    </main>
    <Footer />
  </>;
}
