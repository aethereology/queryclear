// Server-side client for the QueryClear agent runtime (a separate Vercel
// project). Only the read-only audit is used here; the browser never calls the
// runtime directly — the /api/public/audit route proxies server-to-server.

const BASE_URL = process.env.AGENT_RUNTIME_URL ?? "http://127.0.0.1:8080";

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
  findings: AuditFinding[];
  queries: AuditQuery[];
  recommendations: AuditRecommendation[];
  sample_draft: RuntimeDraft | null;
  detected_voice: string | null;
}

export class AgentRuntimeError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AgentRuntimeError";
  }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
      cache: "no-store"
    });
  } catch {
    throw new AgentRuntimeError(`Audit service unreachable at ${BASE_URL}.`, 503);
  }
  if (!response.ok) {
    const detail = await response
      .clone()
      .json()
      .then((b: { error?: string; detail?: string }) => b.error ?? b.detail ?? "")
      .catch(async () => response.text().catch(() => ""));
    throw new AgentRuntimeError(detail || response.statusText, response.status);
  }
  return (await response.json()) as T;
}

export function runAudit(input: {
  orgId: string;
  domainId: string;
  domainUrl: string;
  brand?: string;
  samples?: number;
}): Promise<AuditReportData> {
  return call<AuditReportData>("/api/audit", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.orgId,
      domain_id: input.domainId,
      domain_url: input.domainUrl,
      brand: input.brand,
      samples: input.samples ?? 1
    })
  });
}
