---
name: orbit
summary: Run a bounded public-source Orbit spec and review evidence-linked claims, gaps, and approval-required proposals.
---

# Orbit skill

Use when asked to monitor public JSON/RSS sources or produce an evidence-preserving brief.

1. Inspect the spec. Refuse private/authenticated sources, non-HTTPS URLs, oversized limits, or requests to execute actions.
2. From the repository run `npm run orbit -- run <spec.json> <output-directory>`.
3. Read both generated `brief.json` and `brief.md`. Report claims and gaps with their evidence IDs and source URLs.
4. Present proposals as **approval required**. Never perform them.
5. If collection fails, report the adapter/source and error; do not fabricate evidence or describe the checked-in UI fixture as a live run.

The same serialized spec is accepted by `POST /api/runs`. `examples/public-web.json` is the public demonstration.
