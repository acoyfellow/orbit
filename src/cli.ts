#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { run } from "./kernel/run.js";
import { markdown } from "./kernel/markdown.js";
import { validateBrief } from "./kernel/validate.js";
import { validateOutcome } from "./outcome.js";

const [command, input, ...args] = process.argv.slice(2);
try {
  if (command === "run" && input) {
    const spec = JSON.parse(await readFile(input, "utf8"));
    const collected = await run(spec);
    const out = args[0] ?? "orbit-output";
    const jsonPath = resolve(out, "brief.json");
    const markdownPath = resolve(out, "brief.md");
    await mkdir(out, { recursive: true });
    let brief = collected;
    let reused = false;
    try {
      const existing: unknown = JSON.parse(await readFile(jsonPath, "utf8"));
      validateBrief(existing);
      if (existing.runId === collected.runId) {
        brief = existing;
        reused = true;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        // Invalid or unrelated existing output is replaced by the fresh brief.
      }
    }
    if (!reused)
      await Promise.all([
        writeFile(jsonPath, JSON.stringify(brief, null, 2) + "\n"),
        writeFile(markdownPath, markdown(brief)),
      ]);
    console.log(
      reused
        ? `Reused ${out}/brief.json and ${out}/brief.md for ${brief.runId} (${brief.evidence.length} evidence)`
        : `Wrote ${out}/brief.json and ${out}/brief.md for ${brief.runId} (${brief.evidence.length} evidence)`,
    );
  } else if (command === "brief" && input) {
    const brief: unknown = JSON.parse(await readFile(input, "utf8"));
    validateBrief(brief);
    console.log(
      args.includes("markdown") || args.includes("--format")
        ? markdown(brief)
        : JSON.stringify(brief, null, 2),
    );
  } else if (command === "record-outcome" && input) {
    const outcome: unknown = JSON.parse(await readFile(input, "utf8"));
    validateOutcome(outcome);
    const ledger = args[0];
    if (!ledger)
      throw new Error("record-outcome requires a local JSONL ledger path");
    await mkdir(resolve(ledger, ".."), { recursive: true });
    await appendFile(resolve(ledger), JSON.stringify(outcome) + "\n", {
      encoding: "utf8",
      flag: "a",
    });
    console.log(`Recorded outcome for ${outcome.runId} in ${ledger}`);
  } else
    throw new Error(
      "usage: orbit run SPEC [OUT_DIR] | orbit brief RUN --format markdown | orbit record-outcome OUTCOME LEDGER.jsonl",
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
