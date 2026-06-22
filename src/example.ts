import type { RunSpec } from "./contracts.js";

/** The checked-in public dogfood spec, shared by the page, API, and MCP. */
export const publicExample: RunSpec = {
  version: 1,
  name: "Agent and tooling release watch",
  sources: [
    {
      id: "openai-agents-js",
      type: "github-releases",
      owner: "openai",
      repo: "openai-agents-js",
      maxItems: 3,
      lanes: ["agent SDKs"],
    },
    {
      id: "model-context-protocol-typescript-sdk",
      type: "github-releases",
      owner: "modelcontextprotocol",
      repo: "typescript-sdk",
      maxItems: 3,
      lanes: ["protocol SDKs"],
    },
    {
      id: "cloudflare-developer-platform",
      type: "rss",
      url: "https://blog.cloudflare.com/rss/",
      maxItems: 3,
      lanes: ["developer platform"],
    },
  ],
  lenses: [
    { type: "filter-summary", include: [], maxClaims: 9 },
    { type: "evidence-actions", maxProposals: 2 },
  ],
  limits: { maxSources: 3, maxBytesPerSource: 1_000_000, timeoutMs: 10_000 },
};
