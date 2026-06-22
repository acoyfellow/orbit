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
  return `# ${b.specName}\n\nRun \`${b.runId}\` · ${b.completedAt}\n\n## Claims\n\n${list(b.claims)}\n\n## Generated gaps\n\n${list(b.gaps)}\n\n## Review notes (not executed)\n\n${list(b.proposals)}\n\n## Source receipts\n\n${b.sourceReceipts.map((r) => `- **${r.sourceId}** — ${r.status}; ${r.collectedItems}/${r.maxItems} items; truncated: ${r.truncated} — [collection endpoint](${r.sourceUrl})`).join("\n") || "- None"}\n\n## Evidence\n\n${b.evidence.map((e) => `- **${e.title}** — [collection endpoint](${e.sourceUrl})${e.itemUrl ? ` · [item](${e.itemUrl})` : ""} · \`${e.id}\` · \`${e.digest}\``).join("\n") || "- None"}\n`;
}
