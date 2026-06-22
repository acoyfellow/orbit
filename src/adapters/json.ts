import type { Evidence, JsonSource, RunSpec } from "../contracts.js";
import { digest } from "../kernel/canonical.js";
import { boundedFetch, clean } from "./shared.js";
function get(value: unknown, path = ""): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce((v, k) => (v as Record<string, unknown>)?.[k], value);
}
export async function collectJson(
  source: JsonSource,
  limits: RunSpec["limits"],
): Promise<Evidence[]> {
  const { text, retrievedAt } = await boundedFetch(
    source.url,
    limits.maxBytesPerSource,
    limits.timeoutMs,
  );
  const data: unknown = JSON.parse(text);
  const rows = (Array.isArray(data) ? data : [data]).slice(0, source.maxItems);
  return Promise.all(
    rows.map(async (row, i) => {
      const title = clean(
        get(row, source.titlePath) ?? get(row, "title") ?? `Item ${i + 1}`,
        200,
      );
      const summary = clean(
        get(row, source.summaryPath) ??
          get(row, "body") ??
          get(row, "description"),
      );
      const itemUrl = clean(get(row, "url"), 1000) || undefined;
      const d = await digest({ sourceId: source.id, title, summary, itemUrl });
      return {
        id: `ev_${d.slice(0, 16)}`,
        sourceId: source.id,
        sourceUrl: source.url,
        adapter: source.type,
        lanes: source.lanes,
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
