import type { Brief, Evidence, FilterLens, ActionLens } from "../contracts.js";
export function applyLenses(
  evidence: Evidence[],
  filter: FilterLens,
  action: ActionLens,
): Pick<Brief, "claims" | "gaps" | "proposals"> {
  const words = (filter.include ?? []).map((x) => x.toLowerCase());
  const selected = evidence
    .filter(
      (e) =>
        !words.length ||
        words.some((w) => `${e.title} ${e.summary}`.toLowerCase().includes(w)),
    )
    .slice(0, filter.maxClaims);
  const claims = selected.map((e, i) => ({
    id: `claim_${i + 1}`,
    text: e.title,
    evidenceIds: [e.id],
  }));
  const gaps = [] as Brief["gaps"];
  if (!evidence.length)
    gaps.push({
      id: "gap_1",
      text: "No evidence was collected.",
      evidenceIds: [],
    });
  else if (!selected.length)
    gaps.push({
      id: "gap_1",
      text: "Evidence did not match the configured filter.",
      evidenceIds: evidence.map((e) => e.id),
    });
  const proposals = claims.slice(0, action.maxProposals).map((c, i) => ({
    id: `proposal_${i + 1}`,
    text: `Worth a look: ${c.text.slice(0, 180)}`,
    evidenceIds: c.evidenceIds,
    approvalRequired: true as const,
  }));
  return { claims, gaps, proposals };
}
