"use client";

import { useState } from "react";
import Link from "next/link";
import { Cta, Mark } from "@/components/ui";
import { directLinks, megaMenus, type NavMenu } from "@/lib/navigation";

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
  const [activeMega, setActiveMega] = useState<NavMenu["id"] | null>(null);
  const activeMenu = megaMenus.find((menu) => menu.id === activeMega);
  const megaGridClass =
    activeMenu?.columns.length === 3
      ? "grid-cols-3"
      : activeMenu?.columns.length === 4
        ? "grid-cols-4"
        : "grid-cols-5";

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
              href="/free-audit"
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
            <div className={`mx-auto grid max-w-[1600px] border-x border-dashed border-line ${megaGridClass}`}>
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
          {megaMenus.map((menu) => (
            <div key={menu.id} className="grid gap-3 border border-dashed border-line p-4">
              <button
                type="button"
                aria-expanded={activeMega === menu.id}
                aria-controls={`mobile-${menu.id}`}
                onClick={() => setActiveMega(activeMega === menu.id ? null : menu.id)}
                className="flex items-center justify-between text-left"
              >
                <span className="mono-label !text-lime-deep">[ {menu.label} ]</span>
                <Chevron open={activeMega === menu.id} />
              </button>
              <div
                id={`mobile-${menu.id}`}
                className={`${activeMega === menu.id ? "grid" : "hidden"} gap-4 pt-3`}
              >
                {menu.columns.map((column) => (
                  <div key={column.eyebrow} className="grid gap-2">
                    <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wider text-muted">
                      {column.eyebrow}
                    </p>
                    {column.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setOpen(false);
                          setActiveMega(null);
                        }}
                        className={`${navBlock} ${navText}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="grid gap-3 border border-dashed border-line p-4">
            <p className="mono-label !text-lime-deep">[ Explore ]</p>
            {directLinks.map((link) => (
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
            href="/free-audit"
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
