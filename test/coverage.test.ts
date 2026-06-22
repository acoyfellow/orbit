import assert from "node:assert/strict";
import test from "node:test";
import type { Brief, RunSpec } from "../src/contracts.js";
import { buildCoverageMatrix } from "../src/coverage.js";

const spec: RunSpec = {
  version: 1,
  name: "coverage",
  sources: [
    {
      id: "releases",
      type: "github-releases",
      owner: "example",
      repo: "tool",
      maxItems: 1,
      lanes: ["SDKs"],
    },
    {
      id: "news",
      type: "rss",
      url: "https://example.com/feed",
      maxItems: 1,
      lanes: ["platform"],
    },
  ],
  lenses: [
    { type: "filter-summary", maxClaims: 1 },
    { type: "evidence-actions", maxProposals: 0 },
  ],
  limits: { maxSources: 2, maxBytesPerSource: 1000, timeoutMs: 1000 },
};
const brief: Brief = {
  version: 1,
  runId: "run_test",
  specName: "coverage",
  startedAt: "2026-01-01T00:00:00Z",
  completedAt: "2026-01-01T00:00:01Z",
  evidence: [
    {
      id: "ev_1",
      sourceId: "releases",
      sourceUrl: "https://api.github.com/repos/example/tool/releases",
      adapter: "github-releases",
      lanes: ["SDKs"],
      retrievedAt: "2026-01-01T00:00:00Z",
      visibility: "public",
      title: "Release",
      summary: "",
      digest: "digest",
    },
  ],
  claims: [],
  gaps: [],
  proposals: [],
};

test("coverage keeps explicit lane and adapter dimensions and empty cells", () => {
  const matrix = buildCoverageMatrix(brief, spec);
  assert.deepEqual(matrix.lanes, ["SDKs", "platform"]);
  assert.deepEqual(matrix.adapters, ["github-releases", "rss"]);
  assert.deepEqual(
    matrix.cells.map(({ lane, adapter, count }) => ({ lane, adapter, count })),
    [
      { lane: "SDKs", adapter: "github-releases", count: 1 },
      { lane: "SDKs", adapter: "rss", count: 0 },
      { lane: "platform", adapter: "github-releases", count: 0 },
      { lane: "platform", adapter: "rss", count: 0 },
    ],
  );
  assert.deepEqual(matrix.cells[0]?.evidenceIds, ["ev_1"]);
});
