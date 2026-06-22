import type { Evidence, GitHubReleasesSource, RunSpec } from "../contracts.js";
import { digest } from "../kernel/canonical.js";
import { boundedFetch, clean } from "./shared.js";

const API_VERSION = "2022-11-28";

export async function collectGitHubReleases(
  source: GitHubReleasesSource,
  limits: RunSpec["limits"],
): Promise<Evidence[]> {
  const sourceUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/releases?per_page=${source.maxItems}`;
  const { text, retrievedAt } = await boundedFetch(
    sourceUrl,
    limits.maxBytesPerSource,
    limits.timeoutMs,
    {
      accept: "application/vnd.github+json",
      "user-agent": "orbit-public-monitor/0.0.1",
      "x-github-api-version": API_VERSION,
    },
  );
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data))
    throw new Error(`${sourceUrl}: expected releases array`);
  return Promise.all(
    data.slice(0, source.maxItems).map(async (row, index) => {
      const release = row as Record<string, unknown>;
      const title = clean(
        release.name ?? release.tag_name ?? `Release ${index + 1}`,
        200,
      );
      const summary = clean(release.body ?? "");
      const itemUrl = clean(release.html_url, 1000) || undefined;
      const d = await digest({ sourceId: source.id, title, summary, itemUrl });
      return {
        id: `ev_${d.slice(0, 16)}`,
        sourceId: source.id,
        sourceUrl,
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
