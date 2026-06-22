import type { RunSpec } from "./contracts.js";

/** The checked-in public dogfood spec, shared by the page, API, and MCP. */
export const publicExample: RunSpec = {
  version: 1,
  name: "Public web change brief",
  sources: [
    {
      id: "json-placeholder",
      type: "json",
      url: "https://jsonplaceholder.typicode.com/posts",
      maxItems: 3,
      titlePath: "title",
      summaryPath: "body",
    },
    {
      id: "cloudflare-blog",
      type: "rss",
      url: "https://blog.cloudflare.com/rss/",
      maxItems: 3,
    },
  ],
  lenses: [
    { type: "filter-summary", include: [], maxClaims: 6 },
    { type: "evidence-actions", maxProposals: 2 },
  ],
  limits: { maxSources: 2, maxBytesPerSource: 1_000_000, timeoutMs: 10_000 },
};
