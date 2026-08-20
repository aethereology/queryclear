import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adapters = {
  linkedin: { file: "linkedin.ts", host: "api.linkedin.com" },
  x: { file: "x.ts", host: "api.x.com" },
  facebook: { file: "meta.ts", host: "graph.facebook.com" },
  instagram: { file: "meta.ts", host: "graph.facebook.com" },
  reddit: { file: "reddit.ts", host: "oauth.reddit.com" },
};

for (const [platform, definition] of Object.entries(adapters)) {
  test(`${platform} adapter uses its official API and implements the write/read contract`, () => {
    const source = fs.readFileSync(path.join(root, "lib/social/adapters", definition.file), "utf8");
    assert.match(source, new RegExp(definition.host.replaceAll(".", "\\.")));
    for (const method of ["health", "publish", "delete", "reply", "dm", "engagements", "metrics"]) {
      assert.match(source, new RegExp(`async ${method}\\(`), `${platform} missing ${method}`);
    }
    assert.doesNotMatch(source, /playwright|puppeteer|selenium|chromium/i);
  });
}

test("social implementation never imports or uses outreach state", () => {
  const files = fs
    .readdirSync(path.join(root, "lib/social"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name));
  for (const entry of files) {
    const source = fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8");
    assert.doesNotMatch(source, /outreachStore|prospectQueue|oc:|pq:/, entry.name);
  }
});
