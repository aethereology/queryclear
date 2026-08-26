import { Redis } from "@upstash/redis";

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN are required.");
}

const flags = new Set(process.argv.slice(2));
const rawLimit = process.argv.find((value) => value.startsWith("--limit="))?.split("=")[1];
const limit = rawLimit ? Number(rawLimit) : 50;
if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
  throw new Error("--limit must be a whole number from 1 through 500.");
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const stripeMode = flags.has("--stripe");
const orderMode = flags.has("--orders");
if (stripeMode && orderMode) throw new Error("Use either --stripe or --orders, not both.");
const indexKey = orderMode
  ? "ops:stripe:order:index"
  : stripeMode
    ? "ops:stripe:index"
    : "ops:lead:outbox";
const ids = await redis.lrange(indexKey, 0, limit - 1);
const records = [];
for (const id of ids) {
  const key = orderMode
    ? `ops:stripe:order:${id}`
    : stripeMode
      ? `ops:stripe:event:${id}`
      : `ops:lead:${id}`;
  const value = await redis.get(key);
  if (!value) continue;
  const record = typeof value === "string" ? JSON.parse(value) : value;
  if (flags.has("--full")) {
    records.push(record);
  } else if (orderMode) {
    records.push({
      orderId: record.orderId,
      product: record.product,
      orderStatus: record.orderStatus,
      intakeStatus: record.intakeStatus,
      deliveryDueFrom: record.deliveryDueFrom,
      deliveryWindowBusinessDays: record.deliveryWindowBusinessDays,
      amountTotal: record.amountTotal,
      currency: record.currency,
      amountRefunded: record.amountRefunded,
      disputeStatus: record.disputeStatus,
      ownerNotification: record.ownerNotification,
      buyerNotification: record.buyerNotification,
      updatedAt: record.updatedAt,
    });
  } else if (stripeMode) {
    records.push({
      eventId: record.eventId,
      eventType: record.eventType,
      receivedAt: record.receivedAt,
      objectId: record.objectId,
      product: record.product,
      orderStatus: record.orderStatus,
      validationStatus: record.validationStatus,
      intakeStatus: record.intakeStatus,
      deliveryDueFrom: record.deliveryDueFrom,
      deliveryWindowBusinessDays: record.deliveryWindowBusinessDays,
      ownerNotification: record.ownerNotification,
      buyerNotification: record.buyerNotification,
      processingStatus: record.processingStatus,
      notification: record.notification,
    });
  } else {
    records.push({
      id: record.id,
      kind: record.kind,
      receivedAt: record.receivedAt,
      websiteHost: record.websiteHost,
      delivery: record.delivery,
    });
  }
}

process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
