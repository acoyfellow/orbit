import type { Brief, RunSpec } from "../contracts.js";
import { requirePublicHttpsUrl } from "./public-url.js";

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const exact = (
  value: Record<string, unknown>,
  allowed: string[],
  label: string,
) => {
  const extra = Object.keys(value).find((key) => !allowed.includes(key));
  if (extra) throw new Error(`${label} has unknown property: ${extra}`);
};
const integer = (value: unknown, min: number, max: number, label: string) => {
  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    throw new Error(`invalid ${label}`);
};
const text = (value: unknown, label: string, max = 2000) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`invalid ${label}`);
};
const stringArray = (value: unknown, label: string) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new Error(`invalid ${label}`);
};

export function validateSpec(value: unknown): asserts value is RunSpec {
  if (!object(value)) throw new Error("spec must be an object");
  exact(value, ["version", "name", "sources", "lenses", "limits"], "spec");
  if (value.version !== 1) throw new Error("invalid version");
  text(value.name, "name", 200);
  if (
    !Array.isArray(value.sources) ||
    !Array.isArray(value.lenses) ||
    !object(value.limits)
  )
    throw new Error("invalid sources, lenses, or limits");
  exact(
    value.limits,
    ["maxSources", "maxBytesPerSource", "timeoutMs"],
    "limits",
  );
  integer(value.limits.maxSources, 1, 20, "maxSources");
  integer(value.limits.maxBytesPerSource, 1, 1_000_000, "maxBytesPerSource");
  integer(value.limits.timeoutMs, 1, 30_000, "timeoutMs");
  if (value.sources.length > (value.limits.maxSources as number))
    throw new Error("source limit exceeded");
  const ids = new Set<string>();
  for (const source of value.sources) {
    if (!object(source)) throw new Error("invalid source");
    const common = ["id", "type", "url", "maxItems"];
    if (source.type === "json")
      exact(source, [...common, "titlePath", "summaryPath"], "source");
    else if (source.type === "rss") exact(source, common, "source");
    else if (source.type === "github-releases")
      exact(source, ["id", "type", "owner", "repo", "maxItems"], "source");
    else throw new Error("invalid source type");
    text(source.id, "source id", 100);
    if (ids.has(source.id as string)) throw new Error("duplicate source id");
    ids.add(source.id as string);
    if (source.type === "github-releases") {
      text(source.owner, "repository owner", 100);
      text(source.repo, "repository name", 100);
      const repositoryPart = /^[A-Za-z0-9_.-]+$/;
      if (
        !repositoryPart.test(source.owner as string) ||
        !repositoryPart.test(source.repo as string)
      )
        throw new Error("invalid GitHub repository");
    } else {
      text(source.url, "source url", 2000);
      requirePublicHttpsUrl(source.url as string);
    }
    integer(source.maxItems, 1, 100, "maxItems");
    for (const key of ["titlePath", "summaryPath"])
      if (source[key] !== undefined) text(source[key], key, 200);
  }
  if (value.lenses.length !== 2)
    throw new Error("two deterministic lenses required");
  const [filter, actions] = value.lenses;
  if (!object(filter) || filter.type !== "filter-summary")
    throw new Error("filter-summary lens required");
  exact(filter, ["type", "include", "maxClaims"], "filter lens");
  if (filter.include !== undefined) stringArray(filter.include, "include");
  integer(filter.maxClaims, 1, 100, "maxClaims");
  if (!object(actions) || actions.type !== "evidence-actions")
    throw new Error("evidence-actions lens required");
  exact(actions, ["type", "maxProposals"], "action lens");
  integer(actions.maxProposals, 0, 100, "maxProposals");
}

export function validateBrief(value: unknown): asserts value is Brief {
  if (!object(value)) throw new Error("brief must be an object");
  exact(
    value,
    [
      "version",
      "runId",
      "specName",
      "startedAt",
      "completedAt",
      "evidence",
      "claims",
      "gaps",
      "proposals",
    ],
    "brief",
  );
  if (value.version !== 1) throw new Error("invalid brief version");
  for (const key of ["runId", "specName", "startedAt", "completedAt"])
    text(value[key], `brief ${key}`);
  if (
    !Array.isArray(value.evidence) ||
    !Array.isArray(value.claims) ||
    !Array.isArray(value.gaps) ||
    !Array.isArray(value.proposals)
  )
    throw new Error("invalid brief collections");
  for (const evidence of value.evidence) {
    if (!object(evidence)) throw new Error("invalid evidence");
    exact(
      evidence,
      [
        "id",
        "sourceId",
        "sourceUrl",
        "itemUrl",
        "retrievedAt",
        "visibility",
        "title",
        "summary",
        "digest",
      ],
      "evidence",
    );
    for (const key of [
      "id",
      "sourceId",
      "sourceUrl",
      "retrievedAt",
      "title",
      "digest",
    ])
      text(evidence[key], `evidence ${key}`);
    if (
      typeof evidence.summary !== "string" ||
      !["public", "private"].includes(evidence.visibility as string)
    )
      throw new Error("invalid evidence fields");
    if (evidence.itemUrl !== undefined) text(evidence.itemUrl, "itemUrl");
  }
  for (const [name, entries] of [
    ["claim", value.claims],
    ["gap", value.gaps],
    ["proposal", value.proposals],
  ] as const) {
    for (const entry of entries) {
      if (!object(entry)) throw new Error(`invalid ${name}`);
      exact(
        entry,
        name === "proposal"
          ? ["id", "text", "evidenceIds", "approvalRequired"]
          : ["id", "text", "evidenceIds"],
        name,
      );
      text(entry.id, `${name} id`);
      text(entry.text, `${name} text`);
      stringArray(entry.evidenceIds, `${name} evidenceIds`);
      if (name === "proposal" && entry.approvalRequired !== true)
        throw new Error("proposal must require approval");
    }
  }
}
