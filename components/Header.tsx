"use client";

import { useState } from "react";
import Link from "next/link";
import { Cta, Mark } from "@/components/ui";
import { site } from "@/lib/site";

type NavLink = {
  href: string;
  label: string;
  desc?: string;
};

type MegaMenu = {
  id: "services" | "resources";
  label: string;
  columns: Array<{
    eyebrow: string;
    links: NavLink[];
  }>;
};

const services: NavLink[] = [
  { href: "/ai-visibility-audit", label: "AI visibility audit", desc: "A verified crawl, clarity, trust, and conversion-path review." },
  { href: "/geo-audit", label: "GEO audit", desc: "Generative-engine optimization review for answer engines." },
  { href: "/ai-search-ready-website", label: "AI-search-ready websites", desc: "Build and optimize pages that machines can parse." },
  { href: "/local-ai-search-optimization", label: "Local AI search", desc: "Local entity clarity, proof, services, and market coverage." },
];

const resources: NavLink[] = [
  { href: "/ai-visibility-stack", label: "The AI Visibility Stack", desc: "The seven-layer method behind every audit." },
  { href: "/audit", label: "Sample audit", desc: "See how the scoring and recommendations work." },
  { href: "/scorecard", label: "Free scorecard", desc: "Self-grade your site against the same 100-point rubric." },
  { href: "/schema-for-ai-search", label: "Schema for AI search", desc: "Plain-English structured data guidance." },
  { href: "/llms-txt-for-businesses", label: "llms.txt for businesses", desc: "What it does, what it does not, and how to use it." },
  { href: site.stackKit.path, label: `The DIY kit (${site.stackKit.priceLabel})`, desc: "A refundable founding pre-order for hands-on owners." },
];

const megaMenus: MegaMenu[] = [
  {
    id: "services",
    label: "Services",
    columns: [
      { eyebrow: "Audit", links: services.slice(0, 2) },
      { eyebrow: "Build", links: services.slice(2) },
      { eyebrow: "Method", links: [resources[0]] },
      { eyebrow: "Proof", links: [resources[1], resources[2]] },
      { eyebrow: "Talk", links: [{ href: "/contact", label: "Contact", desc: "Ask what fits your site before you book." }] },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    columns: [
      { eyebrow: "Start", links: resources.slice(1, 3) },
      { eyebrow: "Method", links: resources.slice(0, 1) },
      { eyebrow: "Machine files", links: resources.slice(3, 5) },
      { eyebrow: "DIY", links: resources.slice(5) },
    ],
  },
];

const directLinks: NavLink[] = [
  { href: "/ai-visibility-stack", label: "Method" },
  { href: "/audit", label: "Sample audit" },
  { href: "/about", label: "About" },
];

const navText =
  "font-mono text-xs font-medium uppercase tracking-wider";
const navBlock = "nav-block px-2 -mx-2 py-1";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<MegaMenu["id"] | null>(null);
  const activeMenu = megaMenus.find((menu) => menu.id === activeMega);

  return (
    <header className="sticky top-0 z-50 bg-paper">
      <div className="relative border-b border-dashed border-line bg-paper" onMouseLeave={() => setActiveMega(null)}>
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              setActiveMega(null);
            }}
          >
            <Mark className="h-5 w-5 text-ink" />
            <span className="font-display text-xl tracking-tight sm:text-2xl">queryclear</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
            {megaMenus.map((menu) => {
              const isOpen = activeMega === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`mega-${menu.id}`}
                  onClick={() => setActiveMega(isOpen ? null : menu.id)}
                  onMouseEnter={() => setActiveMega(menu.id)}
                  className={`flex items-center gap-1.5 ${navBlock} ${navText}`}
                >
                  {menu.label}
                  <Chevron open={isOpen} />
                </button>
              );
            })}
            {directLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setActiveMega(null)}
                className={`${navBlock} ${navText}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:border-l lg:border-dashed lg:border-line lg:pl-6">
            <div className="hidden lg:block">
              <Cta
                href="/contact"
                variant="ghost"
                showArrow={false}
                className="px-4 py-1.5 text-xs"
              >
                Contact
              </Cta>
            </div>
            <Cta
              href={`/${site.primaryCta.href}`}
              showArrow={false}
              className="px-3 py-2 text-xs sm:px-5 sm:py-2.5 lg:px-4 lg:py-1.5"
            >
              Free audit
            </Cta>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center border border-dashed border-line text-ink transition-colors hover:bg-lime hover:text-pine-2 lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
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
        </div>

        {activeMenu && (
          <div
            id={`mega-${activeMenu.id}`}
            className="absolute left-0 right-0 top-full hidden border-b border-dashed border-line bg-paper lg:block"
          >
            <div className={`mx-auto grid max-w-[1600px] border-x border-dashed border-line ${activeMenu.columns.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
              {activeMenu.columns.map((column, index) => (
                <div
                  key={column.eyebrow}
                  className={`min-h-56 p-5 ${index < activeMenu.columns.length - 1 ? "border-r border-dashed border-line" : ""}`}
                >
                  <p className="mono-label !text-lime-deep">[ {column.eyebrow} ]</p>
                  <div className="mt-4 grid gap-2">
                    {column.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setActiveMega(null)}
                        className="nav-block group block -mx-2 px-2 py-2"
                      >
                        <span className="font-mono text-xs font-medium uppercase tracking-wider">{link.label}</span>
                        {link.desc && (
                          <span className="mt-1 block text-xs leading-relaxed text-muted group-hover:text-pine-2">
                            {link.desc}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-b border-dashed border-line bg-paper transition-[max-height] duration-300 ease-out lg:hidden ${
          open ? "max-h-[900px]" : "max-h-0 border-b-0"
        }`}
      >
        <nav className="grid gap-5 px-4 py-5" aria-label="Mobile">
          <div className="grid gap-3 border border-dashed border-line p-4">
            <p className="mono-label !text-lime-deep">[ Services ]</p>
            {services.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`${navBlock} ${navText}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="grid gap-3 border border-dashed border-line p-4">
            <p className="mono-label !text-lime-deep">[ Resources ]</p>
            {resources.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`${navBlock} ${navText}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="grid gap-3 border border-dashed border-line p-4">
            <p className="mono-label !text-lime-deep">[ Company ]</p>
            {[...directLinks.filter((link) => link.href === "/about"), { href: "/contact", label: "Contact" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`${navBlock} ${navText}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Cta
            href="/contact"
            variant="ghost"
            showArrow={false}
            className="w-full py-2.5 text-xs"
          >
            Contact
          </Cta>
          <Cta
            href={`/${site.primaryCta.href}`}
            showArrow={false}
            className="w-full py-2.5 text-xs"
          >
            Free audit
          </Cta>
        </nav>
      </div>
    </header>
  );
}
