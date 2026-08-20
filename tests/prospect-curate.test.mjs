import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// lib/prospect-curate.ts has only type-only imports (elided by the compiler) —
// self-contained, no stubs needed.
function loadTs(relPath) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

const { curateBatch } = loadTs("lib/prospect-curate.ts");

// Archetypes drawn from the real 120→54 Jacksonville pass documented in
// docs/marketing/outreach/2026-07-06-medspa-jacksonville-batch.md — synthetic
// stand-ins (not the real scraped data) that match each named drop reason.
const RAW_ITEMS = [
  // keep: clean med-spa with a real business email
  { title: "Hello Smooth Med Spa", website: "https://hellosmooth.com", email: "owner@hellosmooth.com", categoryName: "Medical spa", city: "Jacksonville" },
  // drop: no email at all (like Hydro Med Spa / Be Still Wellness in the batch doc)
  { title: "Hydro Med Spa", website: "https://hydromedspa.com", categoryName: "Medical spa", city: "Jacksonville" },
  // drop: godaddy filler email
  { title: "Placeholder Spa Site", website: "https://placeholderspa.com", email: "filler@godaddy.com", categoryName: "Medical spa" },
  // drop: booking-platform support address (Vagaro)
  { title: "Booking Page Spa", website: "https://bookingpagespa.com", email: "support@vagaro.com", categoryName: "Medical spa" },
  // drop: national chain (Ulta)
  { title: "Ulta Beauty", website: "https://ulta.com", email: "info@ulta.com", categoryName: "Beauty retailer" },
  // drop: health system (Baptist)
  { title: "Baptist Health Aesthetics", website: "https://baptisthealth.example", email: "info@baptisthealth.example", categoryName: "Health system" },
  // drop: school/institute
  { title: "Parisian Spa Institute", website: "https://parisianspainstitute.example", email: "admissions@parisianspainstitute.example", categoryName: "Massage school" },
  // drop: careers-only mailbox
  { title: "Park Ave Dermatology", website: "https://parkavederm.example", email: "careers@parkavederm.example", categoryName: "Dermatology" },
  // keep: franchise LOCATION with a location-specific email/domain (not HQ)
  { title: "VIO Med Spa - Riverside", website: "https://riverside.viomedspa.com", email: "riverside@viomedspa.com", categoryName: "Medical spa" },
  { title: "VIO Med Spa - Southside", website: "https://southside.viomedspa.com", email: "southside@viomedspa.com", categoryName: "Medical spa" },
  // drop: permanently closed
  { title: "Closed Spa", website: "https://closedspa.example", email: "info@closedspa.example", categoryName: "Medical spa", permanentlyClosed: true },
  // drop (dedup): same domain as the first kept item, should be dropped as a duplicate
  { title: "Hello Smooth Med Spa (dup listing)", website: "http://www.hellosmooth.com/", email: "info@hellosmooth.com", categoryName: "Medical spa" },
];

test("keeps clean prospects with a valid business email", () => {
  const { kept } = curateBatch(RAW_ITEMS, "med-spa");
  assert.ok(kept.some((p) => p.email === "owner@hellosmooth.com"));
});

test("drops prospects with no email found", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  const hit = dropped.find((d) => d.title === "Hydro Med Spa");
  assert.equal(hit.reason, "no-email");
});

test("drops junk/booking-platform emails (godaddy filler, Vagaro support)", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Placeholder Spa Site").reason, "junk-email-domain");
  assert.equal(dropped.find((d) => d.title === "Booking Page Spa").reason, "junk-email-domain");
});

test("drops national chains and health systems as poor-fit", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Ulta Beauty").reason, "poor-fit-chain-or-institution");
  assert.equal(dropped.find((d) => d.title === "Baptist Health Aesthetics").reason, "poor-fit-chain-or-institution");
});

test("drops schools/institutes as poor-fit", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Parisian Spa Institute").reason, "poor-fit-chain-or-institution");
});

test("drops careers-only mailboxes", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Park Ave Dermatology").reason, "careers-mailbox");
});

test("drops permanently closed places", () => {
  const { dropped } = curateBatch(RAW_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Closed Spa").reason, "closed");
});

test("keeps BOTH franchise locations — location-specific emails/domains are not treated as HQ duplicates", () => {
  const { kept } = curateBatch(RAW_ITEMS, "med-spa");
  const emails = kept.map((p) => p.email);
  assert.ok(emails.includes("riverside@viomedspa.com"));
  assert.ok(emails.includes("southside@viomedspa.com"));
});

test("dedupes a second listing for the same domain (www./trailing-slash normalized)", () => {
  const { kept } = curateBatch(RAW_ITEMS, "med-spa");
  const helloSmoothEntries = kept.filter((p) => p.domainUrl.includes("hellosmooth.com"));
  assert.equal(helloSmoothEntries.length, 1, "only the first hellosmooth.com listing survives");
  assert.equal(helloSmoothEntries[0].email, "owner@hellosmooth.com", "first-seen email wins");
});

test("tags every kept prospect with the vertical and apify source", () => {
  const { kept } = curateBatch(RAW_ITEMS, "med-spa");
  for (const p of kept) {
    assert.equal(p.vertical, "med-spa");
    assert.equal(p.source, "apify");
  }
});

// ── leaks found in the live ledger 2026-08-20 ──────────────────────────────
// These three reached the outreach ledger, got emailed, and were queued for a
// sales call before being caught by hand. Each one is a distinct hole:
// a franchise the denylist didn't name, and two vendors that sell TO our
// verticals (so they rank for the same queries but can never buy).
const LEAKED_ITEMS = [
  // National franchise — the local unit can't change the site. Note the brand
  // appears only in the title and the domain, never the category.
  { title: "Massage Envy", website: "https://locations.massageenvy.com/florida/west-palm-beach/851-village-blvd.html",
    email: "info@massageenvy.com", categoryName: "Massage spa", city: "West Palm Beach" },
  // Sells dental marketing — a competitor, not a prospect.
  { title: "Dental Directory Services", website: "https://www.dentaldirectoryservices.com/contact-us",
    email: "info@dentaldirectoryservices.com", categoryName: "Marketing agency", city: "West Palm Beach" },
  // National dental savings plans — the giveaway is the category, not the name.
  { title: "Patriot Health, Inc.", website: "http://www.patriothealth.com/",
    email: "info@patriothealth.com", categoryName: "Insurance agency", city: "West Palm Beach" },
  // Control: a real local practice must still survive these new rules.
  { title: "Riverside Family Dentistry", website: "https://riversidefamilydental.com",
    email: "hello@riversidefamilydental.com", categoryName: "Dentist", city: "Jacksonville" },
];

test("drops national franchises even when the brand is only in the title/domain", () => {
  const { dropped } = curateBatch(LEAKED_ITEMS, "med-spa");
  assert.equal(dropped.find((d) => d.title === "Massage Envy").reason, "poor-fit-chain-or-institution");
});

test("drops businesses that sell TO our verticals (competitors, not prospects)", () => {
  const { dropped } = curateBatch(LEAKED_ITEMS, "dental");
  assert.equal(dropped.find((d) => d.title === "Dental Directory Services").reason, "sells-to-our-market");
  assert.equal(dropped.find((d) => d.title === "Patriot Health, Inc.").reason, "sells-to-our-market");
});

test("the new denylists do not drop a real local practice", () => {
  const { kept } = curateBatch(LEAKED_ITEMS, "dental");
  assert.equal(kept.length, 1, "only the control survives");
  assert.equal(kept[0].businessName, "Riverside Family Dentistry");
});
