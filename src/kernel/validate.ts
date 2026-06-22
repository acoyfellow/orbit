import type { RunSpec } from "../contracts.js";
import { requirePublicHttpsUrl } from "./public-url.js";
export function validateSpec(value: unknown): asserts value is RunSpec {
  if (!value || typeof value !== "object")
    throw new Error("spec must be an object");
  const s = value as Partial<RunSpec>;
  if (s.version !== 1 || !s.name || !Array.isArray(s.sources) || !s.limits)
    throw new Error("invalid version, name, sources, or limits");
  if (s.sources.length > s.limits.maxSources || s.limits.maxSources > 20)
    throw new Error("source limit exceeded");
  if (s.limits.maxBytesPerSource > 1_000_000 || s.limits.timeoutMs > 30_000)
    throw new Error("unsafe limits");
  for (const source of s.sources) {
    if (
      !["json", "rss"].includes(source.type) ||
      source.maxItems < 1 ||
      source.maxItems > 100
    )
      throw new Error("invalid source");
    requirePublicHttpsUrl(source.url);
  }
  if (
    !Array.isArray(s.lenses) ||
    s.lenses.length !== 2 ||
    s.lenses[0]?.type !== "filter-summary" ||
    s.lenses[1]?.type !== "evidence-actions"
  )
    throw new Error("two deterministic lenses required");
}
