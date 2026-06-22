export type Visibility = "public" | "private";
export interface JsonSource {
  id: string;
  type: "json";
  url: string;
  maxItems: number;
  titlePath?: string;
  summaryPath?: string;
}
export interface RssSource {
  id: string;
  type: "rss";
  url: string;
  maxItems: number;
}
export type Source = JsonSource | RssSource;
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
