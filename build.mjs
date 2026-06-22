import { build } from "esbuild";
import { buildHonoSvelte } from "svelte-hono/build";
import { rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await build({
  entryPoints: ["src/cli.ts", "src/index.ts"],
  outdir: "dist",
  platform: "node",
  format: "esm",
  bundle: false,
  packages: "external",
  sourcemap: true,
});
await buildHonoSvelte({
  workerEntry: "./src/worker.ts",
  outDir: "./dist",
  components: { app: "./App.svelte" },
});
