import type { Brief, RunSpec } from "./contracts.js";

export type RunSummary = {
  adapters: string[];
  sourceCount: number;
  durationMs: number;
  lenses: string[];
  evidenceCount: number;
  claimCount: number;
  gapCount: number;
  proposalCount: number;
};

export function summarizeRun(brief: Brief, spec?: RunSpec): RunSummary {
  // SSR serialization can represent an uninitialized optional prop as a
  // non-RunSpec sentinel. Treat only complete specs as provenance metadata.
  const usableSpec =
    spec && Array.isArray(spec.sources) && Array.isArray(spec.lenses)
      ? spec
      : undefined;
  const started = Date.parse(brief.startedAt);
  const completed = Date.parse(brief.completedAt);
  return {
    adapters: [
      ...new Set(usableSpec?.sources.map((source) => source.type) ?? []),
    ],
    sourceCount:
      usableSpec?.sources.length ??
      new Set(brief.evidence.map((item) => item.sourceId)).size,
    durationMs:
      Number.isFinite(started) && Number.isFinite(completed)
        ? Math.max(0, completed - started)
        : 0,
    lenses: usableSpec?.lenses.map((lens) => lens.type) ?? [],
    evidenceCount: brief.evidence.length,
    claimCount: brief.claims.length,
    gapCount: brief.gaps.length,
    proposalCount: brief.proposals.length,
  };
}
