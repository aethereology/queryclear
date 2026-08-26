const production = process.argv.includes("--production");
const failures = [];
const warnings = [];

const value = (name) => (process.env[name] ?? "").trim();
const present = (name) => Boolean(value(name));
const requireCheck = (ok, message) => {
  if (!ok) failures.push(message);
};
const warnCheck = (ok, message) => {
  if (!ok) warnings.push(message);
};

let siteUrl;
try {
  siteUrl = new URL(value("NEXT_PUBLIC_SITE_URL"));
} catch {
  siteUrl = null;
}
requireCheck(siteUrl?.protocol === "https:", "NEXT_PUBLIC_SITE_URL must be a valid HTTPS URL.");
if (production) {
  requireCheck(
    siteUrl?.origin === "https://www.queryclear.com",
    "Production NEXT_PUBLIC_SITE_URL must be https://www.queryclear.com.",
  );
}

const gaMeasurementId = value("NEXT_PUBLIC_GA_MEASUREMENT_ID");
if (production) {
  requireCheck(
    /^G-[A-Z0-9]{6,20}$/i.test(gaMeasurementId),
    "Production NEXT_PUBLIC_GA_MEASUREMENT_ID must be a valid GA4 measurement ID.",
  );
} else {
  warnCheck(
    !gaMeasurementId || /^G-[A-Z0-9]{6,20}$/i.test(gaMeasurementId),
    "NEXT_PUBLIC_GA_MEASUREMENT_ID is present but invalid; analytics will remain disabled.",
  );
}

requireCheck(
  present("KV_REST_API_URL") && present("KV_REST_API_TOKEN"),
  "Both KV_REST_API_URL and KV_REST_API_TOKEN are required.",
);
requireCheck(present("RESEND_API_KEY"), "RESEND_API_KEY is required.");
requireCheck(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("LEAD_TO")), "LEAD_TO must be an email address.");
requireCheck(/<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(value("LEAD_FROM")), "LEAD_FROM must use Name <email@example.com> format.");

const stripeKey = value("STRIPE_SECRET_KEY");
requireCheck(
  production ? /^(?:sk|rk)_live_/.test(stripeKey) : /^(?:sk|rk)_/.test(stripeKey),
  production
    ? "Production STRIPE_SECRET_KEY must be a live-mode key."
    : "STRIPE_SECRET_KEY is required.",
);
requireCheck(value("STRIPE_WEBHOOK_SECRET").startsWith("whsec_"), "STRIPE_WEBHOOK_SECRET is required.");

const auditCheckoutPaused = value("AUDIT_CHECKOUT_PAUSED").toLowerCase();
if (production) {
  requireCheck(
    auditCheckoutPaused === "false",
    "Production AUDIT_CHECKOUT_PAUSED must be explicitly false before paid-audit launch.",
  );
} else {
  warnCheck(
    auditCheckoutPaused === "false",
    "AUDIT_CHECKOUT_PAUSED is not false; paid-audit checkout will remain closed.",
  );
}

requireCheck(
  present("BLOB_READ_WRITE_TOKEN") || present("BLOB_STORE_ID"),
  "Private reports require BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID/OIDC.",
);
const reportSecret = value("REPORT_ACCESS_SECRET");
requireCheck(
  reportSecret.length >= 32 && !/^(change|replace|example|test)/i.test(reportSecret),
  "REPORT_ACCESS_SECRET must be a unique secret of at least 32 characters.",
);

let runtimeUrl;
try {
  runtimeUrl = new URL(value("AGENT_RUNTIME_URL"));
} catch {
  runtimeUrl = null;
}
requireCheck(runtimeUrl?.protocol === "https:", "AGENT_RUNTIME_URL must be HTTPS.");
requireCheck(
  value("AGENT_RUNTIME_SHARED_SECRET").length >= 32,
  "AGENT_RUNTIME_SHARED_SECRET must be at least 32 characters.",
);

warnCheck(value("CRON_SECRET").length >= 32, "CRON_SECRET is absent or shorter than 32 characters.");
warnCheck(
  present("QSTASH_CURRENT_SIGNING_KEY") && present("QSTASH_NEXT_SIGNING_KEY"),
  "QStash signing keys are not both configured; scheduled automation must remain off.",
);
warnCheck(
  value("OUTREACH_PAUSED").toLowerCase() === "true",
  "OUTREACH_PAUSED is not true; do not enable outreach until its launch gates are signed.",
);
warnCheck(present("RESEND_WEBHOOK_SECRET"), "RESEND_WEBHOOK_SECRET is missing; bounce suppression cannot run.");

for (const message of failures) process.stdout.write(`FAIL ${message}\n`);
for (const message of warnings) process.stdout.write(`WARN ${message}\n`);
if (!failures.length) process.stdout.write("PASS Core launch environment names and formats are present.\n");
process.exitCode = failures.length ? 1 : 0;
