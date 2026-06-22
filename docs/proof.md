# Proof receipt

Verified on 2026-06-22 against public revision `e1d7288` and Worker deployment `a0437312-9ea3-48a5-84ff-d033a6eed70b`.

## Build and package

```text
npm run check        passed
Node test runner     29 tests passed
npm audit            0 vulnerabilities
package smoke        extracted tarball CLI rendered Markdown
GitHub Actions       passed
```

## Public-source run

The checked-in spec produced the same content-addressed run through the CLI and hosted API:

```text
runId       run_47bd3967bfdde796
evidence    9
adapters    github-releases, rss
lanes       agent SDKs, protocol SDKs, developer platform
claims      9
generated gaps  0 (the configured lens emitted none; not a completeness claim)
review notes 2, not executed
```

## Interfaces

- `loops-yaml` executed `examples/loops.yaml` successfully and wrote JSON/Markdown.
- `orbit.coey.dev` transitioned from an explicitly illustrative fixture to a current public run and exposed provenance, collected evidence distribution, evidence details and clearly non-executed suggested follow-ups.
- Anonymous 300 KB MCP input returned `413`; root responses include CSP, frame, MIME, referrer and permissions headers.
- My AX invoked the deployed Orbit spec through its bounded work capability and produced an owner Attention receipt with the same run ID and counts.
- A reviewed outcome was validated and appended to a local JSONL ledger.

No private source, credential, account ID, mutable approval action, or internal AX configuration is present in the public repository or proof payload.
