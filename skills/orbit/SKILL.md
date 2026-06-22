---
name: orbit
summary: Collect bounded public sources into an evidence-linked brief and return a manual, non-mutating review outcome.
---

# Orbit skill

Use for public GitHub release, JSON API, or RSS monitoring. Keep the flow visible: **adapter → evidence → lens → brief → outcome**. Never execute a proposed follow-up.

## Choose one interface

- **Repository:** from a clone, run `npm ci`, then `npm run orbit -- run <spec.json> <output-directory>`.
- **Package:** run `npx --yes @acoyfellow/orbit@0.0.1 run <spec.json> <output-directory>`. If the package is unavailable from the configured registry, say so and use a clone; do not imply publication.
- **Hosted:** the public deployment accepts only the exact checked-in example through `POST /api/runs`. Its minimal non-mutating `/mcp` subset exposes exactly `get_example_spec`, `run_public_spec`, and `render_markdown`; it is not broad MCP conformance and cannot run arbitrary specs or record outcomes.

## Procedure

1. Inspect the version 1 spec. Refuse authenticated/private sources, non-HTTPS JSON/RSS URLs, invalid GitHub owner/repo values, ambient credentials, persistence requests, or execution requests.
2. Enforce contract maxima: 20 sources, 1,000,000 bytes/source, 100 items/source, 30,000 ms timeout, five declared lanes/source, 100 claims, and 100 review notes. A host may be stricter.
3. Run through one interface. Repository/package output is `brief.json` and `brief.md`; hosted output is returned directly.
4. Report each source receipt first. Call `partial`/`degraded` status and `truncated: true` out explicitly. Do not infer complete upstream coverage from a successful fetch.
5. Report claims and generated gaps with evidence IDs. `sourceUrl` is the collection endpoint; `itemUrl`, when present, is the human-facing item. Zero generated gaps means only that the configured lens emitted none.
6. Present proposals as unexecuted review notes, never approvals. Ask the person to choose `worth-follow-up`, `not-relevant`, or `no-action`, then create valid version 1 Outcome JSON tied to the brief `runId`. Copy/download it or explicitly invoke `record-outcome`; hosted Orbit does not persist it.
7. On failure, identify the source and error. Never substitute the checked-in UI fixture or fabricated evidence.

Exact public limitations: unauthenticated GitHub API rate limits apply; redirects and private/non-HTTPS addresses are rejected; collection is bounded and may truncate; deterministic lenses summarize only collected evidence; the hosted public runner is example-only and has no credentials, arbitrary source execution, action tools, or server persistence.
