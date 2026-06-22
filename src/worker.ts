import { Hono } from "hono";
import { svelteRenderer, attachSvelteRoutes } from "svelte-hono";
import { bundles } from "./bundles.generated.js";
import App from "./App.svelte";
import fixture from "./fixtures/review.json" with { type: "json" };
import { run } from "./kernel/run.js";
const app = new Hono();
attachSvelteRoutes(app, { bundles });
app.get(
  "/",
  svelteRenderer(App, {
    hydrateAs: "app",
    title: "Orbit / Review",
    props: { brief: fixture },
  }),
);
app.get("/api/example", (c) => c.json(fixture));
app.post("/api/runs", async (c) => {
  try {
    return c.json(await run(await c.req.json()), 201);
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "invalid request" },
      400,
    );
  }
});
export default app;
