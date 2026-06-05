import Link from "next/link";
import { Container, Mark } from "@/components/ui";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto bg-pine-2 text-paper">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <Mark className="h-5 w-5 text-paper" />
              <span className="font-display text-2xl">queryclear</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              {site.description}
            </p>
          </div>

          <nav className="flex flex-wrap gap-10 text-sm sm:gap-12" aria-label="Footer">
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/40">Services</span>
              <Link href="/ai-visibility-audit" className="text-paper/80 hover:text-lime">
                AI visibility audit
              </Link>
              <Link href="/geo-audit" className="text-paper/80 hover:text-lime">
                GEO audit
              </Link>
              <Link href="/ai-search-ready-website" className="text-paper/80 hover:text-lime">
                AI-search-ready websites
              </Link>
              <Link href="/local-ai-search-optimization" className="text-paper/80 hover:text-lime">
                Local AI search
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/40">Resources</span>
              <Link href="/ai-visibility-stack" className="text-paper/80 hover:text-lime">
                The AI Visibility Stack
              </Link>
              <Link href="/audit" className="text-paper/80 hover:text-lime">
                Sample audit
              </Link>
              <Link href="/schema-for-ai-search" className="text-paper/80 hover:text-lime">
                Schema for AI search
              </Link>
              <Link href="/llms-txt-for-businesses" className="text-paper/80 hover:text-lime">
                llms.txt for businesses
              </Link>
              <Link href={site.stackKit.path} className="text-paper/80 hover:text-lime">
                The DIY kit ({site.stackKit.priceLabel})
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/40">Company</span>
              <Link href="/about" className="text-paper/80 hover:text-lime">
                About
              </Link>
              <Link href="/contact" className="text-paper/80 hover:text-lime">
                Contact
              </Link>
              <Link href="/privacy" className="text-paper/80 hover:text-lime">
                Privacy
              </Link>
              <Link href="/terms" className="text-paper/80 hover:text-lime">
                Terms
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/40">Get started</span>
              <Link href={`/${site.primaryCta.href}`} className="text-paper/80 hover:text-lime">
                Free AI search audit
              </Link>
              <a href={`mailto:${site.email}`} className="text-paper/80 hover:text-lime">
                {site.email}
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-paper/50">
          <p>
            A product of{" "}
            <a href={site.parentOrgUrl} className="underline hover:text-lime">
              Aethelo
            </a>
            , under SparkCreatives Inc.
          </p>
          <p>
            © {new Date().getFullYear()} queryclear. We optimize websites for AI
            search readiness. We do not guarantee rankings or AI citations.
          </p>
        </div>
      </Container>
    </footer>
  );
}
