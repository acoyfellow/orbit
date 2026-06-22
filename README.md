# Orbit

**Know what changed—and what deserves a closer look.**

Orbit collects bounded public sources, preserves evidence and source health, generates a review brief, and lets a person record a portable decision. The checked-in example watches releases from **OpenAI Agents JS** and the **Model Context Protocol TypeScript SDK**, plus the **Cloudflare engineering RSS feed**.

```text
adapter → evidence → lens → brief → outcome
```

[Live demo](https://orbit.coey.dev) · [Specification](src/contracts.ts) · [Docs](docs/) · [Security](docs/security.md)

Orbit never executes a follow-up. The hosted demo does not persist runs or outcomes.

## Run from a clone

Requires Node 20+.

```bash
git clone https://github.com/acoyfellow/orbit.git
cd orbit
npm ci
npm run orbit -- run examples/public-web.json orbit-output
```

Expected final line:

```text
Wrote orbit-output/brief.json and orbit-output/brief.md for run_<16 hex characters> (<count> evidence)
```

The command performs real network requests, so counts and the run ID vary. Inspect `orbit-output/brief.json`: each source has a `sourceReceipt` showing complete/partial/degraded collection and explicit truncation, while each evidence item distinguishes the collection `sourceUrl` endpoint from its optional human-facing `itemUrl`.

Local review UI:

```bash
npm run dev
```

Open the URL printed by Wrangler, choose **Collect latest changes**, inspect source receipts and evidence, then copy or download an Outcome JSON. Decisions remain in the browser unless you explicitly save them.

## Run the package CLI

This path does not require cloning Orbit:

```bash
mkdir orbit-quickstart && cd orbit-quickstart
curl -fsSLO https://raw.githubusercontent.com/acoyfellow/orbit/main/examples/public-web.json
npx --yes @acoyfellow/orbit@0.0.1 run public-web.json orbit-output
```

Expect the same `Wrote ... brief.json ... brief.md` line and files. If `0.0.1` is not available from your configured registry, use the clone path; repository support does not imply registry availability.

## What the brief means

- **Source receipts** report each endpoint, item count, configured cap, status, and truncation. A capped source is `partial`; Orbit does not claim complete upstream knowledge.
- **Claims** cite evidence IDs.
- **Generated gaps** are lens output, not proof of absence. Zero generated gaps never means “nothing is missing.”
- **Collected evidence distribution** groups collected items by operator-declared lane and adapter. It is not quality, relevance, or comprehensive coverage.
- **Review notes** are suggestions only. Manual decisions are `worth-follow-up`, `not-relevant`, or `no-action` Outcome JSON tied to the brief `runId`.

## Interfaces

```bash
orbit run spec.json [output-directory]
orbit brief brief.json --format markdown
orbit record-outcome outcome.json local-outcomes.jsonl
```

The repository skill, package CLI, `examples/loops.yaml`, HTTP API, and hosted demo use the same versioned contracts. The CLI only appends an outcome when you explicitly invoke `record-outcome` with a local ledger path.

The hosted `POST /mcp` interface is a **minimal non-mutating subset**, not general MCP conformance: JSON-RPC `initialize`, `tools/list`, and `tools/call`, with exactly `get_example_spec`, `run_public_spec`, and `render_markdown`. It has no credentials, private sources, arbitrary specs, actions, outcome recording, or persistence.

## Limits and security

Version 1 accepts public HTTPS JSON/RSS and validated unauthenticated GitHub release sources. Specs allow at most 20 sources, 1,000,000 bytes per source, 100 items per source, and a 30-second source timeout; a deployment may impose tighter limits. Redirects and private/non-HTTPS addresses are rejected. The public Worker runs only the exact checked-in example. DNS rebinding controls, authentication, retention, credentials, and private-source access remain deployment responsibilities.

See [Architecture](docs/architecture.md), [Adapters](docs/adapters.md), [Deployment](docs/deployment.md), and the dated [proof receipt](docs/proof.md).

## Development

```bash
npm ci
npm run check
```

`npm run check` runs formatting, tests, build, typecheck, package dry-run, and an extracted-package CLI smoke test. Orbit is a narrow `svelte-hono` reference implementation, not an agent runtime, workflow builder, database, or autonomous action system.

## License

MIT
