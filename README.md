# Orbit

**Watch sources. Keep evidence. Get a brief.**

Orbit runs the same bounded monitoring spec from a terminal, an agent skill, `loops.yaml`, or a Cloudflare Worker. Adapters collect changing sources into one evidence contract. Lenses turn that evidence into sourced claims, visible gaps, and proposed actions. Nothing acts without approval.

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
- a small CLI, HTTP API, Svelte review surface, agent skill and `loops.yaml` example;
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

Agents use the checked-in skill. Scheduled shells use the checked-in `loops.yaml` example. Hosted clients use the same run and brief contracts over HTTP.

## Security

Adapters receive only their declared configuration and credentials. Orbit minimizes source payloads before analysis, never writes authorization headers to evidence, marks public/private visibility on every record, and proposes actions rather than executing them. Hosted deployments should require Cloudflare Access; public examples use public sources and deterministic lenses.

See [Security](docs/security.md) and [Architecture](docs/architecture.md).

## Status

Orbit is `0.0.1` while its contracts are being proven. The goal is a small, reusable reference—not an adapter marketplace or autonomous agent platform.

## License

MIT
