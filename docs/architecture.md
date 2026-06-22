# Architecture

Orbit is a deliberately narrow pipeline: **spec → adapters → evidence → lenses → brief → interfaces**.

`contracts.ts` is the portable boundary: JSON-safe values, explicit versioning, evidence IDs and approval flags. The kernel validates limits, dispatches collection, orders evidence, computes SHA-256 digests over canonical JSON, and applies lenses. Adapters know transport/format but not meaning. The first-class GitHub releases collector and the generic JSON/RSS collectors each terminate at the same `Evidence` seam; adding one source type requires only its contract, validator, collector, dispatch branch, and tests. Lenses receive minimized evidence and never fetch. CLI, Hono API and Svelte UI only present the same `Brief`.

A run ID derives from the spec and evidence digests, so identical content is addressable even though retrieval timestamps differ. The CLI uses that ID as a deliberately local content-addressed seam: after collection, an equivalent valid `brief.json` in the requested output directory is preserved and reused. There is no pre-collection cache, D1, or R2. Version `1` outcomes identify that run and can be appended to an operator-selected local JSONL ledger.

Deterministic lenses remain the default and the public example remains deterministic. A private host may opt into `applyAssistedLens(evidence, analyzer)` by injecting an `Analyzer`; for example, a Worker wrapper can close over its Workers AI binding, send only the supplied evidence to its chosen model, parse the response, and return structured `claims`, `gaps`, and approval-required `proposals`. Orbit neither imports a provider/router nor reads ambient bindings. It rejects malformed output and every evidence ID not present in the analyzer input. The test suite demonstrates the seam with a deterministic analyzer.

The checked-in UI fixture is explicitly illustrative and only supplies initial rendering; the hydrated page runs the shared public spec through the real API and replaces it with current output.

`http-app.ts` owns portable Hono routes and requires an explicitly injected policy-bound runner before run execution is enabled, so route tests do not import Worker/Svelte bundles. It also owns bounded request parsing and baseline security headers. `worker.ts` only attaches the svelte-hono renderer. The `/mcp` JSON-RPC endpoint is another thin interface over the same example, runner, and Markdown renderer; it deliberately exposes three read-only/discovery tools and no state.

## Hosted boundaries

A Worker can host `src/worker.ts`; D1 may index runs/outcomes, R2 may store immutable raw artifacts, Workers AI may implement an optional lens, and Workflows may orchestrate retries. None is required or provisioned in 0.0.1. Interface code cannot grant adapters ambient bindings.
