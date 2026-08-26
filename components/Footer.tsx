import Link from "next/link";
import { Container, Logo } from "@/components/ui";
import { companyLinks, resourceColumns, serviceColumns, type NavLink } from "@/lib/navigation";
import { site } from "@/lib/site";
import { AnalyticsPreferencesButton } from "@/components/AnalyticsConsent";

const footerLinkClass = "text-paper/80 hover:text-lime";

export function Footer() {
  const serviceLinks = serviceColumns.flatMap((column) => column.links);
  const resourceLinks = resourceColumns.flatMap((column) => column.links);

  return (
    <footer className="mt-auto bg-pine-2 text-paper">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo className="h-9 w-auto text-paper" />
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              {site.description}
            </p>
          </div>

          <nav className="flex flex-wrap gap-10 text-sm sm:gap-12" aria-label="Footer">
            <FooterSection label="Services" links={serviceLinks} />
            <FooterSection label="Resources" links={resourceLinks} />
            <FooterSection label="Company" links={companyLinks} />
            <div className="flex flex-col gap-3">
              <span className="mono-label !text-paper/70">Get started</span>
              <Link href="/free-audit" className={`text-left ${footerLinkClass}`}>
                Free AI Search Audit
              </Link>
              <a href={`mailto:${site.email}`} className={footerLinkClass}>
                {site.email}
              </a>
              <AnalyticsPreferencesButton measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-paper/50">
          <p>
            queryclear is operated by{" "}
            <a href={site.parentOrgUrl} className="underline hover:text-lime">
              {site.legal.operator}
            </a>
            , a {site.legal.entityType}. EIN {site.legal.taxId}.
          </p>
          <p>
            {site.legal.address.street}, {site.legal.address.city},{" "}
            {site.legal.address.region} {site.legal.address.postalCode} · {site.legal.serviceFeeNotice}
          </p>
          <p>
            © {new Date().getFullYear()} {site.legal.operator}. We do not guarantee
            rankings, traffic, leads, recommendations, or AI citations.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterSection({ label, links }: { label: string; links: NavLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="mono-label !text-paper/70">{label}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={footerLinkClass}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}
