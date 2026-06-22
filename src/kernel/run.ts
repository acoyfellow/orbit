import type { Brief, RunSpec } from "../contracts.js";
import { collectJson } from "../adapters/json.js";
import { collectRss } from "../adapters/rss.js";
import { digest } from "./canonical.js";
import { validateSpec } from "./validate.js";
import { applyLenses } from "../lenses/deterministic.js";
export async function run(value: unknown): Promise<Brief> {
  validateSpec(value);
  const spec: RunSpec = value;
  const startedAt = new Date().toISOString();
  const evidence = (
    await Promise.all(
      spec.sources.map((s) =>
        s.type === "json"
          ? collectJson(s, spec.limits)
          : collectRss(s, spec.limits),
      ),
    )
  )
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
    evidence,
    ...result,
  };
}
