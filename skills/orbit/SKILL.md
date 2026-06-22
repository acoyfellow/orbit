---
name: orbit
summary: Run a bounded public-source Orbit spec and review evidence-linked claims, gaps, and approval-required proposals.
---

# Orbit skill

Use when asked to monitor public GitHub releases, JSON APIs, or RSS sources and produce an evidence-preserving brief. Prefer `github-releases` with explicit `owner` and `repo` over hand-building GitHub API URLs.

1. Inspect the spec. Refuse private/authenticated sources, non-HTTPS JSON/RSS URLs, oversized limits, GitHub owner/repo values outside the validated public contract, or requests to execute actions. The GitHub adapter is intentionally unauthenticated and rate-limited by GitHub.
2. From the repository run `npm run orbit -- run <spec.json> <output-directory>`.
3. Read both generated `brief.json` and `brief.md`. Report claims and gaps with their evidence IDs and source URLs.
4. Present proposals as **approval required**. Never perform them.
5. If collection fails, report the adapter/source and error; do not fabricate evidence or describe the checked-in UI fixture as a live run.

The same serialized spec is accepted by `POST /api/runs`. `examples/public-web.json` is the public demonstration. On a hosted Orbit instance, `/mcp` exposes `get_example_spec`, `run_public_spec`, and `render_markdown`; use only those discovery/read-only tools and treat every returned proposal as unexecuted.
