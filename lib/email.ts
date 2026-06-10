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
  summary?: EmailSummaryItem[];
  steps?: EmailStep[];
  machinePanel?: {
    label: string;
    lines: EmailMachineLine[];
    status?: string;
  };
  closing?: string;
  footerNote?: string;
};

export type AuditLeadEmail = {
  name: string;
  email: string;
  website: string;
  business: string;
  service?: string;
  city?: string;
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

export function renderQueryclearEmail(options: QueryclearEmailOptions) {
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
    preheader: `We received your free AI search audit request for ${lead.business}.`,
    eyebrow: "free AI search audit",
    title: "Your audit request is in.",
    intro: [
      `Hi ${firstName}, thanks for requesting a free AI search audit for ${lead.business}. We have your details and we are reviewing how answer engines understand your site.`,
      "Most audits go out within a couple of business days. You will get a scored report and a prioritized, plain-English fix list.",
    ],
    cta: {
      label: "See a sample audit",
      href: `${siteUrl}/audit`,
    },
    summary: [
      { label: "Business", value: lead.business },
      { label: "Website", value: lead.website, href: lead.website },
      { label: "Service", value: lead.service },
      { label: "Market", value: lead.city },
    ],
    steps: [
      {
        number: "01",
        title: "We inspect the machine view",
        body: "We test how ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews describe your business.",
      },
      {
        number: "02",
        title: "We check the readable signals",
        body: "We review structure, schema, headings, service clarity, proof, crawlability, and conversion paths.",
      },
      {
        number: "03",
        title: "You get the fix list",
        body: "The report explains what matters, what is missing, and what to fix first.",
      },
    ],
    machinePanel: {
      label: "// audit_queue.snapshot",
      lines: [
        { key: "business", value: lead.business },
        { key: "site", value: lead.website },
        { key: "engines", value: "ChatGPT, Claude, Perplexity, Gemini, AI Overviews" },
        { key: "output", value: "scorecard + prioritized fixes" },
      ],
      status: "clear - structured - citable",
    },
    closing: "Questions? Just reply to this email - a real person will answer.",
  });
}

export function renderLeadNotificationEmail(lead: AuditLeadEmail, site?: EmailSite) {
  return renderQueryclearEmail({
    site,
    preheader: `New AI search audit request from ${lead.business}.`,
    eyebrow: "new lead",
    title: "New audit request.",
    intro: [
      `${lead.name} requested a free AI search audit. Reply directly to start the conversation while the context is fresh.`,
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
    `Thanks for requesting a free AI search audit for ${lead.business}. We have your details and we are reviewing how answer engines understand your site.`,
    "",
    "Here's what happens next:",
    "1. We inspect how ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews describe your business.",
    "2. We review structure, schema, headings, service clarity, proof, crawlability, and conversion paths.",
    "3. We send you a scored report with a prioritized, plain-English fix list.",
    "",
    `Most audits go out within a couple of business days. See a sample audit: ${siteUrl}/audit`,
    "",
    "Questions? Just reply to this email - a real person will answer.",
    "",
    "The queryclear team",
  ].join("\n");
}
