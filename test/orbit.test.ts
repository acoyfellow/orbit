import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { canonical, digest } from "../src/kernel/canonical.js";
import { run } from "../src/kernel/run.js";
import { markdown } from "../src/kernel/markdown.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("canonicalizes object keys", async () => {
  assert.equal(canonical({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(await digest({ b: 2, a: 1 }), await digest({ a: 1, b: 2 }));
});

test("runs bounded JSON into linked output", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([{ title: "Change", body: "A bounded update" }]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  const brief = await run({
    version: 1,
    name: "test",
    sources: [
      { id: "j", type: "json", url: "https://example.com/a.json", maxItems: 1 },
    ],
    lenses: [
      { type: "filter-summary", include: [], maxClaims: 2 },
      { type: "evidence-actions", maxProposals: 1 },
    ],
    limits: { maxSources: 1, maxBytesPerSource: 1000, timeoutMs: 1000 },
  });
  assert.equal(brief.evidence.length, 1);
  assert.deepEqual(brief.claims[0]?.evidenceIds, [brief.evidence[0]?.id]);
  assert.equal(brief.proposals[0]?.approvalRequired, true);
  assert.match(markdown(brief), new RegExp(brief.evidence[0]!.id));
});

for (const url of [
  "http://example.com",
  "https://127.0.0.1/feed",
  "https://10.0.0.1/feed",
  "https://[::1]/feed",
  "https://user:pass@example.com/feed",
]) {
  test(`rejects a non-public source URL: ${url}`, async () => {
    await assert.rejects(
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
      /public HTTPS/,
    );
  });
}

test("does not follow source redirects", async () => {
  globalThis.fetch = async () =>
    new Response(null, {
      status: 302,
      headers: { location: "https://example.com/other" },
    });
  await assert.rejects(
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
    /redirects are not followed/,
  );
});
