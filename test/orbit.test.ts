import { describe, it, expect, vi, afterEach } from "vitest";
import { canonical, digest } from "../src/kernel/canonical.js";
import { run } from "../src/kernel/run.js";
import { markdown } from "../src/kernel/markdown.js";
afterEach(() => vi.restoreAllMocks());
describe("portable kernel", () => {
  it("canonicalizes object keys", async () => {
    expect(canonical({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(await digest({ b: 2, a: 1 })).toBe(await digest({ a: 1, b: 2 }));
  });
  it("runs bounded JSON into linked output", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([{ title: "Change", body: "A bounded update" }]),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );
    const brief = await run({
      version: 1,
      name: "test",
      sources: [
        {
          id: "j",
          type: "json",
          url: "https://example.com/a.json",
          maxItems: 1,
        },
      ],
      lenses: [
        { type: "filter-summary", include: [], maxClaims: 2 },
        { type: "evidence-actions", maxProposals: 1 },
      ],
      limits: { maxSources: 1, maxBytesPerSource: 1000, timeoutMs: 1000 },
    });
    expect(brief.evidence).toHaveLength(1);
    expect(brief.claims[0]?.evidenceIds).toEqual([brief.evidence[0]?.id]);
    expect(brief.proposals[0]?.approvalRequired).toBe(true);
    expect(markdown(brief)).toContain(brief.evidence[0]!.id);
  });
  it.each([
    "http://example.com",
    "https://127.0.0.1/feed",
    "https://10.0.0.1/feed",
    "https://[::1]/feed",
    "https://user:pass@example.com/feed",
  ])("rejects a non-public source URL: %s", async (url) => {
    await expect(
      run({
        version: 1,
        name: "x",
        sources: [{ id: "x", type: "json", url, maxItems: 1 }],
        lenses: [
          { type: "filter-summary", maxClaims: 1 },
          { type: "evidence-actions", maxProposals: 1 },
        ],
        limits: { maxSources: 1, maxBytesPerSource: 10, timeoutMs: 10 },
      }),
    ).rejects.toThrow("public HTTPS");
  });

  it("does not follow source redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 302,
            headers: { location: "https://example.com/other" },
          }),
      ),
    );
    await expect(
      run({
        version: 1,
        name: "redirect",
        sources: [
          { id: "x", type: "json", url: "https://example.com", maxItems: 1 },
        ],
        lenses: [
          { type: "filter-summary", maxClaims: 1 },
          { type: "evidence-actions", maxProposals: 1 },
        ],
        limits: { maxSources: 1, maxBytesPerSource: 10, timeoutMs: 10 },
      }),
    ).rejects.toThrow("redirects are not followed");
  });
});
