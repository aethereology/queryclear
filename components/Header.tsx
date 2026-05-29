"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Cta, Mark } from "@/components/ui";
import { site } from "@/lib/site";

const links = [
  { href: "/#solution", label: "What we optimize" },
  { href: "/#how", label: "How it works" },
  { href: "/audit", label: "Sample audit" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-2xl tracking-tight">queryclear</span>
          <Mark className="h-5 w-5 text-ink" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Cta
            href={`/${site.primaryCta.href}`}
            className="px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Free audit
          </Cta>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile nav panel */}
      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-line transition-[max-height] duration-300 ease-out md:hidden ${
          open ? "max-h-64" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col px-6 py-2" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-sm text-ink transition-colors hover:bg-paper-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
