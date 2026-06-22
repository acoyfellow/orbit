import { requirePublicHttpsUrl } from "../kernel/public-url.js";

export async function boundedFetch(
  rawUrl: string,
  maxBytes: number,
  timeoutMs: number,
): Promise<{ text: string; retrievedAt: string }> {
  const url = requirePublicHttpsUrl(rawUrl).toString();
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept:
        "application/json, application/rss+xml, application/xml, text/xml",
    },
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${url}: redirects are not followed`);
  }
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new Error(`${url}: response too large`);
  if (!response.body) throw new Error(`${url}: empty response body`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(`${url}: response too large`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    retrievedAt: new Date().toISOString(),
  };
}
export function clean(value: unknown, max = 500): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
