export type Visibility = "public" | "private";
export type Lane = string;
interface SourceGrouping {
  /** Operator-declared, bounded grouping labels; not inferred quality. */
  lanes: Lane[];
}
export interface JsonSource extends SourceGrouping {
  id: string;
  type: "json";
  url: string;
  maxItems: number;
  titlePath?: string;
  summaryPath?: string;
}
export interface RssSource extends SourceGrouping {
  id: string;
  type: "rss";
  url: string;
  maxItems: number;
}
export interface GitHubReleasesSource extends SourceGrouping {
  id: string;
  type: "github-releases";
  owner: string;
  repo: string;
  maxItems: number;
}
export type Source = JsonSource | RssSource | GitHubReleasesSource;
export interface FilterLens {
  type: "filter-summary";
  include?: string[];
  maxClaims: number;
}
export interface ActionLens {
  type: "evidence-actions";
  maxProposals: number;
}
export interface RunSpec {
  version: 1;
  name: string;
  sources: Source[];
  lenses: [FilterLens, ActionLens];
  limits: { maxSources: number; maxBytesPerSource: number; timeoutMs: number };
}
export interface Evidence {
  id: string;
  sourceId: string;
  sourceUrl: string;
  adapter: Source["type"];
  lanes: Lane[];
  itemUrl?: string;
  retrievedAt: string;
  visibility: Visibility;
  title: string;
  summary: string;
  digest: string;
}
export interface Claim {
  id: string;
  text: string;
  evidenceIds: string[];
}
export interface Gap {
  id: string;
  text: string;
  evidenceIds: string[];
}
export interface Proposal {
  id: string;
  text: string;
  evidenceIds: string[];
  approvalRequired: true;
}
export interface Outcome {
  version: 1;
  runId: string;
  status: "accepted" | "rejected" | "no-action";
  recordedAt: string;
  summary: string;
}
export type Analysis = Pick<Brief, "claims" | "gaps" | "proposals">;
/** A host-supplied seam: Orbit does not select a model or provide bindings. */
export type Analyzer = (
  evidence: readonly Evidence[],
) => Promise<Analysis> | Analysis;
export interface Brief {
  version: 1;
  runId: string;
  specName: string;
  startedAt: string;
  completedAt: string;
  evidence: Evidence[];
  claims: Claim[];
  gaps: Gap[];
  proposals: Proposal[];
}
