# Orbit

**Watch sources. Keep evidence. Get a brief.**

Orbit runs the same bounded monitoring spec from a terminal, an agent skill, `loops.yaml`, or a Cloudflare Worker. The public demo runs at [orbit.coey.dev](https://orbit.coey.dev). Adapters collect changing sources into one evidence contract. Lenses turn that evidence into sourced claims, visible gaps, and proposed actions. Nothing acts without approval.

```text
adapters → evidence → lenses → brief → outcome
```

```bash
npm install
npm run orbit -- run examples/public-web.json
```

That example monitors releases from real agent/tooling repositories and a public engineering RSS feed, preserves source URL, retrieval time and content digest, then writes the same portable brief shape used by the API and skill. Generic JSON remains available for other public APIs.

## What ships in 0.0.1

- one serializable run specification;
- first-class GitHub releases plus generic public JSON and RSS adapters;
- deterministic summary/filter and evidence-to-action lenses;
- content-addressed evidence with explicit provenance and bounded operator-declared lanes;
- JSON and Markdown briefs;
- a small CLI, HTTP API, Svelte review surface, read-only MCP endpoint, agent skill and `loops.yaml` example;
- Cloudflare-ready D1/R2/Workers AI/Workflow boundaries without requiring them for the local example;
- approval-required action proposals—never ambient mutation.

## Repository map

```text
src/contracts.ts       portable public records
src/kernel/            collect, validate, digest, run
src/adapters/          source-specific collection only
src/lenses/            interpretation only
src/cli.ts             local interface
src/worker.ts          Hono API + svelte-hono page
src/App.svelte         review surface
skills/orbit/SKILL.md  agent interface
examples/              runnable specs and loops.yaml
docs/                  architecture, adapters, security, deploy
```

## Interfaces

```bash
orbit run spec.json
orbit brief run.json --format markdown
orbit record-outcome outcome.json orbit-output/outcomes.jsonl
```

Agents use the checked-in skill. Scheduled shells use the checked-in [`loops.yaml` example](examples/loops.yaml) with [loops-yaml](https://github.com/acoyfellow/loops-yaml). Hosted clients use the same run and brief contracts over HTTP. Re-running unchanged content in the same CLI output directory preserves the existing content-addressed brief (including its original timestamps) and reports `Reused`; changed content replaces it. `record-outcome` validates a version `1` outcome tied to a `run_<digest>` ID and appends it to the explicitly requested local JSONL ledger—there is no implicit or hosted persistence.

```bash
loops run orbit-public-web   # one dogfood run
loops watch                  # honor the checked-in cron schedule
```

My AX can connect to `https://orbit.coey.dev/mcp` as a read-only MCP server, call `get_example_spec` then `run_public_spec`, and retain the returned brief or Markdown without importing Orbit code. The portable `createHttpApp()` disables execution by default: a deployment must explicitly inject a runner that enforces its authentication and spec policy. The public Worker injects a runner that accepts only the exact checked-in example. The review page starts with a clearly labelled illustrative fixture; **Run public example** fetches the checked-in spec from `GET /api/example`, submits it to `POST /api/runs`, and replaces the fixture with current public evidence. Its compact run summary distinguishes unavailable fixture pipeline metadata from live adapter/source/lens data, and reports timing and output counts. A compact coverage matrix groups counts and empty gaps by explicitly labelled, operator-declared **lane × adapter** dimensions; selecting a cell filters the ledger and drills into evidence. Coverage is intentionally separate from quality/support and is not a score. Changes, missing coverage, and suggested follow-ups all link to a selected evidence detail with summary, source, retrieval time, visibility, digest, and a separate public-source link. See the [research note](docs/research/quality-diversity-coverage.md) for paper claims and the narrower Orbit inference.

A narrow Streamable HTTP-style MCP endpoint is available at `POST /mcp`. It supports `initialize`, `tools/list`, and `tools/call` for `get_example_spec`, `run_public_spec`, and `render_markdown`. These tools only discover, collect bounded public sources, or format a supplied brief—there are no credentials, persistence, approvals, or action tools. The webpage presents follow-ups as copyable review notes marked **Not executed**; there is no approval queue.

## Security

The shipped public adapters have no credential input. The GitHub releases adapter derives the versioned `api.github.com/repos/{owner}/{repo}/releases` endpoint from validated owner/repository names, identifies Orbit with a `User-Agent`, and stays within GitHub's unauthenticated public rate limit. Orbit caps request bodies while streaming (including bodies without `Content-Length`), caps source response streams before decoding, strictly validates specs and Markdown briefs, never writes response headers to evidence, and proposes actions rather than executing them. Baseline browser security headers are applied by the Hono app. Authentication, DNS-resolution/egress controls, retention, and credential isolation remain deployment responsibilities; public examples use public sources and deterministic lenses.

See [Security](docs/security.md), [Architecture](docs/architecture.md), and the [deployed proof receipt](docs/proof.md).

## Status

Orbit is `0.0.1` while its contracts are being proven. The goal is a small, reusable reference—not an adapter marketplace or autonomous agent platform.

## License

MIT
