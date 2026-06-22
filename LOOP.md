# Orbit completion loop

This file is the durable controller for bringing Orbit from a clean public scaffold to a proven `0.0.1` reference implementation.

## End state

Orbit is complete when:

- `github.com/acoyfellow/orbit` is public, clean, and understandable in seven minutes;
- the README quickstart runs from a fresh clone;
- one serialized spec runs unchanged through CLI, skill, `loops.yaml`, and HTTP;
- at least two genuinely different public adapters emit one evidence contract;
- deterministic and AI-assisted lenses produce claims, gaps, and approval-required proposals with evidence IDs;
- unchanged inputs reuse content-addressed artifacts;
- JSON, Markdown, and a polished svelte-hono review page show the same brief;
- tests, typecheck, build, package dry-run, CI, security and deployment docs pass;
- a secure Cloudflare deployment is proven without exposing AX-private configuration;
- Orbit is dogfooded from both `loops.yaml` and My AX, and outcomes can flow back;
- the final diff contains no placeholder demos presented as real evidence, dead code, stale narration, secrets, account IDs, or private source names.

## Iteration

```text
RESEARCH → QUALIFY → BUILD → CLEANUP → VERIFY → REVIEW → COMMIT → PUSH → DOGFOOD → PROVE → REFLECT
```

Exactly one writer edits the checkout at a time. Parallel Terrarium runs are read-only research/review. The parent owns commits, GitHub, deployment and proof.

Every iteration freezes one finding with evidence, smallest intervention, acceptance criteria, repository cost, and dogfood/proof plan. Prefer completing a thin vertical slice over widening the platform.

## Seven-minute rule

A new contributor should quickly understand purpose, contracts, request flow, state ownership, limits, and verification. Reject abstractions that expand the map without replacing equivalent complexity. Keep source collection out of lenses, interpretation out of adapters, and interfaces out of the kernel.

## Self-modification

Orbit may improve this loop as it learns. A child can propose a process change in its receipt. The parent may accept it in a separate commit when the change is general, names the failure it prevents, and produces verifiable evidence. A writer must not silently change the rules governing its own current iteration. Remove stale gates when architecture or tooling makes them obsolete.

## Required receipt

```text
start revision
result: changed | no-change | blocked
frozen finding and compared candidates
files changed
cleanup and repository-comprehension outcome
verification commands with exit status
security/privacy review
marketing/demo classification
dogfood and proof plan
remaining risks
proposed LOOP.md change or none
```

## V0 non-goals

No visual workflow builder, marketplace, autonomous writes, general agent runtime, vector database, user/team/billing system, social scraping, arbitrary hosted code adapters, recursive research fleet, or universal knowledge graph. Ship two adapters, two lenses, one bounded run contract, and strong receipts first.
