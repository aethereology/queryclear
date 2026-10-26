import { site } from "@/lib/site";

export type NavLink = {
  href: string;
  label: string;
  desc?: string;
};

export type NavColumn = {
  eyebrow: string;
  links: NavLink[];
};

export type NavMenu = {
  id: "services" | "resources";
  label: string;
  columns: NavColumn[];
};

export const serviceColumns: NavColumn[] = [
  {
    eyebrow: "Diagnose",
    links: [
      {
        href: "/ai-visibility-audit",
        label: "AI Search Audit",
        desc: "An evidence-linked review with labeled answer samples and a prioritized fix roadmap.",
      },
    ],
  },
  {
    eyebrow: "Improve",
    links: [
      {
        href: site.upgrade.path,
        label: "Website Upgrade",
        desc: `${site.upgrade.priceLabel}: a fixed-scope improvement sprint for the site you already have.`,
      },
      {
        href: "/ai-search-ready-website",
        label: "Website Build",
        desc: `${site.websiteBuild.priceLabel}: a new, client-owned modern-search foundation.`,
      },
      {
        href: "/local-ai-search-optimization",
        label: "Local AI search",
        desc: "Local entity clarity, proof, services, and market coverage.",
      },
      {
        href: "/med-spa-ai-search-optimization",
        label: "Med spa AI search",
        desc: "Treatment pages, honest proof, and structured details for med spas.",
      },
    ],
  },
  {
    eyebrow: "Maintain",
    links: [
      {
        href: site.carePlan.path,
        label: `Care Plan (${site.carePlan.priceLabel})`,
        desc: "Monthly maintenance for sites that pass an eligibility review.",
      },
    ],
  },
];

export const resourceColumns: NavColumn[] = [
  {
    eyebrow: "Learn",
    links: [
      {
        href: "/ai-visibility-stack",
        label: "The AI Visibility Stack",
        desc: "The seven-layer method behind every audit and upgrade.",
      },
      {
        href: "/geo-audit",
        label: "GEO, without the hype",
        desc: "How generative-engine optimization relates to modern SEO.",
      },
    ],
  },
  {
    eyebrow: "Tools & examples",
    links: [
      {
        href: "/free-audit",
        label: "Free readiness preview",
        desc: "Run an automated, read-only readiness preview of your public website.",
      },
      {
        href: "/scorecard",
        label: "Free scorecard",
        desc: "Self-grade your site against the same 100-point rubric.",
      },
      {
        href: "/audit",
        label: "Sample audit",
        desc: "See how scoring and recommendations work in a clearly fictional example.",
      },
    ],
  },
  {
    eyebrow: "Technical guides",
    links: [
      {
        href: "/schema-for-ai-search",
        label: "Schema for AI search",
        desc: "Plain-English structured data guidance.",
      },
      {
        href: "/llms-txt-for-businesses",
        label: "llms.txt for businesses",
        desc: "What it does, what it does not, and how to use it.",
      },
    ],
  },
];

export const megaMenus: NavMenu[] = [
  { id: "services", label: "Services", columns: serviceColumns },
  { id: "resources", label: "Resources", columns: resourceColumns },
];

export const directLinks: NavLink[] = [{ href: "/about", label: "About" }];

export const companyLinks: NavLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/audit-methodology", label: "Audit methodology" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
