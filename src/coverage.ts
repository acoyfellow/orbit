import type { Brief, RunSpec, Source } from "./contracts.js";

export type CoverageCell = {
  lane: string;
  adapter: Source["type"];
  count: number;
  evidenceIds: string[];
};

export type CoverageMatrix = {
  lanes: string[];
  adapters: Source["type"][];
  cells: CoverageCell[];
};

export function buildCoverageMatrix(
  brief: Brief,
  spec?: RunSpec,
): CoverageMatrix {
  const sources = spec?.sources ?? [];
  const lanes = [...new Set(sources.flatMap((source) => source.lanes))];
  const adapters = [...new Set(sources.map((source) => source.type))];
  const cells = lanes.flatMap((lane) =>
    adapters.map((adapter) => {
      const evidenceIds = brief.evidence
        .filter((item) => item.lanes.includes(lane) && item.adapter === adapter)
        .map((item) => item.id);
      return { lane, adapter, count: evidenceIds.length, evidenceIds };
    }),
  );
  return { lanes, adapters, cells };
}
