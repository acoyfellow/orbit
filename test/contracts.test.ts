import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Analyzer, Evidence, Outcome } from "../src/contracts.js";
import { applyAssistedLens } from "../src/lenses/assisted.js";
import { validateOutcome } from "../src/outcome.js";

const outcome: Outcome = {
  version: 1,
  runId: "run_0123456789abcdef",
  status: "accepted",
  recordedAt: "2026-06-22T00:00:00.000Z",
  summary: "Shipped after review.",
};

test("validates and appends the versioned run outcome to a requested ledger", async () => {
  validateOutcome(outcome);
  assert.throws(() => validateOutcome({ ...outcome, runId: "other" }), /runId/);
  const directory = await mkdtemp(join(tmpdir(), "orbit-outcome-"));
  const input = join(directory, "outcome.json");
  const ledger = join(directory, "state", "outcomes.jsonl");
  await writeFile(input, JSON.stringify(outcome));
  execFileSync("npx", ["tsx", "src/cli.ts", "record-outcome", input, ledger]);
  assert.deepEqual(
    JSON.parse((await readFile(ledger, "utf8")).trim()),
    outcome,
  );
});

test("reuses an equivalent content-addressed brief in the output directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "orbit-reuse-"));
  const spec = join(directory, "spec.json");
  const output = join(directory, "output");
  await writeFile(
    spec,
    JSON.stringify({
      version: 1,
      name: "empty",
      sources: [],
      lenses: [
        { type: "filter-summary", maxClaims: 1 },
        { type: "evidence-actions", maxProposals: 0 },
      ],
      limits: { maxSources: 1, maxBytesPerSource: 10, timeoutMs: 10 },
    }),
  );
  execFileSync("npx", ["tsx", "src/cli.ts", "run", spec, output]);
  const before = await stat(join(output, "brief.json"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  const message = execFileSync(
    "npx",
    ["tsx", "src/cli.ts", "run", spec, output],
    { encoding: "utf8" },
  );
  const after = await stat(join(output, "brief.json"));
  assert.match(message, /Reused .* for run_/);
  assert.equal(after.mtimeMs, before.mtimeMs);
});

test("accepts an injected deterministic analyzer and enforces evidence safety", async () => {
  const evidence = [
    {
      id: "evidence_1",
      sourceId: "source",
      sourceUrl: "https://example.com",
      adapter: "json",
      lanes: ["test"],
      retrievedAt: "2026-06-22T00:00:00.000Z",
      visibility: "public",
      title: "Change",
      summary: "A change",
      digest: "abc",
    },
  ] satisfies Evidence[];
  const analyzer: Analyzer = (input) => ({
    claims: [{ id: "c1", text: "Observed", evidenceIds: [input[0]!.id] }],
    gaps: [],
    proposals: [
      {
        id: "p1",
        text: "Review it",
        evidenceIds: [input[0]!.id],
        approvalRequired: true,
      },
    ],
  });
  assert.equal((await applyAssistedLens(evidence, analyzer)).claims.length, 1);
  await assert.rejects(
    applyAssistedLens(evidence, async () => ({
      claims: [{ id: "c1", text: "Unsupported", evidenceIds: ["missing"] }],
      gaps: [],
      proposals: [],
    })),
    /unknown evidence/,
  );
});
