import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const temp = mkdtempSync(join(tmpdir(), "orbit-pack-"));
const tarball = execFileSync(
  "npm",
  ["pack", "--silent", "--pack-destination", temp],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .at(-1);
execFileSync("tar", ["-xzf", join(temp, tarball), "-C", temp]);
const pkg = join(temp, "package");
const brief = join(temp, "brief.json");
writeFileSync(
  brief,
  JSON.stringify({
    version: 1,
    runId: "r",
    specName: "Packed",
    startedAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T00:00:01Z",
    sourceReceipts: [],
    evidence: [],
    claims: [],
    gaps: [],
    proposals: [],
  }),
);
const output = execFileSync(
  process.execPath,
  [join(pkg, "dist/cli.js"), "brief", brief, "--format", "markdown"],
  { cwd: temp, encoding: "utf8" },
);
assert.match(output, /^# Packed/m);
