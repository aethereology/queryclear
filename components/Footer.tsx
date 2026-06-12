import Link from "next/link";
import { Container, Mark } from "@/components/ui";
import { companyLinks, resourceColumns, serviceColumns, type NavLink } from "@/lib/navigation";
import { site } from "@/lib/site";

const footerLinkClass = "text-paper/80 hover:text-lime";

export function Footer() {
  const serviceLinks = serviceColumns.flatMap((column) => column.links);
  const resourceLinks = resourceColumns.flatMap((column) => column.links);

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
            <FooterSection label="Services" links={serviceLinks} />
            <FooterSection label="Resources" links={resourceLinks} />
            <FooterSection label="Company" links={companyLinks} />
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/40">Get started</span>
              <Link href={`/${site.primaryCta.href}`} className={footerLinkClass}>
                Free AI Search Snapshot
              </Link>
              <a href={`mailto:${site.email}`} className={footerLinkClass}>
                {site.email}
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-paper/50">
          <p>
            queryclear is a{" "}
            <a href={site.parentOrgUrl} className="underline hover:text-lime">
              SparkCreatives Inc.
            </a>{" "}
            brand.
          </p>
          <p>
            © {new Date().getFullYear()} queryclear. We upgrade websites for
            modern search. We do not guarantee rankings or AI citations.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterSection({ label, links }: { label: string; links: NavLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="mono-label !text-paper/40">{label}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={footerLinkClass}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}
