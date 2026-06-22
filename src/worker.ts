import { svelteRenderer, attachSvelteRoutes } from "svelte-hono";
import { bundles } from "./bundles.generated.js";
import App from "./App.svelte";
import fixture from "./fixtures/review.json" with { type: "json" };
import type { Brief } from "./contracts.js";
import { createHttpApp } from "./http-app.js";

const app = createHttpApp();
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
