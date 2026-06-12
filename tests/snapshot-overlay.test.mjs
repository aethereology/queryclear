import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Transpile a pure-ish .ts module and eval it (same pattern as audit-report tests).
function loadTs(relPath) {
  const modPath = path.join(projectRoot, relPath);
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const req = (spec) => {
    throw new Error(`Unexpected runtime import in ${relPath}: ${spec}`);
  };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, req);
  return moduleObj.exports;
}

function readSource(relPath) {
  return fs.readFileSync(path.join(projectRoot, relPath), "utf8");
}

const { site } = loadTs("lib/site.ts");

// Extract LeadForm's interestOptions array from source (it's a client React
// component, so we can't eval it — the array literal is enough).
function leadFormInterestOptions() {
  const src = readSource("components/LeadForm.tsx");
  const match = src.match(/export const interestOptions = \[([\s\S]*?)\] as const/);
  assert.ok(match, "LeadForm must export interestOptions");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

test("every offer.need is null, empty, or a LeadForm interest option", () => {
  const options = leadFormInterestOptions();
  for (const offer of site.offers) {
    assert.ok(
      offer.need === null || offer.need === "" || options.includes(offer.need),
      `offer "${offer.name}" has need "${offer.need}" not in LeadForm interestOptions`,
    );
  }
});

test("exactly one offer navigates instead of opening the overlay: the $497 Audit", () => {
  const navigating = site.offers.filter((o) => o.need === null);
  assert.equal(navigating.length, 1);
  assert.equal(navigating[0].name, "AI Search Audit");
  assert.equal(navigating[0].href, "/ai-visibility-audit");
});

test("primaryCta.href is root-relative so it works as a fallback from any route", () => {
  assert.equal(site.primaryCta.href, "/#audit-cta");
});

test("no callsite still prefixes primaryCta.href with a slash (would yield //#audit-cta)", () => {
  const offenders = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(path.join(projectRoot, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(rel);
      else if (/\.tsx?$/.test(entry.name) && readSource(rel).includes("`/${site.primaryCta.href}`")) {
        offenders.push(rel);
      }
    }
  };
  scan("app");
  scan("components");
  assert.deepEqual(offenders, []);
});

test("SnapshotCta keeps its accessibility and fallback contract", () => {
  const src = readSource("components/SnapshotCta.tsx");
  for (const marker of [
    'role="dialog"',
    "aria-modal",
    "aria-labelledby",
    'aria-label="Close"',
    "useReducedMotion",
    "createPortal",
    "e.preventDefault()",
  ]) {
    assert.ok(src.includes(marker), `SnapshotCta.tsx must contain ${marker}`);
  }
  // The trigger must stay a real anchor with the fallback href (SEO / no-JS).
  assert.match(src, /<motion\.a[\s\S]*?href=\{href\}/, "trigger must render href on an anchor");
});

test("key callsites use SnapshotCta", () => {
  for (const rel of ["components/Header.tsx", "components/Footer.tsx", "app/page.tsx"]) {
    assert.ok(
      readSource(rel).includes("SnapshotCta"),
      `${rel} should render the SnapshotCta overlay trigger`,
    );
  }
});
