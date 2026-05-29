import Link from "next/link";
import { Container, Cta } from "@/components/ui";
import { site } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl tracking-tight">queryclear</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-lime" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <Link href="#solution" className="text-sm text-muted transition-colors hover:text-ink">
            What we optimize
          </Link>
          <Link href="#how" className="text-sm text-muted transition-colors hover:text-ink">
            How it works
          </Link>
          <Link href="/audit" className="text-sm text-muted transition-colors hover:text-ink">
            Sample audit
          </Link>
        </nav>

        <Cta href={`/${site.primaryCta.href}`} className="px-5 py-2.5">
          Free audit
        </Cta>
      </Container>
    </header>
  );
}
