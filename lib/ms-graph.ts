// Minimal, read-only Microsoft Graph client for reply detection — used only by
// the warm-scan cron. No SDK: two REST calls (client-credentials token, then
// list messages) via a read-only Mail.Read application permission on the
// mailbox where outreach replies land. Deliberately does NOT touch mail flow
// (no MX change, no send-as) — see docs/automation/SWARM.md for why that
// matters given the existing Cloudflare→M365 routing.

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function getAccessToken(): Promise<string | null> {
  const tenant = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) return null;

  let res: Response;
  try {
    res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const body = (await res.json().catch(() => ({}))) as { access_token?: string };
  return body.access_token ?? null;
}

export interface GraphMessage {
  id: string;
  from?: { emailAddress?: { address?: string } };
  receivedDateTime: string;
  subject?: string;
  bodyPreview?: string;
}

// Messages received at/after `sinceIso`, newest first, capped at `top`.
// Returns [] (never throws) if Graph isn't configured or the call fails — the
// warm-scan cron degrades to a no-op rather than breaking the send cron.
export async function fetchRecentMessages(sinceIso: string, top = 50): Promise<GraphMessage[]> {
  const token = await getAccessToken();
  const mailbox = process.env.MS_GRAPH_MAILBOX;
  if (!token || !mailbox) return [];

  const filter = encodeURIComponent(`receivedDateTime ge ${sinceIso}`);
  const url =
    `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/messages` +
    `?$filter=${filter}&$top=${top}&$orderby=receivedDateTime desc` +
    `&$select=id,from,receivedDateTime,subject,bodyPreview`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { value?: GraphMessage[] };
  return body.value ?? [];
}
