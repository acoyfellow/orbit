import type { Brief, RunSpec } from "../contracts.js";
import { collectJson } from "../adapters/json.js";
import { collectRss } from "../adapters/rss.js";
import { collectGitHubReleases } from "../adapters/github-releases.js";
import { digest } from "./canonical.js";
import { validateSpec } from "./validate.js";
import { applyLenses } from "../lenses/deterministic.js";
export async function run(value: unknown): Promise<Brief> {
  validateSpec(value);
  const spec: RunSpec = value;
  const startedAt = new Date().toISOString();
  const collectedBySource = await Promise.all(
    spec.sources.map((s) =>
      s.type === "json"
        ? collectJson(s, spec.limits)
        : s.type === "rss"
          ? collectRss(s, spec.limits)
          : collectGitHubReleases(s, spec.limits),
    ),
  );
  const evidence = collectedBySource
    .flat()
    .sort(
      (a, b) =>
        a.sourceId.localeCompare(b.sourceId) || a.id.localeCompare(b.id),
    );
  const result = applyLenses(evidence, spec.lenses[0], spec.lenses[1]);
  const runId = `run_${(await digest({ spec, evidence: evidence.map((e) => e.digest) })).slice(0, 16)}`;
  return {
    version: 1,
    runId,
    specName: spec.name,
    startedAt,
    completedAt: new Date().toISOString(),
    sourceReceipts: spec.sources.map((source, index) => {
      const collectedItems = collectedBySource[index]?.length ?? 0;
      const truncated = collectedItems >= source.maxItems;
      const sourceUrl =
        source.type === "github-releases"
          ? `https://api.github.com/repos/${source.owner}/${source.repo}/releases?per_page=${source.maxItems}`
          : source.url;
      return {
        sourceId: source.id,
        sourceUrl,
        status: truncated ? ("partial" as const) : ("complete" as const),
        collectedItems,
        maxItems: source.maxItems,
        truncated,
        ...(truncated
          ? {
              detail: `Collection stopped at the configured maxItems limit (${source.maxItems}); more upstream items may exist.`,
            }
          : {}),
      };
    }),
    evidence,
    ...result,
  };
}
