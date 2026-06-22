import type { Evidence, RssSource, RunSpec } from "../contracts.js";
import { digest } from "../kernel/canonical.js";
import { boundedFetch, clean } from "./shared.js";
const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
function tag(xml: string, name: string) {
  const m = xml.match(
    new RegExp(
      `<${name}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`,
      "i",
    ),
  );
  return clean(decode(m?.[1] ?? ""), 1000);
}
export async function collectRss(
  source: RssSource,
  limits: RunSpec["limits"],
): Promise<Evidence[]> {
  const { text, retrievedAt } = await boundedFetch(
    source.url,
    limits.maxBytesPerSource,
    limits.timeoutMs,
  );
  const blocks = [...text.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((m) => m[1] ?? "")
    .slice(0, source.maxItems);
  return Promise.all(
    blocks.map(async (xml, i) => {
      const title = tag(xml, "title") || `Item ${i + 1}`;
      const summary = tag(xml, "description");
      const itemUrl = tag(xml, "link") || undefined;
      const d = await digest({ sourceId: source.id, title, summary, itemUrl });
      return {
        id: `ev_${d.slice(0, 16)}`,
        sourceId: source.id,
        sourceUrl: source.url,
        itemUrl,
        retrievedAt,
        visibility: "public" as const,
        title,
        summary,
        digest: d,
      };
    }),
  );
}
