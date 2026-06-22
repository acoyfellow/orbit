import { svelteRenderer, attachSvelteRoutes } from "svelte-hono";
import { bundles } from "./bundles.generated.js";
import App from "./App.svelte";
import fixture from "./fixtures/review.json" with { type: "json" };
import type { Brief } from "./contracts.js";
import { canonical } from "./kernel/canonical.js";
import { run } from "./kernel/run.js";
import { publicExample } from "./example.js";
import { createHttpApp } from "./http-app.js";

// The public hosted demo accepts only its checked-in bounded spec. The CLI,
// skill, and library remain generic; private deployments can construct
// createHttpApp() with their own authenticated policy boundary.
const exampleDigest = canonical(publicExample);
const app = createHttpApp(async (value) => {
  if (canonical(value) !== exampleDigest) {
    throw new Error("The public demo runs only the checked-in example spec.");
  }
  return run(value);
});
attachSvelteRoutes(app, { bundles });
app.get(
  "/",
  svelteRenderer(App, {
    hydrateAs: "app",
    title: "Orbit / Review",
    props: { initialBrief: fixture as Brief },
  }),
);
export default app;
