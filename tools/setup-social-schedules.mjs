import { Client } from "@upstash/qstash";

const token = process.env.QSTASH_TOKEN;
const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.queryclear.com";
if (!token) throw new Error("QSTASH_TOKEN is required.");

const client = new Client({ token });
const schedules = [
  { id: "queryclear-social-research", kind: "research", cron: "0 13 * * 1-5" },
  { id: "queryclear-social-publish", kind: "publish", cron: "*/10 * * * 1-5" },
  { id: "queryclear-social-engage", kind: "engage", cron: "*/15 * * * *" },
  { id: "queryclear-social-metrics", kind: "metrics", cron: "30 21 * * *" },
  { id: "queryclear-social-digest", kind: "digest", cron: "0 22 * * *" },
];

for (const schedule of schedules) {
  const result = await client.schedules.create({
    scheduleId: schedule.id,
    destination: `${origin}/api/social/jobs/${schedule.kind}`,
    cron: schedule.cron,
    method: "POST",
    body: JSON.stringify({ source: "qstash", kind: schedule.kind }),
    headers: { "Content-Type": "application/json" },
    retries: 3,
    timeout: 60,
    label: ["queryclear", "social", schedule.kind],
  });
  console.log(`${schedule.kind}: ${result.scheduleId}`);
}
