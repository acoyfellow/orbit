import type { Brief } from "../contracts.js";
export function markdown(b: Brief): string {
  const list = (xs: { text: string; evidenceIds: string[] }[]) =>
    xs.length
      ? xs
          .map(
            (x) =>
              `- ${x.text} _[${x.evidenceIds.join(", ") || "no evidence"}]_`,
          )
          .join("\n")
      : "- None";
  return `# ${b.specName}\n\nRun \`${b.runId}\` · ${b.completedAt}\n\n## Claims\n\n${list(b.claims)}\n\n## Gaps\n\n${list(b.gaps)}\n\n## Proposed actions (approval required)\n\n${list(b.proposals)}\n\n## Evidence\n\n${b.evidence.map((e) => `- **${e.title}** — [source](${e.itemUrl ?? e.sourceUrl}) · \`${e.id}\` · \`${e.digest}\``).join("\n") || "- None"}\n`;
}
