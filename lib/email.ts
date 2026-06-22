import type { AuditReportData } from "./agent-runtime";

type EmailSite = {
  name?: string;
  url?: string;
  email?: string;
  description?: string;
  stackKit?: {
    name?: string;
    shipDays?: number;
    terms?: string;
  };
};

type EmailSummaryItem = {
  label: string;
  value?: string;
  href?: string;
};

type EmailStep = {
  number: string;
  title: string;
  body: string;
};

type EmailMachineLine = {
  key: string;
  value: string;
};

export type MarketingAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
};

type QueryclearEmailOptions = {
  site?: EmailSite;
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string[];
  cta?: {
    label: string;
    href: string;
  };
  // Stacked button group, rendered after the single `cta`. Used for offer
  // ladders (e.g. the free-audit follow-up: $497 audit / upgrade / build).
  ctas?: { label: string; href: string; sublabel?: string }[];
  summary?: EmailSummaryItem[];
  steps?: EmailStep[];
  machinePanel?: {
    label: string;
    lines: EmailMachineLine[];
    status?: string;
  };
  closing?: string;
  footerNote?: string;
  // Cold-outreach only: CAN-SPAM compliance block (a physical postal address +
  // an opt-out line) rendered in the footer below the standard disclaimer. Left
  // undefined for every transactional/self-serve email, so those are unchanged.
  complianceFooter?: { address: string; optOut: string };
};

export type AuditLeadEmail = {
  name: string;
  email: string;
  website: string;
  business: string;
  service?: string;
  city?: string;
  interest?: string;
  message?: string;
};

export type StackKitOrderEmail = {
  kitName: string;
  amount: string;
  currency: string;
  name: string;
  email: string;
  sessionId: string;
  shipDays: number;
};

export type AuditOrderEmail = {
  amount: string;
  currency: string;
  name: string;
  email: string;
  sessionId: string;
  website: string;
};

// Email-safe copy of the web brand tokens from app/globals.css. Inline styles
// still reference these values directly because many inboxes strip CSS vars.
export const emailBrandTokens = {
  colors: {
    paper: "#f7f4ee",
    paper2: "#efeae0",
    ink: "#17180f",
    muted: "#5b5a4d",
    pine: "#12352a",
    pine2: "#0c2a21",
    lime: "#b6f03c",
    limeDeep: "#8fcf1f",
    line: "#1718091a",
    machineText: "#cfe8c4",
    machineString: "#e9d9a6",
  },
  // Single quotes only: these are interpolated into double-quoted style=""
  // attributes, where a double quote would terminate the attribute early.
  fonts: {
    display: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif",
    sans: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    mono: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  },
  radius: {
    card: "0px",
  },
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

const defaultDescription =
  "queryclear makes websites easier for search engines and AI answer engines to understand, trust, and recommend.";

function siteValue(site: EmailSite | undefined, key: "name" | "url" | "email") {
  const defaults = {
    name: "queryclear",
    url: "https://www.queryclear.com",
    email: "hello@queryclear.com",
  };

  return site?.[key] || defaults[key];
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

// Logotype instead of a geometric mark: absolute positioning is stripped by
// Gmail/Outlook, so the wordmark + lime period is the only version that renders
// everywhere.
function renderLogotype(siteName: string) {
  const t = emailBrandTokens;
  return `<span style="font-family:${t.fonts.display};font-size:24px;line-height:1;font-weight:700;letter-spacing:-0.01em;color:${t.colors.paper}">${escapeHtml(siteName)}<span style="color:${t.colors.lime}">.</span></span>`;
}

function renderSummary(items: EmailSummaryItem[] = []) {
  const visible = items.filter(
    (item): item is EmailSummaryItem & { value: string } =>
      typeof item.value === "string" && item.value.length > 0,
  );

  if (!visible.length) return "";

  const t = emailBrandTokens;
  const rows = visible
    .map((item) => {
      const value = item.href
        ? `<a href="${escapeHtml(item.href)}" style="color:${t.colors.ink};font-weight:700;text-decoration:underline;text-decoration-color:${t.colors.limeDeep}">${escapeHtml(item.value)}</a>`
        : escapeHtml(item.value);

      return `<tr>
        <td style="padding:10px 16px 10px 0;border-top:1px dashed ${t.colors.line};font-family:${t.fonts.mono};font-size:11px;line-height:1.5;letter-spacing:.12em;text-transform:uppercase;color:${t.colors.muted};white-space:nowrap">${escapeHtml(item.label)}</td>
        <td style="padding:10px 0;border-top:1px dashed ${t.colors.line};font-size:14px;line-height:1.55;color:${t.colors.ink}">${value}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-collapse:collapse">
    ${rows}
  </table>`;
}

function renderSteps(steps: EmailStep[] = []) {
  if (!steps.length) return "";

  const t = emailBrandTokens;
  const items = steps
    .map(
      (step) => `<tr>
        <td style="padding:0 16px 16px 0;vertical-align:top;width:30px">
          <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
            <tr>
              <td style="width:30px;height:30px;border:1px dashed ${t.colors.limeDeep};text-align:center;vertical-align:middle;font-family:${t.fonts.mono};font-size:11px;line-height:1;font-weight:600;color:${t.colors.limeDeep}">${escapeHtml(step.number)}</td>
            </tr>
          </table>
        </td>
        <td style="padding:0 0 16px;vertical-align:top">
          <p style="margin:0 0 4px;font-family:${t.fonts.display};font-size:17px;line-height:1.25;font-weight:700;color:${t.colors.ink};letter-spacing:-0.01em">${escapeHtml(step.title)}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:${t.colors.muted}">${escapeHtml(step.body)}</p>
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;padding:0;border-collapse:collapse">
    ${items}
  </table>`;
}

function renderMachinePanel(panel?: QueryclearEmailOptions["machinePanel"]) {
  if (!panel) return "";

  const t = emailBrandTokens;
  const rows = panel.lines
    .map(
      (line) =>
        `<div style="margin:0 0 5px"><span style="color:${t.colors.lime}">${escapeHtml(line.key)}</span>: <span style="color:${t.colors.machineString}">${escapeHtml(line.value)}</span></div>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;border-collapse:collapse">
    <tr>
      <td style="width:3px;background:${t.colors.lime};font-size:0;line-height:0">&nbsp;</td>
      <td style="padding:18px 20px;background:${t.colors.pine2};border:1px dashed rgba(247,244,238,.22);border-left:0;border-radius:${t.radius.card};font-family:${t.fonts.mono};font-size:12px;line-height:1.7;color:${t.colors.machineText}">
        <div style="margin:0 0 10px;color:rgba(247,244,238,.48)">${escapeHtml(panel.label)}</div>
        ${rows}
        ${
          panel.status
            ? `<div style="margin:12px 0 0;color:${t.colors.lime}">&#9656; ${escapeHtml(panel.status)}</div>`
            : ""
        }
      </td>
    </tr>
  </table>`;
}

function renderCta(cta?: QueryclearEmailOptions["cta"]) {
  if (!cta) return "";

  const t = emailBrandTokens;
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:30px 0 0;border-collapse:collapse">
    <tr>
      <td style="background:${t.colors.lime};border:1px solid ${t.colors.ink};border-radius:${t.radius.card};mso-padding-alt:14px 22px">
        <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 22px;font-family:${t.fonts.mono};font-size:12px;line-height:1.2;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${t.colors.pine2};text-decoration:none">${escapeHtml(cta.label)} &nbsp;&rarr;</a>
      </td>
    </tr>
  </table>`;
}

export function renderCtas(ctas?: QueryclearEmailOptions["ctas"]) {
  if (!ctas || ctas.length === 0) return "";

  const t = emailBrandTokens;
  const buttons = ctas
    .map(
      (c) => `<tr>
      <td style="padding:0 0 10px">
        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
          <tr>
            <td style="background:${t.colors.lime};border:1px solid ${t.colors.ink};border-radius:${t.radius.card};mso-padding-alt:13px 20px">
              <a href="${escapeHtml(c.href)}" style="display:inline-block;padding:13px 20px;font-family:${t.fonts.mono};font-size:12px;line-height:1.2;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${t.colors.pine2};text-decoration:none">${escapeHtml(c.label)} &nbsp;&rarr;</a>
            </td>
          </tr>
        </table>
        ${
          c.sublabel
            ? `<p style="margin:5px 0 0;font-size:12px;line-height:1.5;color:${t.colors.muted}">${escapeHtml(c.sublabel)}</p>`
            : ""
        }
      </td>
    </tr>`,
    )
    .join("");

  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;border-collapse:collapse">
    ${buttons}
  </table>`;
}

function renderQueryclearEmail(options: QueryclearEmailOptions) {
  const t = emailBrandTokens;
  const siteName = siteValue(options.site, "name");
  const siteUrl = siteValue(options.site, "url");
  const siteEmail = siteValue(options.site, "email");
  const footerNote =
    options.footerNote ||
    "We improve the structure and clarity search systems can read. We do not guarantee rankings or AI citations.";

  const introHtml = options.intro
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:${t.colors.muted}">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(siteName)}</title>
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
    <!--<![endif]-->
    <style>
      :root { color-scheme: light; supported-color-schemes: light; }
      :root {
        --color-paper: ${t.colors.paper};
        --color-paper-2: ${t.colors.paper2};
        --color-ink: ${t.colors.ink};
        --color-muted: ${t.colors.muted};
        --color-pine: ${t.colors.pine};
        --color-pine-2: ${t.colors.pine2};
        --color-lime: ${t.colors.lime};
        --color-lime-deep: ${t.colors.limeDeep};
        --color-line: ${t.colors.line};
        --font-display: ${t.fonts.display};
        --font-sans: ${t.fonts.sans};
        --font-mono: ${t.fonts.mono};
        --radius-card: ${t.radius.card};
        --ease: ${t.ease};
      }
      @media screen and (max-width: 620px) {
        .qc-shell { width: 100% !important; }
        .qc-pad { padding-left: 22px !important; padding-right: 22px !important; }
        .qc-title { font-size: 34px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${t.colors.paper2};font-family:${t.fonts.sans};color:${t.colors.ink};-webkit-font-smoothing:antialiased">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${escapeHtml(options.preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:${t.colors.paper2};border-collapse:collapse">
      <tr>
        <td align="center" style="padding:34px 14px">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" class="qc-shell" style="width:640px;max-width:640px;border-collapse:collapse;background:${t.colors.paper};border:1px solid ${t.colors.line};border-radius:${t.radius.card}">
            <tr>
              <td style="height:4px;background:${t.colors.lime};font-size:0;line-height:0">&nbsp;</td>
            </tr>
            <tr>
              <td class="qc-pad" style="padding:20px 34px;background:${t.colors.pine}">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                  <tr>
                    <td style="vertical-align:middle">
                      ${renderLogotype(siteName)}
                    </td>
                    <td align="right" style="vertical-align:middle;font-family:${t.fonts.mono};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(247,244,238,.55)">
                      AI search optimization
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="qc-pad" style="padding:38px 34px 36px;background:${t.colors.paper}">
                <p style="margin:0 0 18px;font-family:${t.fonts.mono};font-size:11px;line-height:1.4;letter-spacing:.16em;text-transform:uppercase;color:${t.colors.muted}"><span style="color:${t.colors.limeDeep}">[ received ]</span> ${escapeHtml(options.eyebrow)}</p>
                <h1 class="qc-title" style="margin:0 0 20px;font-family:${t.fonts.display};font-size:40px;line-height:1.05;font-weight:700;letter-spacing:-0.02em;color:${t.colors.ink}">${escapeHtml(options.title)}</h1>
                ${introHtml}
                ${renderCta(options.cta)}
                ${renderCtas(options.ctas)}
                ${renderSummary(options.summary)}
                ${renderSteps(options.steps)}
                ${renderMachinePanel(options.machinePanel)}
                ${
                  options.closing
                    ? `<p style="margin:26px 0 0;font-size:15px;line-height:1.65;color:${t.colors.ink}">${escapeHtml(options.closing)}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td class="qc-pad" style="padding:24px 34px;background:${t.colors.pine};color:${t.colors.paper}">
                <p style="margin:0 0 10px;font-family:${t.fonts.mono};font-size:10px;line-height:1.4;letter-spacing:.16em;text-transform:uppercase;color:rgba(247,244,238,.45)">${escapeHtml(siteName)} &middot; <a href="${escapeHtml(siteUrl)}" style="color:${t.colors.lime};text-decoration:none">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:rgba(247,244,238,.78)">${escapeHtml(options.site?.description || defaultDescription)}</p>
                <p style="margin:0;font-size:12px;line-height:1.55;color:rgba(247,244,238,.58)">${escapeHtml(footerNote)} Contact: <a href="mailto:${escapeHtml(siteEmail)}" style="color:${t.colors.lime};text-decoration:none">${escapeHtml(siteEmail)}</a></p>
                ${
                  options.complianceFooter
                    ? `<p style="margin:12px 0 0;font-size:11px;line-height:1.55;color:rgba(247,244,238,.5)">${escapeHtml(options.complianceFooter.optOut)}<br>${escapeHtml(options.complianceFooter.address)}</p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderAuditConfirmationEmail(lead: AuditLeadEmail, site?: EmailSite) {
  const firstName = lead.name.trim().split(/\s+/)[0] || "there";
  const siteUrl = siteValue(site, "url");

  return renderQueryclearEmail({
    site,
    preheader: `We received your website inquiry for ${lead.business}.`,
    eyebrow: "website inquiry",
    title: "Your inquiry is in.",
    intro: [
      `Hi ${firstName}, thanks for reaching out about ${lead.business}. We have your details and we are taking a first look at how modern search understands your site.`,
      "A real person will reply within a couple of business days with a few specifics about your site and a recommended next step — whether that's an upgrade to the site you have or a new build.",
    ],
    cta: {
      label: "Run a free audit while you wait",
      href: `${siteUrl}/free-audit`,
    },
    summary: [
      { label: "Business", value: lead.business },
      { label: "Website", value: lead.website, href: lead.website },
      { label: "Interested in", value: lead.interest },
      { label: "Service", value: lead.service },
      { label: "Market", value: lead.city },
    ],
    steps: [
      {
        number: "01",
        title: "We review your site",
        body: "We look at structure, schema, headings, service clarity, proof, crawlability, and conversion paths.",
      },
      {
        number: "02",
        title: "We check the machine view",
        body: "We test how ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews describe your business.",
      },
      {
        number: "03",
        title: "We send a scoped recommendation",
        body: "A plain-English next step — upgrade or build — with what to fix first and what it takes.",
      },
    ],
    machinePanel: {
      label: "// inquiry_queue",
      lines: [
        { key: "business", value: lead.business },
        { key: "site", value: lead.website },
        { key: "interest", value: lead.interest || "not specified" },
        { key: "output", value: "scoped recommendation + next steps" },
      ],
      status: "received - awaiting review",
    },
    closing: "Questions? Just reply to this email - a real person will answer.",
  });
}

export function renderLeadNotificationEmail(lead: AuditLeadEmail, site?: EmailSite) {
  return renderQueryclearEmail({
    site,
    preheader: `New website inquiry from ${lead.business}.`,
    eyebrow: "new lead",
    title: "New website inquiry.",
    intro: [
      `${lead.name} sent a website inquiry. Reply directly to start the conversation while the context is fresh.`,
    ],
    cta: {
      label: "Reply to lead",
      href: `mailto:${lead.email}`,
    },
    summary: [
      { label: "Name", value: lead.name },
      { label: "Email", value: lead.email, href: `mailto:${lead.email}` },
      { label: "Website", value: lead.website, href: lead.website },
      { label: "Business", value: lead.business },
      { label: "Interested in", value: lead.interest },
      { label: "Service", value: lead.service },
      { label: "Market", value: lead.city },
      { label: "Message", value: lead.message },
    ],
    machinePanel: {
      label: "// lead_intake.json",
      lines: [
        { key: "name", value: lead.name },
        { key: "business", value: lead.business },
        { key: "website", value: lead.website },
        { key: "email", value: lead.email },
      ],
      status: "accepted - awaiting review",
    },
  });
}

export type PublicAuditLeadEmail = {
  email: string;
  domainUrl: string;
  source: "report-unlock" | "capacity-gate";
  attribution?: MarketingAttribution;
};

function attributionSummary(attribution?: MarketingAttribution) {
  if (!attribution) return undefined;
  const parts = [
    attribution.utmSource ? `source=${attribution.utmSource}` : "",
    attribution.utmMedium ? `medium=${attribution.utmMedium}` : "",
    attribution.utmCampaign ? `campaign=${attribution.utmCampaign}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : undefined;
}

function attributionMachineLines(attribution?: MarketingAttribution): EmailMachineLine[] {
  if (!attribution) return [];
  return [
    attribution.utmSource ? { key: "utm_source", value: attribution.utmSource } : null,
    attribution.utmMedium ? { key: "utm_medium", value: attribution.utmMedium } : null,
    attribution.utmCampaign ? { key: "utm_campaign", value: attribution.utmCampaign } : null,
    attribution.utmContent ? { key: "utm_content", value: attribution.utmContent } : null,
    attribution.utmTerm ? { key: "utm_term", value: attribution.utmTerm } : null,
    attribution.referrer ? { key: "referrer", value: attribution.referrer } : null,
    attribution.landingPath ? { key: "landing", value: attribution.landingPath } : null,
  ].filter((line): line is EmailMachineLine => Boolean(line));
}

// Team-notify for a lead captured by the free /free-audit tool. Lighter than the
// rich Snapshot template — the public tool only collects email + the domain they
// audited. "capacity-gate" means the daily cap was hit and we owe them an audit.
export function renderPublicAuditLeadEmail(lead: PublicAuditLeadEmail, site?: EmailSite) {
  const gated = lead.source === "capacity-gate";
  const attribution = attributionSummary(lead.attribution);
  return renderQueryclearEmail({
    site,
    preheader: `New free-audit lead: ${lead.email} (${lead.domainUrl}).`,
    eyebrow: "free audit lead",
    title: gated ? "Audit lead (over daily cap)." : "New free-audit lead.",
    intro: [
      gated
        ? `${lead.email} requested a free audit for ${lead.domainUrl} after the daily cap was hit — run it manually and send it over.`
        : `${lead.email} ran a free audit for ${lead.domainUrl} and unlocked the full report. Good moment to follow up.`,
    ],
    cta: { label: "Reply to lead", href: `mailto:${lead.email}` },
    summary: [
      { label: "Email", value: lead.email, href: `mailto:${lead.email}` },
      { label: "Website", value: lead.domainUrl, href: lead.domainUrl },
      { label: "Source", value: gated ? "capacity gate (owe audit)" : "report unlock" },
      { label: "Attribution", value: attribution },
      { label: "Landing page", value: lead.attribution?.landingPath },
    ],
    machinePanel: {
      label: "// free_audit.lead",
      lines: [
        { key: "email", value: lead.email },
        { key: "site", value: lead.domainUrl },
        { key: "source", value: lead.source },
        ...attributionMachineLines(lead.attribution),
      ],
      status: gated ? "queued - run manually" : "report delivered",
    },
  });
}

// Prospect-facing email sent when someone unlocks their free /free-audit report.
// Carries the headline + the prioritized fix list (the most actionable part), then
// the paid next steps. Honest framing: the free audit is an instant read-only read;
// the $497 audit ADDS depth — never implies they're paying for what they got free.
export function renderPublicAuditReportEmail(
  report: AuditReportData,
  opts: { siteUrl: string },
  site?: EmailSite,
) {
  const domain = report.domain_url;
  const issues = report.findings.length;
  const invisible = report.queries.filter((q) => q.cited_count === 0).length;
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const siteUrl = opts.siteUrl.replace(/\/$/, "");

  const intro = [
    `We ran a free AI Search Audit on ${domain}: ${issues} technical ${plural(issues, "issue", "issues")} and ${invisible} ${plural(invisible, "query", "queries")} where AI answer engines didn't cite you. Your prioritized fix list is below.`,
  ];
  if (report.detected_voice) {
    intro.push(`We also picked up your brand voice — "${report.detected_voice}" — and wrote the sample fix to match it.`);
  }

  const steps = report.recommendations.slice(0, 5).map((r) => ({
    number: String(r.rank).padStart(2, "0"),
    title: r.title,
    body: r.action,
  }));

  return renderQueryclearEmail({
    site,
    preheader: `Your AI Search Audit for ${domain}.`,
    eyebrow: "free AI search audit",
    title: `Your audit for ${domain}.`,
    intro,
    steps,
    ctas: [
      {
        label: "Get the full $497 audit",
        href: `${siteUrl}/ai-visibility-audit`,
        sublabel: "Full prompt testing, scoring across seven layers, and a prioritized roadmap.",
      },
      {
        label: "Upgrade my site",
        href: `${siteUrl}/contact`,
        sublabel: "Done-for-you fixes to the site you have — from $2,500.",
      },
      {
        label: "Talk about a build",
        href: `${siteUrl}/contact`,
        sublabel: "A new, search-ready website — from $6,500.",
      },
    ],
    closing: "Questions? Just reply to this email — a real person will answer.",
  });
}

// Plain, personal email shell — deliberately minimal (no branded chrome, logo, or
// buttons). For COLD first-touch outreach the goal is that it reads like a human
// typed it in Outlook: that earns more replies + better inboxing than a designed
// marketing template (the branded design lives on the report page they click to).
function renderPlainEmail(opts: { preheader: string; bodyHtml: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.6">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(opts.preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr>
        <td align="left" style="padding:24px">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:560px;max-width:560px;border-collapse:collapse">
            <tr><td style="font-size:16px;line-height:1.6;color:#1a1a1a">${opts.bodyHtml}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Copilot",
  "bing copilot": "Bing Copilot",
  "google ai overviews": "Google's AI Overviews",
};
function prettyEngine(engine: string): string {
  return ENGINE_LABELS[engine.trim().toLowerCase()] ?? engine;
}

// Cold-outreach email — conversation-first and plain (NOT the branded template).
// Teases ONE honest finding, then links to the full pre-unlocked report (where the
// offers live). Honesty guardrail: AI-visibility results are modeled ESTIMATES
// unless `measured`, so an estimated finding never claims a live "I asked X and you
// weren't there". Carries a CAN-SPAM footer (postal address + opt-out).
export function renderOutreachAuditEmail(
  report: AuditReportData,
  opts: { siteUrl: string; postalAddress: string; reportUrl: string; businessName?: string },
  site?: EmailSite,
) {
  const domain = report.domain_url;
  const biz = (opts.businessName && opts.businessName.trim()) || domain;
  const siteName = siteValue(site, "name");
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const p = (html: string) => `<p style="margin:0 0 16px">${html}</p>`;

  const issues = report.findings.length;
  const uncited = report.queries.filter((q) => q.cited_count === 0);
  // Prefer a genuinely measured uncited query (we can state it as fact); else the
  // first estimated one (phrased softly); else fall back to the top recommendation.
  const usedQuery = uncited.find((q) => q.measured) ?? uncited[0] ?? null;

  let hook: string;
  if (usedQuery) {
    const engine = escapeHtml(prettyEngine(usedQuery.engine));
    const q = escapeHtml(usedQuery.query);
    hook = usedQuery.measured
      ? `When I checked ${engine} for <strong>&ldquo;${q}&rdquo;</strong>, ${escapeHtml(biz)} didn&rsquo;t come up.`
      : `For a question like <strong>&ldquo;${q}&rdquo;</strong>, ${escapeHtml(biz)}&rsquo;s site isn&rsquo;t set up to be the answer assistants like ${engine} hand back yet.`;
  } else if (report.recommendations[0]) {
    hook = `The biggest thing I spotted: ${escapeHtml(report.recommendations[0].title)}.`;
  } else {
    hook = `I took a quick look at how AI assistants read ${escapeHtml(domain)}.`;
  }

  const remainingQueries = usedQuery ? Math.max(0, uncited.length - 1) : uncited.length;
  const moreParts: string[] = [];
  if (remainingQueries > 0)
    moreParts.push(`${remainingQueries} other ${plural(remainingQueries, "question", "questions")} people ask turn up the same way`);
  if (issues > 0)
    moreParts.push(`${issues} technical ${plural(issues, "issue", "issues")} on the page making you harder for these tools to read`);
  const moreLine = moreParts.length
    ? `I also found ${moreParts.join(", and ")}. None of it is complicated to fix.`
    : `The good news: it&rsquo;s all fixable.`;

  const voiceBit = report.detected_voice
    ? `, plus a sample fix written to match how ${escapeHtml(biz)} already sounds`
    : "";
  const link = escapeHtml(opts.reportUrl);
  const domainLabel = escapeHtml(opts.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  const footerText = `You're getting this one-time note because ${biz} is publicly listed. Not interested? Reply "unsubscribe" and I'll remove you right away.`;

  const body = [
    p(`Hi &mdash; I&rsquo;m Kyle. I run ${escapeHtml(siteName)} (a SparkCreatives Inc. brand), and I spend my days on how AI assistants answer the questions people ask right before they buy.`),
    p(hook),
    p(moreLine),
    p(`I pulled the whole thing into a short report &mdash; every issue in priority order${voiceBit}. It&rsquo;s already unlocked for you, no sign-up:`),
    `<p style="margin:0 0 20px"><a href="${link}" style="color:#12352a;font-weight:700;text-decoration:underline">View your AI search audit for ${escapeHtml(domain)} &rarr;</a></p>`,
    p(`If it&rsquo;s not useful or not the right time, just reply and I&rsquo;ll leave you be.`),
    `<p style="margin:0 0 2px">Kyle</p><p style="margin:0;color:#5b5a4d;font-size:14px">${escapeHtml(siteName)} &middot; ${domainLabel}</p>`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:28px 0 0"><tr><td style="border-top:1px solid #e5e2da;padding-top:14px;font-size:12px;line-height:1.5;color:#8a897d">${escapeHtml(footerText)}<br>${escapeHtml(opts.postalAddress)}</td></tr></table>`,
  ].join("");

  return renderPlainEmail({ preheader: `A quick AI search audit I ran for ${domain}.`, bodyHtml: body });
}

// Team-notify the FIRST time a cold-outreach prospect opens their report link — the
// signal they've gone warm and the moment to follow up. Branded (team-facing) is fine.
export function renderOutreachViewNotifyEmail(
  opts: { domainUrl: string; reportUrl: string },
  site?: EmailSite,
) {
  const href = opts.domainUrl.startsWith("http") ? opts.domainUrl : `https://${opts.domainUrl}`;
  return renderQueryclearEmail({
    site,
    preheader: `${opts.domainUrl} opened their outreach audit.`,
    eyebrow: "outreach signal",
    title: "A prospect opened their audit.",
    intro: [
      `${opts.domainUrl} just opened the audit report you sent — a warm signal, and a good moment to follow up.`,
    ],
    cta: { label: "Open the report", href: opts.reportUrl },
    summary: [
      { label: "Website", value: opts.domainUrl, href },
      { label: "Report", value: opts.reportUrl, href: opts.reportUrl },
    ],
    machinePanel: {
      label: "// outreach.signal",
      lines: [
        { key: "event", value: "report_opened" },
        { key: "site", value: opts.domainUrl },
      ],
      status: "warm - follow up",
    },
  });
}

// Team-notify when someone buys the $497 AI Search Audit via Stripe Checkout.
// The audit is human-delivered, so the buyer's website (captured as a Stripe
// custom field) is the key field — it's what we need to start fulfillment.
export function renderAuditOrderEmail(order: AuditOrderEmail, site?: EmailSite) {
  const who = order.name === "—" ? order.email : order.name;
  return renderQueryclearEmail({
    site,
    preheader: `New AI Search Audit purchase from ${who} (${order.website || "no site given"}).`,
    eyebrow: "new order",
    title: "AI Search Audit purchased.",
    intro: [
      `${who} bought the $497 AI Search Audit. Stripe has recorded the payment; this is your fulfillment cue.`,
      "Run the audit and send the report to the email on file — aim for a couple of business days.",
    ],
    summary: [
      { label: "Website", value: order.website || "(not provided — ask the buyer)", href: order.website || undefined },
      { label: "Amount", value: `$${order.amount} ${order.currency}` },
      { label: "Name", value: order.name },
      { label: "Email", value: order.email, href: order.email === "unknown" ? undefined : `mailto:${order.email}` },
      { label: "Session", value: order.sessionId },
    ],
    machinePanel: {
      label: "// audit.order",
      lines: [
        { key: "product", value: "AI Search Audit ($497)" },
        { key: "site", value: order.website || "unknown" },
        { key: "amount", value: `$${order.amount} ${order.currency}` },
      ],
      status: "paid - fulfillment required",
    },
    footerNote: "Paid AI Search Audit. We deliver the scored report to the buyer; refunds handled case-by-case if we can't complete it.",
  });
}

export function renderStackKitOrderEmail(order: StackKitOrderEmail, site?: EmailSite) {
  const kitName = order.kitName || site?.stackKit?.name || "The Local AI Visibility Stack";

  return renderQueryclearEmail({
    site,
    preheader: `New Stack Kit pre-order from ${order.name === "-" ? order.email : order.name}.`,
    eyebrow: "new pre-order",
    title: "Stack Kit order received.",
    intro: [
      `${order.name} purchased ${kitName}. Stripe has recorded the payment; this notification is for fulfillment tracking.`,
      `Founding pre-order terms: ship within ${order.shipDays} days or auto-refund.`,
    ],
    summary: [
      { label: "Kit", value: kitName },
      { label: "Amount", value: `$${order.amount} ${order.currency}` },
      { label: "Name", value: order.name },
      { label: "Email", value: order.email, href: order.email === "unknown" ? undefined : `mailto:${order.email}` },
      { label: "Session", value: order.sessionId },
    ],
    machinePanel: {
      label: "// stack_kit.preorder",
      lines: [
        { key: "product", value: kitName },
        { key: "amount", value: `$${order.amount} ${order.currency}` },
        { key: "ship_by", value: `${order.shipDays} days after purchase` },
      ],
      status: "paid - fulfillment required",
    },
    footerNote: "Founding pre-order. Fully refundable before delivery; auto-refund if the kit misses the delivery window.",
  });
}

export function renderAuditConfirmationText(lead: AuditLeadEmail, site?: EmailSite) {
  const firstName = lead.name.trim().split(/\s+/)[0] || "there";
  const siteUrl = siteValue(site, "url");

  return [
    `Hi ${firstName},`,
    "",
    `Thanks for reaching out about ${lead.business}. We have your details and we are taking a first look at how modern search understands your site.`,
    ...(lead.interest ? ["", `You told us you're interested in: ${lead.interest}.`] : []),
    "",
    "Here's what happens next:",
    "1. We review your site's structure, schema, headings, service clarity, proof, crawlability, and conversion paths.",
    "2. We check how ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews describe your business.",
    "3. We reply with a plain-English, scoped recommendation — upgrade or build — and what to fix first.",
    "",
    `A real person will reply within a couple of business days. Want a free read right now? Run a free audit: ${siteUrl}/free-audit`,
    "",
    "Questions? Just reply to this email - a real person will answer.",
    "",
    "The queryclear team",
  ].join("\n");
}
