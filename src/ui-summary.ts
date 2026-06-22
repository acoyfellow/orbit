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
  const started = Date.parse(brief.startedAt);
  const completed = Date.parse(brief.completedAt);
  return {
    adapters: [...new Set(spec?.sources.map((source) => source.type) ?? [])],
    sourceCount:
      spec?.sources.length ??
      new Set(brief.evidence.map((item) => item.sourceId)).size,
    durationMs:
      Number.isFinite(started) && Number.isFinite(completed)
        ? Math.max(0, completed - started)
        : 0,
    lenses: spec?.lenses.map((lens) => lens.type) ?? [],
    evidenceCount: brief.evidence.length,
    claimCount: brief.claims.length,
    gapCount: brief.gaps.length,
    proposalCount: brief.proposals.length,
  };
}
