import type { OwnerAuditEntry } from "./owner-audits";

/** Validate the private history response before rendering timestamps and controls. */
export function parseOwnerHistory(value: unknown, now = Date.now()): OwnerAuditEntry[] {
  if (!Array.isArray(value) || value.length > 40) throw new Error("Invalid audit history");
  const seen = new Set<string>();
  return value.filter((entry): entry is OwnerAuditEntry => {
    if (!entry || typeof entry !== "object" || typeof entry.token !== "string" || !entry.token || entry.token.length > 128 ||
      typeof entry.domainUrl !== "string" || entry.domainUrl.length > 2048 ||
      !Number.isFinite(entry.createdAt) || !Number.isFinite(entry.expiresAt) ||
      entry.createdAt < 0 || entry.expiresAt <= entry.createdAt) throw new Error("Invalid audit history");
    if (entry.expiresAt <= now || seen.has(entry.token)) return false;
    seen.add(entry.token);
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);
}

export function filterOwnerHistory(entries: OwnerAuditEntry[], query: string, now = Date.now()) {
  const term = query.trim().toLocaleLowerCase();
  return entries.filter(entry => entry.expiresAt > now && entry.domainUrl.toLocaleLowerCase().includes(term));
}
