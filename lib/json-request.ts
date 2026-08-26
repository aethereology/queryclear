export type JsonRequestResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

function isJsonMediaType(value: string | null): boolean {
  if (!value) return false;
  const mediaType = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return mediaType === "application/json" || /^application\/[a-z\d!#$&^_.+-]+\+json$/.test(mediaType);
}

/** Read a JSON request without ever buffering more than the route's local cap. */
export async function readJsonRequest(
  request: Request,
  maxBytes: number,
): Promise<JsonRequestResult> {
  if (!isJsonMediaType(request.headers.get("content-type"))) {
    return { ok: false, status: 415, error: "Content-Type must be application/json." };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    if (!/^\d+$/.test(contentLength)) {
      return { ok: false, status: 400, error: "Invalid request." };
    }
    if (Number(contentLength) > maxBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  if (!request.body) return { ok: false, status: 400, error: "Invalid request." };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }
}
