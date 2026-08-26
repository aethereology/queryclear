const MAX_URL_LENGTH = 2048;

export class PublicAuditUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicAuditUrlError";
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isClearlyNonPublicHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa")
  ) {
    return true;
  }
  if (isPrivateIpv4(host)) return true;
  if (host.includes(":")) {
    const compact = host.replace(/^0+(?=:)/, "");
    return (
      compact === "::" ||
      compact === "::1" ||
      compact.startsWith("fc") ||
      compact.startsWith("fd") ||
      /^fe[89ab]/.test(compact) ||
      compact.startsWith("::ffff:127.") ||
      compact.startsWith("::ffff:10.") ||
      compact.startsWith("::ffff:192.168.")
    );
  }
  return false;
}

/**
 * Normalize public-audit input to a website origin. This is an early rejection
 * layer only; the crawler must resolve and pin public IPs for every redirect.
 */
export function normalizePublicAuditUrl(raw: string): string {
  const input = raw.trim();
  if (!input) throw new PublicAuditUrlError("Please enter a website URL.");
  if (input.length > MAX_URL_LENGTH) {
    throw new PublicAuditUrlError("That website URL is too long.");
  }

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    throw new PublicAuditUrlError("Enter a public website, such as example.com.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new PublicAuditUrlError("Only public http and https websites can be checked.");
  }
  if (url.username || url.password) {
    throw new PublicAuditUrlError("Website URLs cannot include a username or password.");
  }
  if (!url.hostname || isClearlyNonPublicHost(url.hostname)) {
    throw new PublicAuditUrlError("Enter a public website, not a local or private address.");
  }
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) {
    throw new PublicAuditUrlError("Only standard website ports can be checked.");
  }

  return `${url.protocol}//${url.host}/`;
}
