// Server-side client for the QueryClear agent runtime (a separate Vercel
// project). Only the read-only audit is used here; the browser never calls the
// runtime directly — the /api/public/audit route proxies server-to-server.

const MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 45_000;

export interface AuditFinding {
  code: string;
  severity: string; // high | medium | low
  title: string;
  detail: string;
  recommendation: string;
  url: string | null;
}

export interface AuditQuery {
  engine: string;
  query: string;
  cited_count: number;
  samples: number;
  citation_frequency: number;
  confidence_low: number;
  confidence_high: number;
  // True only for a real, compliant query to the engine itself. False = a model
  // standing in for the engine (an estimate, not a live measurement).
  measured: boolean;
}

export interface AuditRecommendation {
  rank: number;
  priority: number;
  kind: string; // technical | content
  title: string;
  rationale: string;
  action: string;
  provenance: string; // measured | estimated
  evidence: string;
}

export interface RuntimeDraft {
  id: string;
  title: string;
  body: string;
  status: string;
}

export interface AuditReportData {
  domain_url: string;
  page_title: string;
  crawled_urls?: string[];
  audited_at?: string | null;
  findings: AuditFinding[];
  queries: AuditQuery[];
  recommendations: AuditRecommendation[];
  sample_draft: RuntimeDraft | null;
  detected_voice: string | null;
  methodology?: {
    version: string;
    crawled_page_limit: number;
    visibility_method: "modeled-scenario" | "live-engine" | "mixed";
    samples_per_query: number;
  };
}

export class AgentRuntimeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly costMayHaveBeenIncurred = false
  ) {
    super(message);
    this.name = "AgentRuntimeError";
  }
}

function runtimeBaseUrl(): string {
  const raw = (process.env.AGENT_RUNTIME_URL ?? "http://127.0.0.1:8080").replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AgentRuntimeError("Audit service is not configured.", 503);
  }
  if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) {
    throw new AgentRuntimeError("Audit service is not configured.", 503);
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new AgentRuntimeError("Audit service is not configured.", 503);
  }
  return raw;
}

function timeoutMs(): number {
  const configured = Number(process.env.AGENT_RUNTIME_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 5_000 && configured <= 50_000
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

async function readLimitedBody(response: Response): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    throw new AgentRuntimeError("Audit service returned an invalid response.", 502, true);
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new AgentRuntimeError("Audit service returned an invalid response.", 502, true);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function upstreamError(status: number): AgentRuntimeError {
  if ([400, 413, 422].includes(status)) {
    return new AgentRuntimeError("We couldn't check that website. Verify the address and try again.", 400);
  }
  if (status === 408 || status === 429) {
    return new AgentRuntimeError(
      "The preview is busy right now. Please try again shortly.",
      429,
      status === 408
    );
  }
  return new AgentRuntimeError(
    "The preview service could not finish this check. Please try again later.",
    503,
    true
  );
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AgentRuntimeError(`Audit service returned invalid ${label}.`, 502);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new AgentRuntimeError(`Audit service returned invalid ${label}.`, 502);
  }
  return value;
}

function asText(value: unknown, label: string, max: number, allowEmpty = true): string {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) {
    throw new AgentRuntimeError(`Audit service returned invalid ${label}.`, 502);
  }
  return value;
}

function asCount(value: unknown, label: string, max: number): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > max) {
    throw new AgentRuntimeError(`Audit service returned invalid ${label}.`, 502);
  }
  return value as number;
}

function asRate(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new AgentRuntimeError(`Audit service returned invalid ${label}.`, 502);
  }
  return value;
}

export function parseAuditReport(value: unknown, expectedDomainUrl: string): AuditReportData {
  const root = asRecord(value, "report");
  const returnedDomain = asText(root.domain_url, "domain URL", 2048, false);
  try {
    if (new URL(returnedDomain).origin !== new URL(expectedDomainUrl).origin) {
      throw new Error("domain mismatch");
    }
  } catch {
    throw new AgentRuntimeError("Audit service returned a report for the wrong website.", 502);
  }

  const findings = asArray(root.findings, "findings", 50).map((item): AuditFinding => {
    const finding = asRecord(item, "finding");
    const severity = asText(finding.severity, "finding severity", 16);
    return {
      code: asText(finding.code, "finding code", 80, false),
      severity: ["high", "medium", "low"].includes(severity) ? severity : "low",
      title: asText(finding.title, "finding title", 300, false),
      detail: asText(finding.detail, "finding detail", 4_000),
      recommendation: asText(finding.recommendation, "finding recommendation", 4_000),
      url: finding.url === null ? null : asText(finding.url, "finding URL", 2048),
    };
  });

  const queries = asArray(root.queries, "answer scenarios", 50).map((item): AuditQuery => {
    const query = asRecord(item, "answer scenario");
    const samples = asCount(query.samples, "sample count", 100);
    if (samples < 1) throw new AgentRuntimeError("Audit service returned invalid sample count.", 502);
    const citedCount = asCount(query.cited_count, "mention count", samples);
    const citationFrequency = asRate(query.citation_frequency, "mention frequency");
    const confidenceLow = asRate(query.confidence_low, "confidence interval");
    const confidenceHigh = asRate(query.confidence_high, "confidence interval");
    if (
      Math.abs(citationFrequency - citedCount / samples) > 0.01 ||
      confidenceLow > confidenceHigh
    ) {
      throw new AgentRuntimeError("Audit service returned inconsistent answer results.", 502);
    }
    return {
      engine: asText(query.engine, "engine label", 80, false),
      query: asText(query.query, "scenario query", 500, false),
      cited_count: citedCount,
      samples,
      citation_frequency: citationFrequency,
      confidence_low: confidenceLow,
      confidence_high: confidenceHigh,
      measured: query.measured === true,
    };
  });

  const recommendations = asArray(root.recommendations, "recommendations", 50).map(
    (item): AuditRecommendation => {
      const recommendation = asRecord(item, "recommendation");
      const provenance = recommendation.provenance === "measured" ? "measured" : "estimated";
      return {
        rank: asCount(recommendation.rank, "recommendation rank", 100),
        priority: asCount(recommendation.priority, "recommendation priority", 100),
        kind: asText(recommendation.kind, "recommendation kind", 40, false),
        title: asText(recommendation.title, "recommendation title", 300, false),
        rationale: asText(recommendation.rationale, "recommendation rationale", 24_000),
        action: asText(recommendation.action, "recommendation action", 4_000),
        provenance,
        evidence: asText(recommendation.evidence, "recommendation evidence", 16_000),
      };
    }
  );

  let sampleDraft: RuntimeDraft | null = null;
  if (root.sample_draft !== null && root.sample_draft !== undefined) {
    const draft = asRecord(root.sample_draft, "sample draft");
    sampleDraft = {
      id: asText(draft.id, "sample draft ID", 200, false),
      title: asText(draft.title, "sample draft title", 500),
      body: asText(draft.body, "sample draft body", 30_000),
      status: asText(draft.status, "sample draft status", 80),
    };
  }

  let methodology: AuditReportData["methodology"];
  if (root.methodology !== undefined) {
    const method = asRecord(root.methodology, "methodology");
    const visibilityMethod = asText(method.visibility_method, "visibility method", 40);
    if (!["modeled-scenario", "live-engine", "mixed"].includes(visibilityMethod)) {
      throw new AgentRuntimeError("Audit service returned invalid methodology.", 502);
    }
    methodology = {
      version: asText(method.version, "methodology version", 80, false),
      crawled_page_limit: asCount(method.crawled_page_limit, "page limit", 100),
      visibility_method: visibilityMethod as NonNullable<AuditReportData["methodology"]>["visibility_method"],
      samples_per_query: asCount(method.samples_per_query, "samples per query", 100),
    };
    if (
      (methodology.visibility_method === "modeled-scenario" && queries.some((query) => query.measured)) ||
      (methodology.visibility_method === "live-engine" && queries.some((query) => !query.measured))
    ) {
      throw new AgentRuntimeError("Audit service returned inconsistent methodology.", 502);
    }
  }

  const crawledUrls = root.crawled_urls === undefined ? undefined
    : asArray(root.crawled_urls, "crawled pages", 100).map((value) => {
      const raw = asText(value, "crawled page URL", 2048, false);
      let url: URL;
      try { url = new URL(raw); } catch {
        throw new AgentRuntimeError("Audit service returned invalid crawl evidence.", 502);
      }
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
        throw new AgentRuntimeError("Audit service returned invalid crawl evidence.", 502);
      }
      return url.href;
    });
  let auditedAt: string | null = null;
  if (root.audited_at !== undefined && root.audited_at !== null) {
    auditedAt = asText(root.audited_at, "audit timestamp", 80, false);
    if (!Number.isFinite(Date.parse(auditedAt))) {
      throw new AgentRuntimeError("Audit service returned invalid audit timestamp.", 502);
    }
    auditedAt = new Date(auditedAt).toISOString();
  }

  return {
    domain_url: expectedDomainUrl,
    crawled_urls: crawledUrls,
    audited_at: auditedAt,
    page_title: asText(root.page_title, "page title", 500),
    findings,
    queries,
    recommendations,
    sample_draft: sampleDraft,
    detected_voice:
      root.detected_voice === null || root.detected_voice === undefined
        ? null
        : asText(root.detected_voice, "detected voice", 4_000),
    methodology,
  };
}

async function call(path: string, init: RequestInit, expectedDomainUrl: string): Promise<AuditReportData> {
  const secret = process.env.AGENT_RUNTIME_SHARED_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new AgentRuntimeError("Audit service is not configured.", 503);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetch(`${runtimeBaseUrl()}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-queryclear-runtime-key": secret,
        ...init.headers,
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) throw upstreamError(response.status);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
      throw new AgentRuntimeError("Audit service returned an invalid response.", 502, true);
    }
    const raw = await readLimitedBody(response);
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new AgentRuntimeError("Audit service returned an invalid response.", 502, true);
    }
    try {
      return parseAuditReport(data, expectedDomainUrl);
    } catch (error) {
      if (error instanceof AgentRuntimeError) {
        throw new AgentRuntimeError(error.message, error.status, true);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AgentRuntimeError) throw error;
    throw new AgentRuntimeError("The preview service is temporarily unavailable.", 503, true);
  } finally {
    clearTimeout(timer);
  }
}

export function runAudit(input: {
  orgId: string;
  domainId: string;
  domainUrl: string;
  brand?: string;
  samples?: number;
}): Promise<AuditReportData> {
  return call("/api/audit", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.orgId,
      domain_id: input.domainId,
      domain_url: input.domainUrl,
      brand: input.brand,
      samples: input.samples ?? 1
    })
  }, input.domainUrl);
}
