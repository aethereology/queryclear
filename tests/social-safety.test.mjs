import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal Upstash stand-in, matching the surface lib/social/store.ts uses. Mirrors
// the fake in tests/social-store.test.mjs so each suite stays self-contained.
class FakeRedis {
  values = new Map();
  sorted = new Map();
  lists = new Map();

  async get(key) { return this.values.get(key) ?? null; }
  async set(key, value, options = {}) {
    if (options.nx && this.values.has(key)) return null;
    this.values.set(key, value);
    return "OK";
  }
  async del(key) { this.values.delete(key); return 1; }
  async expire() { return 1; }
  async incrby(key, amount) {
    const next = Number(this.values.get(key) ?? 0) + Number(amount);
    this.values.set(key, next);
    return next;
  }
  async zadd(key, item) {
    const values = this.sorted.get(key) ?? new Map();
    values.set(item.member, Number(item.score));
    this.sorted.set(key, values);
    return 1;
  }
  async zrem(key, member) { return this.sorted.get(key)?.delete(member) ? 1 : 0; }
  async zrange(key, start, end, options = {}) {
    let items = [...(this.sorted.get(key) ?? new Map()).entries()].sort((a, b) => a[1] - b[1]);
    if (options.byScore) {
      items = items.filter(([, score]) => score >= Number(start) && score <= Number(end));
      if (options.offset) items = items.slice(options.offset);
      if (options.count) items = items.slice(0, options.count);
    } else {
      if (options.rev) items.reverse();
      items = items.slice(start, end + 1);
    }
    return items.map(([member]) => member);
  }
  async lpush(key, value) {
    const list = this.lists.get(key) ?? [];
    list.unshift(value);
    this.lists.set(key, list);
    return list.length;
  }
  async ltrim(key, start, end) {
    this.lists.set(key, (this.lists.get(key) ?? []).slice(start, end + 1));
  }
  async lrange(key, start, end) { return (this.lists.get(key) ?? []).slice(start, end + 1); }
}

function transpile(relativePath, resolve) {
  const file = path.join(root, relativePath);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const moduleObj = { exports: {} };
  new Function("module", "exports", "require", output)(moduleObj, moduleObj.exports, resolve);
  return moduleObj.exports;
}

const testAccount = {
  id: "instagram-brand",
  platform: "instagram",
  identity: "brand",
  label: "Instagram · queryclear",
  remoteId: "ig-1",
  paused: false,
  status: "ready",
  capabilities: {
    publish: true,
    readEngagements: true,
    reply: true,
    dm: true,
    delete: true,
    metrics: true,
    media: true,
  },
};

function loadStore() {
  return transpile("lib/social/store.ts", (specifier) => {
    if (specifier === "node:crypto") return { randomUUID };
    if (specifier === "@upstash/redis") return { Redis: class {} };
    if (specifier === "./config") {
      return {
        // Fresh objects per call: the real config module rebuilds them too.
        configuredSocialAccounts: () => [structuredClone(testAccount)],
        DEFAULT_SOCIAL_SETTINGS: {
          globalPaused: true,
          monthlyBudgetUsd: 90,
          redditAllowlist: [],
          updatedAt: new Date(0).toISOString(),
        },
      };
    }
    throw new Error(`Unexpected import: ${specifier}`);
  });
}

function loadPolicy() {
  return transpile("lib/social/policy.ts", (specifier) => {
    if (specifier === "node:crypto") return { createHash };
    throw new Error(`Unexpected import: ${specifier}`);
  });
}

const { SocialStore } = loadStore();
const { privateReplyWindowOpen, privateReplyCapable, PRIVATE_REPLY_WINDOW_MS } = loadPolicy();

const source = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

/** Source with comments removed, so prose about an old API can't satisfy or trip an assertion. */
const code = (relativePath) =>
  source(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

/* ---------------------------------------------------------------- F1: caps */

test("concurrent reservations can never overshoot a cadence cap", async () => {
  const store = new SocialStore(new FakeRedis());
  // Four workers race for a cap of 2 — exactly two may win. The pre-fix code counted
  // completed actions from a list fetched once per batch, so all four saw room.
  const results = await Promise.all(
    Array.from({ length: 4 }, () => store.reserveActionSlot("linkedin-founder", "publish", 2)),
  );
  assert.equal(results.filter((result) => result.allowed).length, 2);
  assert.equal(await store.actionSlotUsage("linkedin-founder", "publish"), 2);
});

test("a released slot becomes available again", async () => {
  const store = new SocialStore(new FakeRedis());
  const first = await store.reserveActionSlot("x-brand", "reply", 1);
  assert.equal(first.allowed, true);
  assert.equal((await store.reserveActionSlot("x-brand", "reply", 1)).allowed, false);

  await store.releaseActionSlot("x-brand", "reply", first.period);
  assert.equal(await store.actionSlotUsage("x-brand", "reply"), 0);
  assert.equal((await store.reserveActionSlot("x-brand", "reply", 1)).allowed, true);
});

test("a refused reservation does not consume a slot", async () => {
  const store = new SocialStore(new FakeRedis());
  await store.reserveActionSlot("reddit-founder", "publish", 1);
  await store.reserveActionSlot("reddit-founder", "publish", 1);
  await store.reserveActionSlot("reddit-founder", "publish", 1);
  assert.equal(await store.actionSlotUsage("reddit-founder", "publish"), 1);
});

test("releasing more than was reserved clamps at zero", async () => {
  const store = new SocialStore(new FakeRedis());
  const period = store.capPeriod("dm");
  await store.releaseActionSlot("facebook-brand", "dm", period);
  assert.equal(await store.actionSlotUsage("facebook-brand", "dm"), 0);
});

test("publish caps bucket by ISO week; replies and DMs bucket by day", () => {
  const store = new SocialStore(new FakeRedis());
  const sunday = new Date("2026-07-26T18:00:00.000Z");
  assert.equal(store.capPeriod("publish", sunday), "w2026-07-20");
  assert.equal(store.capPeriod("reply", sunday), "2026-07-26");
  assert.equal(store.capPeriod("dm", sunday), "2026-07-26");
  // Monday starts a new publish bucket, so a weekly cadence resets.
  assert.equal(store.capPeriod("publish", new Date("2026-07-27T00:00:00.000Z")), "w2026-07-27");
});

test("runPublish hands the slot back on every failure path", () => {
  const runtime = source("lib/social/runtime.ts");
  assert.match(runtime, /reserveActionSlot\(/);
  assert.match(runtime, /if \(reservedPeriod\) await store\.releaseActionSlot\(/);
  // The stale snapshot the cap used to be derived from must be gone.
  assert.doesNotMatch(runtime, /listActions\(500\)/);
  assert.doesNotMatch(runtime, /completedThisWeek/);
});

/* ------------------------------------------------------------- F2: budget */

test("every model call reserves spend at one choke point", () => {
  const openai = source("lib/social/openai.ts");
  // One private helper authorizes all spend; each exported call must go through it.
  assert.match(openai, /async function spend\(label: keyof typeof COST_USD\)/);
  assert.match(openai, /if \(!result\.allowed\) throw new SocialBudgetError/);
  for (const label of ["research", "adapt", "review", "engagementDraft"]) {
    assert.match(openai, new RegExp(`await spend\\("${label}"\\)`), `missing reservation: ${label}`);
  }
  // Every responses.create / moderations.create call must be preceded by a spend().
  const modelCalls = openai.match(/(responses|moderations)\.create\(/g) ?? [];
  const reservations = openai.match(/await spend\("/g) ?? [];
  assert.ok(
    reservations.length >= new Set(modelCalls).size,
    "a model call exists without a spend reservation",
  );
});

test("the engagement job checks the budget before drafting anything", () => {
  const runtime = source("lib/social/runtime.ts");
  const engage = runtime.slice(runtime.indexOf("export async function runEngage"));
  const budgetCheck = engage.indexOf("budgetMode(");
  const firstDraft = engage.indexOf("draftEngagementResponse(");
  assert.ok(budgetCheck > -1, "runEngage must consult budgetMode");
  assert.ok(budgetCheck < firstDraft, "the budget check must precede any model call");
  assert.match(engage, /skipped: "budget-cap"/);
});

test("a budget refusal aborts the engagement run instead of publishing ungated text", () => {
  const runtime = source("lib/social/runtime.ts");
  assert.match(runtime, /if \(error instanceof SocialBudgetError\)/);
  assert.match(runtime, /engagement\.budget-exhausted/);
  assert.match(runtime, /campaign\.budget-exhausted/);
});

/* ----------------------------------------------------------------- F3: DMs */

test("a comment stays inside the private-reply window for 7 days", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(PRIVATE_REPLY_WINDOW_MS, 7 * 24 * 60 * 60 * 1000);
  assert.equal(privateReplyWindowOpen(hoursAgo, now), true);
  assert.equal(privateReplyWindowOpen(sixDaysAgo, now), true);
  assert.equal(privateReplyWindowOpen(eightDaysAgo, now), false);
  assert.equal(privateReplyWindowOpen("not-a-date", now), false);
});

test("private replies are limited to fresh Meta comment events", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const event = {
    kind: "comment",
    receivedAt: new Date(now.getTime() - 60_000).toISOString(),
    risk: "low",
  };
  assert.equal(privateReplyCapable(testAccount, event, now), true);

  // Wrong platform, wrong event kind, no capability, paused, or stale comment.
  assert.equal(privateReplyCapable({ ...testAccount, platform: "x" }, event, now), false);
  assert.equal(privateReplyCapable({ ...testAccount, platform: "reddit" }, event, now), false);
  assert.equal(privateReplyCapable({ ...testAccount, capabilities: { ...testAccount.capabilities, dm: false } }, event, now), false);
  assert.equal(privateReplyCapable({ ...testAccount, paused: true }, event, now), false);
  assert.equal(privateReplyCapable(testAccount, { ...event, kind: "mention" }, now), false);
  assert.equal(
    privateReplyCapable(testAccount, { ...event, receivedAt: new Date(now.getTime() - 8 * 864e5).toISOString() }, now),
    false,
  );
});

test("a recipient can only be claimed once inside the 30-day cooldown", async () => {
  const store = new SocialStore(new FakeRedis());
  assert.equal(await store.claimDmRecipient("instagram-brand", "actor-hash-1"), true);
  assert.equal(await store.claimDmRecipient("instagram-brand", "actor-hash-1"), false);
  // Per-account, so a different account is unaffected.
  assert.equal(await store.claimDmRecipient("facebook-brand", "actor-hash-1"), true);
});

test("Meta DMs go to private_replies, never to the messaging endpoint", () => {
  const meta = code("lib/social/adapters/meta.ts");
  assert.match(meta, /\$\{targetRemoteId\}\/private_replies/);
  assert.doesNotMatch(meta, /me\/messages/);
  assert.doesNotMatch(meta, /messaging_type/);
  // The old recipient path required an IGSID the comment payload never carries.
  assert.doesNotMatch(meta, /recipient: JSON\.stringify/);
});

test("only Meta accounts declare a DM capability", () => {
  const config = source("lib/social/config.ts");
  const accounts = config.split(/\n    account\(\n/).slice(1);
  const dmEnabled = accounts
    .filter((block) => /\bdm: true\b/.test(block))
    .map((block) => block.match(/"([a-z-]+)"/)?.[1]);
  assert.deepEqual(dmEnabled.sort(), ["facebook-brand", "instagram-brand"]);
});

test("a private reply targets the comment id, not the commenter", () => {
  const runtime = source("lib/social/runtime.ts");
  assert.match(runtime, /responseMode === "dm" \? remote\.platformEventId/);
  // One private reply per comment is enforced by the idempotency key.
  assert.match(runtime, /idempotencyKey: `\$\{responseMode\}:\$\{event\.platformEventId\}`/);
});

/* --------------------------------------------------- F4: degradation */

test("a disabled capability survives an account resync", async () => {
  const store = new SocialStore(new FakeRedis());
  const [before] = await store.syncConfiguredAccounts();
  assert.equal(before.capabilities.readEngagements, true);

  assert.equal(await store.disableCapability("instagram-brand", "readEngagements"), true);
  // Already disabled — reports no change so the audit entry is written once.
  assert.equal(await store.disableCapability("instagram-brand", "readEngagements"), false);

  const [after] = await store.syncConfiguredAccounts();
  assert.equal(after.capabilities.readEngagements, false, "resync must not resurrect the capability");
  assert.equal(after.capabilities.publish, true, "publishing must stay reachable");
  assert.equal(after.status, "ready", "status must stay ready or publishing is quarantined");

  await store.clearDisabledCapabilities("instagram-brand");
  const [recovered] = await store.syncConfiguredAccounts();
  assert.equal(recovered.capabilities.readEngagements, true);
});

test("a forbidden read degrades one capability instead of pausing the account", () => {
  const runtime = source("lib/social/runtime.ts");
  assert.match(runtime, /\[401, 403\]\.includes\(error\.status\)/);
  assert.match(runtime, /disableCapability\(account\.id, capability\)/);
  assert.match(runtime, /degradeOnForbidden\(account, "readEngagements"/);
  assert.match(runtime, /degradeOnForbidden\(account, "metrics"/);

  // Only a publish failure may pause the whole account; a refused reply or DM
  // degrades that capability alone. Assert against the catch block specifically —
  // `action.kind === "publish"` also appears in the try block above it.
  const catchBlock = runtime.slice(runtime.lastIndexOf('if (action.kind === "publish")'));
  assert.match(catchBlock.slice(0, 400), /paused: true, status: "paused"/);
  assert.match(catchBlock, /action\.kind === "reply" \|\| action\.kind === "dm"/);
  assert.match(catchBlock, /degradeOnForbidden\(account, action\.kind/);
});

/* ------------------------------------------------- health must be able to fail */

test("the LinkedIn health check verifies scope, not just token presence", () => {
  const linkedin = code("lib/social/adapters/linkedin.ts");
  // A token can be active and still lack publishing scope. Reporting ok in that case
  // sends the account into a 403 on its first post, which pauses it.
  assert.match(linkedin, /introspectToken/);
  assert.match(linkedin, /PUBLISH_SCOPE\[account\.identity\]/);
  assert.match(linkedin, /founder: "w_member_social"/);
  assert.match(linkedin, /brand: "w_organization_social"/);
  assert.match(linkedin, /granted\.includes\(required\)/);
  assert.match(linkedin, /expires_at/);
});

function loadOauth() {
  return transpile("lib/social/oauth.ts", (specifier) => {
    if (specifier === "node:crypto") return { createHash, randomBytes: (n) => Buffer.alloc(n, 7) };
    throw new Error(`Unexpected import: ${specifier}`);
  });
}

/** Runs `fn` with globalThis.fetch replaced, restoring it afterwards. */
async function withFetch(handler, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

const LINKEDIN_REDIRECT_MISMATCH = "<p>Bummer, something went wrong. The redirect_uri does not match the registered value</p>";
const LINKEDIN_SCOPE_ERROR = "?error=unauthorized_scope_error&error_description=Scope+%22openid%22+is+not+authorized";
const LINKEDIN_CONSENT = "<title>Authorize | LinkedIn</title><button>Allow</button>";

test("the authorize probe distinguishes a bad redirect URI from a missing scope", async () => {
  const { probeLinkedInAuthorize } = loadOauth();
  // LinkedIn reports a redirect mismatch in preference to a scope problem, so a redirect
  // failure must leave the scope UNDETERMINED rather than reported as granted.
  const mismatch = await withFetch(
    async () => new Response(LINKEDIN_REDIRECT_MISMATCH),
    () => probeLinkedInAuthorize("client", "w_member_social"),
  );
  assert.equal(mismatch.redirectRegistered, false);
  assert.equal(mismatch.scopeGranted, false);

  const scopeDenied = await withFetch(
    async () => new Response(LINKEDIN_SCOPE_ERROR),
    () => probeLinkedInAuthorize("client", "openid"),
  );
  assert.equal(scopeDenied.redirectRegistered, true);
  assert.equal(scopeDenied.scopeGranted, false);

  const ok = await withFetch(
    async () => new Response(LINKEDIN_CONSENT),
    () => probeLinkedInAuthorize("client", "w_member_social"),
  );
  assert.deepEqual(ok, { redirectRegistered: true, scopeGranted: true });
});

test("the probe rejects every LinkedIn scope error code, not just the one we knew", async () => {
  const { probeLinkedInAuthorize } = loadOauth();
  // LinkedIn has at least two. Matching only unauthorized_scope_error let
  // openid_insufficient_scope_error through, which then failed the real authorize call.
  for (const code of ["unauthorized_scope_error", "openid_insufficient_scope_error", "some_future_scope_error"]) {
    const result = await withFetch(
      async () => new Response(`?error=${code}&error_description=nope&state=preflight`),
      () => probeLinkedInAuthorize("client", "w_member_social openid"),
    );
    assert.equal(result.scopeGranted, false, `${code} must be treated as not grantable`);
    assert.equal(result.redirectRegistered, true, `${code} is not a redirect problem`);
  }
});

test("LinkedIn scopes are probed as sets, because openid needs profile alongside it", () => {
  const oauth = code("lib/social/oauth.ts");
  const sets = oauth.match(/LINKEDIN_FOUNDER_SCOPE_SETS = \[([^\]]*)\]/)[1];
  const candidates = [...sets.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  // Best first, guaranteed-safe last.
  assert.equal(candidates.at(-1), "w_member_social", "the final candidate must always work");
  // r_profile_basicinfo grants nothing we can use — proven against every profile endpoint.
  assert.ok(!candidates.some((set) => set.includes("r_profile_basicinfo")), "must not request unusable scopes");
  assert.ok(candidates[0].includes("openid") && candidates[0].includes("profile"), "openid must travel with profile");
  assert.ok(candidates.every((set) => set.startsWith("w_member_social")), "publishing scope is mandatory in every set");
});

test("the LinkedIn scope request adapts to what the app can grant", async () => {
  const { oauthStart } = loadOauth();
  process.env.LINKEDIN_CLIENT_ID = "client";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";

  // An app with only the publishing product must not be sent optional scopes, or
  // LinkedIn rejects the whole authorize call.
  const minimal = await withFetch(
    async () => new Response(LINKEDIN_SCOPE_ERROR),
    () => oauthStart("linkedin", "founder", "state"),
  );
  assert.equal(new URL(minimal.authorizationUrl).searchParams.get("scope"), "w_member_social");

  // Once the app can grant them, they are picked up with no code change.
  const full = await withFetch(
    async () => new Response(LINKEDIN_CONSENT),
    () => oauthStart("linkedin", "founder", "state"),
  );
  const granted = new URL(full.authorizationUrl).searchParams.get("scope").split(" ");
  assert.ok(granted.includes("w_member_social"));
  assert.ok(granted.includes("openid"), "openid unlocks automatic author-URN resolution");

  // Brand asks for the organization scope alone — never bundled with optional scopes.
  const brand = await withFetch(
    async () => new Response(LINKEDIN_CONSENT),
    () => oauthStart("linkedin", "brand", "state"),
  );
  assert.equal(new URL(brand.authorizationUrl).searchParams.get("scope"), "w_organization_social");

  // A probe outage must degrade to publish-only, never block connecting.
  const offline = await withFetch(
    async () => {
      throw new Error("network down");
    },
    () => oauthStart("linkedin", "founder", "state"),
  );
  assert.equal(new URL(offline.authorizationUrl).searchParams.get("scope"), "w_member_social");
});

test("brand can be served by its own LinkedIn application", () => {
  const { linkedinCredentials } = loadOauth();
  const saved = { ...process.env };
  try {
    process.env.LINKEDIN_CLIENT_ID = "founder-app";
    process.env.LINKEDIN_CLIENT_SECRET = "founder-secret";
    delete process.env.LINKEDIN_BRAND_CLIENT_ID;
    delete process.env.LINKEDIN_BRAND_CLIENT_SECRET;

    // Single-app setup: both identities share credentials, nothing changes.
    for (const identity of ["founder", "brand"]) {
      const shared = linkedinCredentials(identity);
      assert.equal(shared.clientId, "founder-app", `${identity} should fall back to the shared app`);
      assert.equal(shared.dedicatedApp, false);
    }

    // Community Management API must be the sole product on its app, so brand gets its own.
    process.env.LINKEDIN_BRAND_CLIENT_ID = "brand-app";
    process.env.LINKEDIN_BRAND_CLIENT_SECRET = "brand-secret";
    const brand = linkedinCredentials("brand");
    assert.deepEqual(brand, { clientId: "brand-app", clientSecret: "brand-secret", dedicatedApp: true });
    // The founder app must be unaffected.
    const founder = linkedinCredentials("founder");
    assert.equal(founder.clientId, "founder-app");
    assert.equal(founder.dedicatedApp, false);
  } finally {
    process.env = saved;
  }
});

test("the token exchange and refresh are bound to the issuing application", () => {
  const oauth = code("lib/social/oauth.ts");
  // A code or refresh token is only valid against the app that issued it, so identity
  // must reach both calls — otherwise a dedicated brand app silently uses founder creds.
  assert.match(oauth, /export async function exchangeOAuthCode\([\s\S]{0,400}identity: SocialIdentity = "founder"/);
  assert.match(oauth, /export async function refreshOAuthToken\([\s\S]{0,300}identity: SocialIdentity = "founder"/);
  assert.match(oauth, /requiredLinkedinCredentials\(identity\)/);
  // No LinkedIn flow may read the shared env vars directly any more.
  const linkedinFlows = oauth.slice(oauth.indexOf("export async function oauthStart"));
  assert.doesNotMatch(linkedinFlows, /required\("LINKEDIN_CLIENT_(ID|SECRET)"\)/);

  // Callers must pass it through.
  assert.match(
    code("app/api/social/oauth/[platform]/route.ts"),
    /exchangeOAuthCode\([\s\S]{0,200}savedIdentity,/,
  );
  assert.match(code("lib/social/adapters/base.ts"), /refreshOAuthToken\(account\.platform, bundle\.refreshToken, account\.identity\)/);
  // And preflight/health must introspect with the same app's credentials.
  const linkedin = code("lib/social/adapters/linkedin.ts");
  assert.match(linkedin, /linkedinCredentials\(account\.identity\)/);
  assert.doesNotMatch(linkedin, /process\.env\.LINKEDIN_CLIENT_SECRET/);
});

test("preflight names the deepest blocker, not the first failure", () => {
  const preflight = code("lib/social/preflight.ts");
  // Ordered by remediation depth: a missing platform product outranks a stale token,
  // because reconnecting cannot succeed until the product exists.
  const order = preflight.match(/const BLOCKING[^=]*=\s*\[([^\]]*)\]/)[1];
  const ids = [...order.matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
  assert.ok(ids.indexOf("scope") < ids.indexOf("token"), "scope must outrank token");
  assert.ok(ids.indexOf("callback") < ids.indexOf("token"), "callback must outrank token");
  assert.ok(ids.indexOf("credentials") === 0, "no credentials is the deepest blocker");
  // Selection must walk BLOCKING, not the sorted array.
  assert.match(preflight, /BLOCKING\.map\(\(id\) => checks\.find\(/);
});

test("preflight reports only capabilities the platform actually refused", () => {
  const preflight = code("lib/social/preflight.ts");
  // LinkedIn has no member DM API, so dm:false is by design — surfacing it as a warning
  // trains the operator to ignore the panel.
  assert.match(preflight, /disabledCapabilities\(account\.id\)/);
  assert.doesNotMatch(preflight, /Object\.entries\(account\.capabilities\)/);
});

test("every failing preflight check carries its own remediation", () => {
  for (const file of ["lib/social/adapters/linkedin.ts", "lib/social/preflight.ts"]) {
    const source = code(file);
    // Each `status: "fail"` literal should sit in an object that also names an action.
    const failures = [...source.matchAll(/status:\s*"fail"/g)];
    assert.ok(failures.length > 0, `${file} should contain failing checks`);
    for (const match of failures) {
      const window = source.slice(match.index, match.index + 600);
      assert.match(window, /action:/, `a fail near index ${match.index} in ${file} has no action`);
    }
  }
});

test("a failed OAuth callback surfaces the platform's reason instead of a 401", () => {
  const route = code("app/api/social/oauth/[platform]/route.ts");
  // ?error=... with no code previously fell through to the start branch, which
  // answered 401 or bounced the browser back to the platform in a loop.
  assert.match(route, /const oauthError = url\.searchParams\.get\("error"\)/);
  assert.match(route, /if \(oauthError && !code\)/);
  assert.match(route, /error_description/);
  assert.match(route, /oauth_error=/);
  // The error branch must precede the session GATE (not the import of the same name).
  assert.ok(
    route.indexOf("if (oauthError && !code)") < route.indexOf("verifyAdminSession(cookie"),
    "the error branch must run before the session gate",
  );
  // And the dashboard has to actually render it.
  const page = code("app/admin/social/page.tsx");
  assert.match(page, /query\.oauth_error/);
  assert.match(page, /oauthError \? \(/);
});

test("the authorize and token-exchange redirect_uri are built by one helper", () => {
  const oauth = code("lib/social/oauth.ts");
  // LinkedIn compares redirect_uri on BOTH calls; two sources would drift.
  assert.match(oauth, /function callbackUrl\(platform: SocialPlatform\)/);
  const literalRedirects = oauth.match(/redirect_uri["']?\s*[:=]\s*["']http/g) ?? [];
  assert.equal(literalRedirects.length, 0, "redirect_uri must never be hardcoded");
});

test("the admin cookie survives the OAuth callback without weakening CSRF", () => {
  const security = code("lib/social/security.ts");
  // A strict cookie is withheld for the remainder of a cross-site redirect chain,
  // so the post-callback /admin/social render would show the login form.
  assert.match(security, /sameSite: "lax" as const/);
  assert.match(security, /httpOnly: true/);
  assert.match(security, /secure: process\.env\.NODE_ENV === "production"/);
  // CSRF must still be enforced independently of the cookie's SameSite value.
  assert.match(security, /export function verifyCsrf/);
  const adminAction = code("app/api/social/admin/action/route.ts");
  assert.match(adminAction, /verifyCsrf\(/);
});

test("the login screen separates a missing server secret from a wrong one", () => {
  const route = code("app/api/social/admin/session/route.ts");
  // An unset SOCIAL_ADMIN_SECRET rejects every attempt. Reporting that as "wrong
  // secret" is unfalsifiable from the login screen.
  assert.match(route, /if \(!expected\) \{/);
  assert.match(route, /login_error=unconfigured/);
  assert.ok(
    route.indexOf("login_error=unconfigured") < route.indexOf("login_error=1"),
    "the unconfigured branch must precede the wrong-secret branch",
  );
  const page = code("app/admin/social/page.tsx");
  assert.match(page, /error === "unconfigured"/);
  // Shared-origin autofill silently submits another project's saved password.
  assert.match(page, /autoComplete="off"/);
});

test("no live secret is committed in documentation", () => {
  const docs = fs
    .readdirSync(path.join(root, "docs"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  for (const entry of docs) {
    const text = fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8");
    const where = path.relative(root, path.join(entry.parentPath, entry.name));

    // Recognisable key formats.
    for (const [label, re] of [
      ["OpenAI", /sk-(proj-|ant-)?[A-Za-z0-9_-]{24}/],
      ["LinkedIn OAuth", /\bAQ[A-Za-z0-9_-]{60}/],
      ["LinkedIn client secret", /\bWPL_AP\d?\./],
      ["GitHub", /\bgh[posru]_[A-Za-z0-9]{20}/],
      ["Slack", /\bxox[abprs]-[A-Za-z0-9-]{10}/],
      ["AWS", /\bAKIA[0-9A-Z]{16}\b/],
    ]) {
      assert.doesNotMatch(text, re, `${label} credential in ${where}`);
    }

    // Any credential-shaped variable must be left EMPTY in documentation. Scoped to
    // names ending in TOKEN/SECRET/KEY/PASSWORD so model ids, URLs, API versions and
    // user agents stay documentable. An earlier version only checked *_SECRET, which
    // is why a pasted LINKEDIN_ACCESS_TOKEN slipped through.
    const populated = [...text.matchAll(/^([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD))=(.+)$/gm)]
      .filter(([, , value]) => !/^<.+>$/.test(value.trim()));
    assert.deepEqual(
      populated.map(([, name]) => name),
      [],
      `credential value in ${where} — use an empty value or a <placeholder>`,
    );
  }
});

/* ------------------------------------------------------- F6/F7: hygiene */

test("the founder-only admin console is disallowed to crawlers", () => {
  assert.match(source("app/robots.ts"), /disallow: \[[^\]]*"\/admin"/);
  assert.match(source("app/admin/social/page.tsx"), /robots: \{ index: false, follow: false \}/);
});

test("the LinkedIn brand account stays blocked until approval, not just credentials", () => {
  const config = code("lib/social/config.ts");
  // w_organization_social is granted only via Community Management API approval, so
  // env credentials alone must not mark the account ready — a ready account gets
  // scheduled posts that 403 and pause it.
  const brand = config.slice(config.indexOf('"linkedin-brand"'), config.indexOf('"x-founder"'));
  assert.match(brand, /Community Management API/);
  // That product must be the sole product on its app, so it needs a dedicated one.
  assert.match(brand, /ONLY product|separate LinkedIn developer application/);
  assert.doesNotMatch(brand, /linkedinReady && enabled\("LINKEDIN_ORGANIZATION_URN"\),/);
  // A stored token (only obtainable post-approval) must still promote it.
  assert.match(code("lib/social/store.ts"), /hasStoredToken && configured\.status === "blocked"/);
});

test("a failed connect is persisted to the account, not just a banner", () => {
  const route = code("app/api/social/oauth/[platform]/route.ts");
  assert.match(route, /lastError: `\$\{oauthError\}: \$\{description\}`/);
  // The dashboard row must render it.
  assert.match(code("app/admin/social/page.tsx"), /account\.statusReason \?\? account\.lastError/);
});

test("Reddit is blocked at config time without an allowlist", () => {
  const config = source("lib/social/config.ts");
  assert.match(config, /parseRedditAllowlist\(\)\.length > 0/);
  assert.match(config, /non-empty REDDIT_ALLOWLIST/);
});

test("the allowlist parser normalises r\\/ prefixes, case, and blanks", () => {
  const { parseRedditAllowlist } = transpile("lib/social/config.ts", () => ({}));
  assert.deepEqual(parseRedditAllowlist("r/SmallBusiness, SEO ,, r/juststart"), [
    "smallbusiness",
    "seo",
    "juststart",
  ]);
  assert.deepEqual(parseRedditAllowlist(""), []);
  assert.deepEqual(parseRedditAllowlist("  ,  "), []);
});
