#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { run } from "./kernel/run.js";
import { markdown } from "./kernel/markdown.js";
const [command, input, ...args] = process.argv.slice(2);
try {
  if (command === "run" && input) {
    const spec = JSON.parse(await readFile(input, "utf8"));
    const brief = await run(spec);
    const out = args[0] ?? "orbit-output";
    await mkdir(out, { recursive: true });
    await Promise.all([
      writeFile(
        resolve(out, "brief.json"),
        JSON.stringify(brief, null, 2) + "\n",
      ),
      writeFile(resolve(out, "brief.md"), markdown(brief)),
    ]);
    console.log(
      `Wrote ${out}/brief.json and ${out}/brief.md (${brief.evidence.length} evidence)`,
    );
  } else if (command === "brief" && input) {
    const b = JSON.parse(await readFile(input, "utf8"));
    console.log(
      args.includes("markdown") || args.includes("--format")
        ? markdown(b)
        : JSON.stringify(b, null, 2),
    );
  } else if (command === "record-outcome" && input) {
    JSON.parse(await readFile(input, "utf8"));
    console.log(
      `Validated outcome ${basename(input)}; local persistence is intentionally not implemented.`,
    );
  } else
    throw new Error(
      "usage: orbit run SPEC [OUT_DIR] | orbit brief RUN --format markdown | orbit record-outcome OUTCOME",
    );
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
