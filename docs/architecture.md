# Architecture

Orbit is a deliberately narrow pipeline: **spec → adapters → evidence → lenses → brief → interfaces**.

`contracts.ts` is the portable boundary: JSON-safe values, explicit versioning, evidence IDs and approval flags. The kernel validates limits, dispatches collection, orders evidence, computes SHA-256 digests over canonical JSON, and applies lenses. Adapters know transport/format but not meaning. Lenses receive minimized evidence and never fetch. CLI, Hono API and Svelte UI only present the same `Brief`.

A run ID derives from the spec and evidence digests, so identical content is addressable even though retrieval timestamps differ. This iteration does not add a cache: a future D1/R2 implementation can use those IDs without changing contracts. The checked-in UI fixture is explicitly illustrative and only supplies initial rendering; the hydrated page runs the shared public spec through the real API and replaces it with current output.

`http-app.ts` owns portable Hono routes and requires an explicitly injected policy-bound runner before run execution is enabled, so route tests do not import Worker/Svelte bundles. It also owns bounded request parsing and baseline security headers. `worker.ts` only attaches the svelte-hono renderer. The `/mcp` JSON-RPC endpoint is another thin interface over the same example, runner, and Markdown renderer; it deliberately exposes three read-only/discovery tools and no state.

## Hosted boundaries

A Worker can host `src/worker.ts`; D1 may index runs/outcomes, R2 may store immutable raw artifacts, Workers AI may implement an optional lens, and Workflows may orchestrate retries. None is required or provisioned in 0.0.1. Interface code cannot grant adapters ambient bindings.
