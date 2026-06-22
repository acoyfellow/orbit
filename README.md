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

That example reads public JSON, preserves source URL, retrieval time and content digest, then writes the same portable brief shape used by the API and skill.

## What ships in 0.0.1

- one serializable run specification;
- public JSON and RSS adapters;
- deterministic summary/filter and evidence-to-action lenses;
- content-addressed evidence with explicit provenance;
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
orbit record-outcome outcome.json
```

Agents use the checked-in skill. Scheduled shells use the checked-in `loops.yaml` example. Hosted clients use the same run and brief contracts over HTTP. The portable `createHttpApp()` disables execution by default: a deployment must explicitly inject a runner that enforces its authentication and spec policy. The public Worker injects a runner that accepts only the exact checked-in example. The review page starts with a clearly labelled illustrative fixture; **Run public example** fetches the checked-in spec from `GET /api/example`, submits it to `POST /api/runs`, and replaces the fixture with current public evidence. Its compact run summary distinguishes unavailable fixture pipeline metadata from live adapter/source/lens data, and reports timing and output counts. Claims, visible gaps, and proposed actions all link to a selected evidence detail with summary, source, retrieval time, visibility, digest, and a separate public-source link.

A narrow Streamable HTTP-style MCP endpoint is available at `POST /mcp`. It supports `initialize`, `tools/list`, and `tools/call` for `get_example_spec`, `run_public_spec`, and `render_markdown`. These tools only discover, collect bounded public sources, or format a supplied brief—there are no credentials, persistence, approvals, or action tools.

## Security

The shipped public adapters have no credential input. Orbit caps request bodies while streaming (including bodies without `Content-Length`), caps source response streams before decoding, strictly validates specs and Markdown briefs, never writes response headers to evidence, and proposes actions rather than executing them. Baseline browser security headers are applied by the Hono app. Authentication, DNS-resolution/egress controls, retention, and credential isolation remain deployment responsibilities; public examples use public sources and deterministic lenses.

See [Security](docs/security.md) and [Architecture](docs/architecture.md).

## Status

Orbit is `0.0.1` while its contracts are being proven. The goal is a small, reusable reference—not an adapter marketplace or autonomous agent platform.

## License

MIT
