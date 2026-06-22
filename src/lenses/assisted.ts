import type { Analysis, Analyzer, Brief, Evidence } from "../contracts.js";

/** Apply an explicitly injected analyzer and reject unsupported citations. */
export async function applyAssistedLens(
  evidence: readonly Evidence[],
  analyzer: Analyzer,
): Promise<Pick<Brief, "claims" | "gaps" | "proposals">> {
  const result: unknown = await analyzer(evidence);
  validateAnalysis(result, new Set(evidence.map((item) => item.id)));
  return result;
}

function validateAnalysis(
  value: unknown,
  evidenceIds: Set<string>,
): asserts value is Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("analyzer result must be an object");
  const record = value as Record<string, unknown>;
  const extra = Object.keys(record).find(
    (key) => !["claims", "gaps", "proposals"].includes(key),
  );
  if (extra) throw new Error(`analyzer result has unknown property: ${extra}`);
  for (const kind of ["claims", "gaps", "proposals"] as const) {
    const entries = record[kind];
    if (!Array.isArray(entries)) throw new Error(`invalid analyzer ${kind}`);
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        throw new Error(`invalid analyzer ${kind}`);
      const item = entry as Record<string, unknown>;
      const allowed =
        kind === "proposals"
          ? ["id", "text", "evidenceIds", "approvalRequired"]
          : ["id", "text", "evidenceIds"];
      if (Object.keys(item).some((key) => !allowed.includes(key)))
        throw new Error(`invalid analyzer ${kind}`);
      if (typeof item.id !== "string" || !item.id.trim())
        throw new Error(`invalid analyzer ${kind} id`);
      if (typeof item.text !== "string" || !item.text.trim())
        throw new Error(`invalid analyzer ${kind} text`);
      if (
        !Array.isArray(item.evidenceIds) ||
        item.evidenceIds.some(
          (id) => typeof id !== "string" || !evidenceIds.has(id),
        )
      )
        throw new Error(`analyzer ${kind} references unknown evidence`);
      if (kind === "proposals" && item.approvalRequired !== true)
        throw new Error("analyzer proposal must require approval");
    }
  }
}
