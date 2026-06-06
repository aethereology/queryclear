import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const modPath = path.join(projectRoot, "lib", "scorecard.ts");

// lib/scorecard.ts is a pure, import-free module — transpile and eval it directly.
function loadScorecard() {
  const source = fs.readFileSync(modPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: modPath,
  }).outputText;
  const moduleObj = { exports: {} };
  const fn = new Function("module", "exports", "require", output);
  fn(moduleObj, moduleObj.exports, () => {
    throw new Error("scorecard.ts should have no runtime imports");
  });
  return moduleObj.exports;
}

const sc = loadScorecard();

function allAnswers(value) {
  return Object.fromEntries(sc.questions.map((q) => [q.id, value]));
}

test("layer weights sum to exactly 100", () => {
  const total = sc.layers.reduce((s, l) => s + l.weight, 0);
  assert.equal(total, 100);
});

test("each layer's question points sum to its weight", () => {
  for (const layer of sc.layers) {
    const qSum = sc.questions
      .filter((q) => q.layer === layer.id)
      .reduce((s, q) => s + q.points, 0);
    assert.equal(qSum, layer.weight, `layer ${layer.id} points (${qSum}) != weight (${layer.weight})`);
  }
});

test("every question maps to a known layer", () => {
  const ids = new Set(sc.layers.map((l) => l.id));
  for (const q of sc.questions) {
    assert.ok(ids.has(q.layer), `question ${q.id} has unknown layer ${q.layer}`);
  }
});

test("question ids are unique", () => {
  const ids = sc.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("all-no scores 0", () => {
  assert.equal(sc.scoreTotal(allAnswers("no")), 0);
});

test("all-yes scores 100", () => {
  assert.equal(sc.scoreTotal(allAnswers("yes")), 100);
});

test("all-partial scores 50 (half credit)", () => {
  assert.equal(sc.scoreTotal(allAnswers("partial")), 50);
});

test("empty answers score 0 and count 0 answered", () => {
  assert.equal(sc.scoreTotal({}), 0);
  assert.equal(sc.answeredCount({}), 0);
});

test("answeredCount counts only answered questions", () => {
  const first = sc.questions[0].id;
  assert.equal(sc.answeredCount({ [first]: "yes" }), 1);
});

test("scoreLayer returns earned/possible/percent for a layer", () => {
  const yes = sc.scoreLayer(allAnswers("yes"), "machine-readability");
  assert.equal(yes.possible, 18);
  assert.equal(yes.earned, 18);
  assert.equal(yes.percent, 100);
  const no = sc.scoreLayer(allAnswers("no"), "machine-readability");
  assert.equal(no.earned, 0);
  assert.equal(no.percent, 0);
});

test("scoreLayer throws on unknown layer", () => {
  assert.throws(() => sc.scoreLayer({}, "not-a-layer"));
});

test("weakestLayers surfaces the lowest-scoring layers first", () => {
  // Answer one layer fully yes, the rest no → that layer must NOT be weakest.
  const answers = allAnswers("no");
  for (const q of sc.questions.filter((q) => q.layer === "machine-readability")) {
    answers[q.id] = "yes";
  }
  const weakest = sc.weakestLayers(answers, 2).map((s) => s.layer.id);
  assert.ok(!weakest.includes("machine-readability"));
  // All weakest entries should be at 0%.
  for (const s of sc.weakestLayers(answers, 2)) {
    assert.equal(s.percent, 0);
  }
});

test("band boundaries are honest and ordered", () => {
  assert.equal(sc.band(0).label, "Hard for AI to read");
  assert.equal(sc.band(39).label, "Hard for AI to read");
  assert.equal(sc.band(40).label, "Partly ready");
  assert.equal(sc.band(69).label, "Partly ready");
  assert.equal(sc.band(70).label, "Mostly ready");
  assert.equal(sc.band(89).label, "Mostly ready");
  assert.equal(sc.band(90).label, "Strong");
  assert.equal(sc.band(100).label, "Strong");
});

test("scoreSummary includes the total, is honest, and stays under the lead cap", () => {
  const summary = sc.scoreSummary(allAnswers("yes"));
  assert.match(summary, /100\/100/);
  assert.match(summary, /not a verified audit/i);
  assert.ok(summary.length < 2000);
});

test("TOTAL_QUESTIONS matches the question list length", () => {
  assert.equal(sc.TOTAL_QUESTIONS, sc.questions.length);
});
