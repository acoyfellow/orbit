import assert from "node:assert/strict";
import test from "node:test";
import type { Brief, RunSpec } from "../src/contracts.js";
import { summarizeRun } from "../src/ui-summary.js";

const brief: Brief = {
  version: 1,
  runId: "run_test",
  specName: "test",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:01.250Z",
  evidence: [],
  claims: [],
  gaps: [{ id: "gap_1", text: "None", evidenceIds: [] }],
  proposals: [],
};
const spec: RunSpec = {
  version: 1,
  name: "test",
  sources: [
    {
      id: "json",
      type: "json",
      url: "https://example.com/a",
      maxItems: 1,
      lanes: ["test"],
    },
    {
      id: "rss",
      type: "rss",
      url: "https://example.com/b",
      maxItems: 1,
      lanes: ["test"],
    },
  ],
  lenses: [
    { type: "filter-summary", maxClaims: 2 },
    { type: "evidence-actions", maxProposals: 1 },
  ],
  limits: { maxSources: 2, maxBytesPerSource: 1000, timeoutMs: 1000 },
};

test("summarizeRun reports pipeline, timing, and output counts", () => {
  assert.deepEqual(summarizeRun(brief, spec), {
    adapters: ["json", "rss"],
    sourceCount: 2,
    durationMs: 1250,
    lenses: ["filter-summary", "evidence-actions"],
    evidenceCount: 0,
    claimCount: 0,
    gapCount: 1,
    proposalCount: 0,
  });
});

test("summarizeRun tolerates an SSR optional-prop sentinel", () => {
  const summary = summarizeRun(brief, {} as RunSpec);
  assert.deepEqual(summary.adapters, []);
  assert.deepEqual(summary.lenses, []);
  assert.equal(summary.sourceCount, 0);
});

test("summarizeRun derives fixture source count and clamps negative timing", () => {
  const fixture = {
    ...brief,
    startedAt: brief.completedAt,
    completedAt: brief.startedAt,
    evidence: [
      {
        id: "e1",
        sourceId: "source",
        sourceUrl: "https://example.com",
        adapter: "json" as const,
        lanes: ["test"],
        retrievedAt: brief.startedAt,
        visibility: "public" as const,
        title: "Evidence",
        summary: "Summary",
        digest: "sha256:test",
      },
    ],
  };
  assert.equal(summarizeRun(fixture).sourceCount, 1);
  assert.equal(summarizeRun(fixture).durationMs, 0);
});
