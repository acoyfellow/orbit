# Adapters

0.0.1 supports three public HTTPS source types:

- `github-releases` accepts `owner`, `repo`, and `maxItems`. Orbit constructs the GitHub REST releases URL, sends GitHub's vendor `Accept` header, `X-GitHub-Api-Version: 2022-11-28`, and an Orbit `User-Agent`. It has no token field and therefore uses GitHub's bounded unauthenticated public API allowance.
- `json` accepts `url`, `maxItems`, and optional dotted `titlePath`/`summaryPath` mappings for generic APIs.
- `rss` accepts `url` and `maxItems`, extracting item title, description, and link.

Each run caps sources, response bytes (at most 1 MB), and timeout (at most 30 seconds). All adapters emit the same minimized `Evidence` fields: stable content-derived ID/digest, source and item URL, retrieval time, visibility, title, and summary. Authorization configuration is absent in this public slice.

The adapter seam is deliberately small: implement one collector in `src/adapters`, add its closed source contract and validation branch, then add one dispatch branch in `src/kernel/run.ts`. Collection belongs in adapters; interpretation belongs in lenses. Enforce stream limits before parsing and add fixture-backed tests. RSS parsing is intentionally bounded/basic and is not a general feed implementation.
