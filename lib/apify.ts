// Minimal Apify REST client for automatic prospect sourcing. Deliberately NOT
// the Apify MCP connector the `prospector` agent uses today — MCP requires an
// interactive claude.ai session and cannot run inside a headless Vercel cron.
// Actor: compass/crawler-google-places (Google Maps Scraper). Input field
// names verified against the actor's public input schema 2026-07-20 (searches
// use `searchStringsArray`, not `searches` — don't guess from the MCP agent's
// docs, which describe the tool's behavior, not the raw field names).

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR_ID = "compass~crawler-google-places";

export interface StartPlacesRunInput {
  searchTerms: string[];
  locationQuery: string;
  maxPlaces?: number;
}

export interface ApifyRun {
  id: string;
  status: string; // "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT"
  defaultDatasetId: string;
}

// Raw dataset item shape is loosely typed — the actor's leads-enrichment email
// field placement isn't fully documented; prospect-curate.ts extracts
// defensively (checks a few plausible paths) rather than assuming one.
export interface PlaceItem {
  title?: string;
  website?: string;
  city?: string;
  categoryName?: string;
  categories?: string[];
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  email?: string;
  emails?: string[];
  [key: string]: unknown;
}

function token(): string | null {
  return process.env.APIFY_TOKEN ?? null;
}

// Starts one Places scrape run and returns immediately (does not wait for the
// scrape to finish) — the caller (prospect-topup cron) must not block on this,
// to stay well under Vercel's function duration limit.
export async function startPlacesRun(input: StartPlacesRunInput): Promise<ApifyRun | null> {
  const key = token();
  if (!key) return null;

  const res = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: input.searchTerms,
      locationQuery: input.locationQuery,
      maxCrawledPlacesPerSearch: input.maxPlaces ?? 150,
      website: "withWebsite",
      scrapeContacts: true,
      language: "en",
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: ApifyRun };
  return body.data ?? null;
}

export async function getRun(runId: string): Promise<ApifyRun | null> {
  const key = token();
  if (!key) return null;
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${key}`);
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: ApifyRun };
  return body.data ?? null;
}

export async function getDatasetItems(datasetId: string): Promise<PlaceItem[]> {
  const key = token();
  if (!key) return [];
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?clean=true&format=json&token=${key}`);
  if (!res.ok) return [];
  return (await res.json()) as PlaceItem[];
}
