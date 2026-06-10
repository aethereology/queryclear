import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const routePath = path.join(projectRoot, "app", "api", "lead", "route.ts");

let ipCounter = 0;

function baseLead(overrides = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    website: "https://example.com",
    business: "Example Co",
    service: "AI search",
    city: "New York",
    message: "Please review our site.",
    company: "",
    ...overrides,
  };
}

function makeRequest(body, init = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": init.ip ?? `203.0.113.${++ipCounter}`,
  });

  return new Request("https://queryclear.com/api/lead", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function clearLeadEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.LEAD_TO;
  delete process.env.LEAD_FROM;
}

function loadRoute({ sendImpl } = {}) {
  const source = fs.readFileSync(routePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: routePath,
  }).outputText;

  const sent = [];
  const logs = [];
  class MockResend {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.emails = {
        send: async (message) => {
          sent.push(message);
          if (sendImpl) return sendImpl(message, sent.length);
          return { data: { id: `email_${sent.length}` }, error: null };
        },
      };
    }
  }

  const routeModule = { exports: {} };
  const mockRequire = (id) => {
    if (id === "next/server") {
      return {
        NextResponse: {
          json: (body, init = {}) => Response.json(body, init),
        },
      };
    }

    if (id === "resend") {
      return { Resend: MockResend };
    }

    if (id === "@/lib/site") {
      return {
        site: {
          email: "hello@queryclear.com",
          name: "queryclear",
          url: "https://queryclear.com",
        },
      };
    }

    if (id === "dns") {
      return {
        promises: {
          resolve4: async (hostname) => {
            const validDomains = ["example.com", "queryclear.com"];
            if (validDomains.includes(hostname)) {
              return ["1.2.3.4"];
            }
            throw new Error("ENOTFOUND");
          },
        },
      };
    }

    throw new Error(`Unexpected import: ${id}`);
  };

  const testConsole = {
    ...console,
    error: (...args) => logs.push(["error", ...args]),
    log: (...args) => logs.push(["log", ...args]),
  };

  const run = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    "console",
    output,
  );
  run(routeModule.exports, mockRequire, routeModule, routePath, path.dirname(routePath), testConsole);

  return { logs, route: routeModule.exports, sent };
}

test("invalid JSON returns 400", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const res = await route.POST(makeRequest("{bad json"));

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "Invalid request." });
});

test("missing required fields return 422", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const res = await route.POST(makeRequest(baseLead({ business: "" })));

  assert.equal(res.status, 422);
  assert.match((await res.json()).error, /business/i);
});

test("invalid email and website values are rejected", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const badEmail = await route.POST(makeRequest(baseLead({ email: "not-an-email" })));
  const badWebsite = await route.POST(makeRequest(baseLead({ website: "javascript:alert(1)" })));
  const insecureWebsite = await route.POST(makeRequest(baseLead({ website: "http://example.com" })));

  assert.equal(badEmail.status, 422);
  assert.equal(badWebsite.status, 422);
  assert.equal(insecureWebsite.status, 422);
  assert.match((await badWebsite.json()).error, /start with https:\/\//i);
  assert.match((await insecureWebsite.json()).error, /start with https:\/\//i);
});

test("non-existent domains are rejected", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const fakeWebsite = await route.POST(makeRequest(baseLead({ website: "https://w.wer.wer.com" })));

  assert.equal(fakeWebsite.status, 422);
  assert.match((await fakeWebsite.json()).error, /valid.*existing domain/i);
});

test("overlong fields are rejected", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const res = await route.POST(makeRequest(baseLead({ message: "x".repeat(2001) })));

  assert.equal(res.status, 422);
});

test("honeypot submissions are rejected with a generic validation error", async () => {
  clearLeadEnv();
  const { route } = loadRoute();

  const res = await route.POST(makeRequest(baseLead({ company: "Filled by a bot" })));
  const json = await res.json();

  assert.equal(res.status, 422);
  assert.equal(json.error, "Please check your details and try again.");
});

test("HTML injection payloads are escaped in rendered email HTML", async () => {
  clearLeadEnv();
  process.env.RESEND_API_KEY = "test_key";
  const { logs, route, sent } = loadRoute();

  const res = await route.POST(
    makeRequest(
      baseLead({
        name: 'Ada <script>alert("x")</script>',
        website: "https://example.com/?q=<script>",
        business: "ACME & Sons <b>",
        message: '<img src=x onerror="alert(1)">',
      }),
    ),
  );
  const html = sent.map((message) => message.html).join("\n");

  assert.equal(res.status, 200);
  assert.equal(sent.length, 2);
  assert.match(html, /ACME &amp; Sons &lt;b&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img src=x/);

  const acceptedLog = logs.find((entry) => entry[0] === "log" && entry[1] === "[lead]");
  assert.ok(acceptedLog);
  assert.equal(JSON.parse(acceptedLog[2]).host, "example.com");

  const serializedLogs = JSON.stringify(logs);
  assert.doesNotMatch(serializedLogs, /ada@example\.com/);
  assert.doesNotMatch(serializedLogs, /ACME/);
  assert.doesNotMatch(serializedLogs, /alert/);
});

test("email delivery failure still returns success after accepted validation", async () => {
  clearLeadEnv();
  process.env.RESEND_API_KEY = "test_key";
  const { logs, route, sent } = loadRoute({
    sendImpl: async (_message, index) => {
      if (index === 1) {
        return {
          data: null,
          error: { name: "validation_error", message: "delivery failed" },
        };
      }
      return { data: { id: `email_${index}` }, error: null };
    },
  });

  const res = await route.POST(makeRequest(baseLead()));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(sent.length, 2);
  assert.match(JSON.stringify(logs), /validation_error/);
});

test("rate limiting rejects repeated submissions from the same IP", async () => {
  clearLeadEnv();
  const { route } = loadRoute();
  const ip = "198.51.100.10";

  for (let i = 0; i < 5; i += 1) {
    const res = await route.POST(makeRequest(baseLead({ email: `ada${i}@example.com` }), { ip }));
    assert.equal(res.status, 200);
  }

  const blocked = await route.POST(makeRequest(baseLead({ email: "blocked@example.com" }), { ip }));
  assert.equal(blocked.status, 429);
});
