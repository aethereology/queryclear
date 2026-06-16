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
    eyebrow: "Operate",
    links: [
      {
        href: "/ai-search-operator",
        label: "AI Search Operator",
        desc: "An agent that does the modern-search work continuously — you approve every move. Early access.",
      },
    ],
  },
  {
    eyebrow: "Diagnose",
    links: [
      {
        href: "/ai-visibility-audit",
        label: "AI Search Audit",
        desc: "A scored modern-search review with prompt testing and a prioritized fix roadmap.",
      },
    ],
  },
  {
    eyebrow: "Improve",
    links: [
      {
        href: "/#offers",
        label: "Website Upgrade",
        desc: "Done-for-you improvements to service pages, metadata, schema, links, and conversion paths.",
      },
      {
        href: "/ai-search-ready-website",
        label: "AI-search-ready websites",
        desc: "Build and optimize pages that people trust and machines can parse.",
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
    eyebrow: "DIY",
    links: [
      {
        href: site.stackKit.path,
        label: `DIY kit (${site.stackKit.priceLabel})`,
        desc: "A refundable founding pre-order for hands-on owners.",
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
    eyebrow: "Tools & proof",
    links: [
      {
        href: "/scorecard",
        label: "Free scorecard",
        desc: "Self-grade your site against the same 100-point rubric.",
      },
      {
        href: "/audit",
        label: "Sample audit",
        desc: "See how the scoring and recommendations work.",
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
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
