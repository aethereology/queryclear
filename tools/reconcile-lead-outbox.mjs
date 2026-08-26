import { Redis } from "@upstash/redis";

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN are required.");
}

const valueFor = (name) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const id = valueFor("id") ?? "";
const team = valueFor("team") ?? "";
const prospect = valueFor("prospect") ?? "";
const note = valueFor("note") ?? "";
const actor = valueFor("actor") ?? "operating-owner";

if (!/^[a-f\d-]{20,80}$/i.test(id)) throw new Error("A valid --id is required.");
if (team !== "sent") throw new Error("--team=sent is required after verified manual delivery.");
if (!["sent", "not_applicable"].includes(prospect)) {
  throw new Error("--prospect must be sent or not_applicable.");
}
if (note.trim().length < 8) throw new Error("Add a meaningful --note describing the recovery evidence.");
if (!process.argv.includes("--confirm")) {
  throw new Error("Review the evidence, then repeat with --confirm to close this outbox item.");
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const key = `ops:lead:${id}`;
const value = await redis.get(key);
if (!value) throw new Error("Lead record was not found or has expired.");
const record = typeof value === "string" ? JSON.parse(value) : value;
const now = new Date().toISOString();
const updated = {
  ...record,
  delivery: { team, prospect, updatedAt: now },
  manualReconciliation: { at: now, actor: actor.slice(0, 120), note: note.slice(0, 500) },
};

await redis
  .multi()
  .set(key, JSON.stringify(updated), { ex: 730 * 24 * 60 * 60 })
  .lrem("ops:lead:outbox", 0, id)
  .exec();

process.stdout.write(`${JSON.stringify({ id, reconciledAt: now }, null, 2)}\n`);
