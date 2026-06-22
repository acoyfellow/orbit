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
  const text = await response.text();
  if (new TextEncoder().encode(text).length > maxBytes)
    throw new Error(`${url}: response too large`);
  return { text, retrievedAt: new Date().toISOString() };
}
export function clean(value: unknown, max = 500): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
