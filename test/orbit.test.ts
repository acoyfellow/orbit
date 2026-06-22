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

test("collects GitHub releases with the versioned unauthenticated API", async () => {
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(
      JSON.stringify([
        {
          name: "v1.2.3",
          tag_name: "v1.2.3",
          body: "Adds useful agent tooling.",
          html_url: "https://github.com/example/tool/releases/tag/v1.2.3",
        },
      ]),
    );
  };
  const brief = await run({
    version: 1,
    name: "releases",
    sources: [
      {
        id: "tool",
        type: "github-releases",
        owner: "example",
        repo: "tool",
        maxItems: 1,
        lanes: ["test"],
      },
    ],
    lenses: [
      { type: "filter-summary", maxClaims: 1 },
      { type: "evidence-actions", maxProposals: 0 },
    ],
    limits: { maxSources: 1, maxBytesPerSource: 1000, timeoutMs: 1000 },
  });
  assert.equal(
    request?.url,
    "https://api.github.com/repos/example/tool/releases?per_page=1",
  );
  assert.equal(request?.headers.get("accept"), "application/vnd.github+json");
  assert.equal(request?.headers.get("x-github-api-version"), "2022-11-28");
  assert.match(request?.headers.get("user-agent") ?? "", /orbit/);
  assert.equal(request?.headers.get("authorization"), null);
  assert.equal(brief.evidence[0]?.title, "v1.2.3");
  assert.equal(brief.evidence[0]?.sourceId, "tool");
  assert.equal(brief.evidence[0]?.adapter, "github-releases");
  assert.deepEqual(brief.evidence[0]?.lanes, ["test"]);
  assert.match(brief.evidence[0]?.summary ?? "", /agent tooling/);
});

test("rejects missing, duplicate, or excessive source lanes", async () => {
  const spec = {
    version: 1,
    name: "lanes",
    lenses: [
      { type: "filter-summary", maxClaims: 1 },
      { type: "evidence-actions", maxProposals: 0 },
    ],
    limits: { maxSources: 1, maxBytesPerSource: 1000, timeoutMs: 1000 },
  };
  for (const lanes of [
    undefined,
    [],
    ["same", "same"],
    ["1", "2", "3", "4", "5", "6"],
  ]) {
    await assert.rejects(
      run({
        ...spec,
        sources: [
          {
            id: "x",
            type: "json",
            url: "https://example.com",
            maxItems: 1,
            ...(lanes === undefined ? {} : { lanes }),
          },
        ],
      }),
      /source lanes|unknown property/,
    );
  }
});

test("rejects invalid GitHub repository names and unknown adapter fields", async () => {
  const base = {
    version: 1,
    name: "x",
    lenses: [
      { type: "filter-summary", maxClaims: 1 },
      { type: "evidence-actions", maxProposals: 0 },
    ],
    limits: { maxSources: 1, maxBytesPerSource: 1000, timeoutMs: 1000 },
  };
  await assert.rejects(
    run({
      ...base,
      sources: [
        {
          id: "x",
          type: "github-releases",
          owner: "bad/owner",
          repo: "tool",
          maxItems: 1,
          lanes: ["test"],
        },
      ],
    }),
    /invalid GitHub repository/,
  );
  await assert.rejects(
    run({
      ...base,
      sources: [
        {
          id: "x",
          type: "github-releases",
          owner: "example",
          repo: "tool",
          url: "https://example.com",
          maxItems: 1,
          lanes: ["test"],
        },
      ],
    }),
    /unknown property/,
  );
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
      {
        id: "j",
        type: "json",
        url: "https://example.com/a.json",
        maxItems: 1,
        lanes: ["test"],
      },
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
        sources: [{ id: "x", type: "json", url, maxItems: 1, lanes: ["test"] }],
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

test("rejects incomplete and unknown spec fields", async () => {
  await assert.rejects(
    run({ version: 1, name: "x", sources: [], lenses: [], limits: {} }),
    /invalid maxSources/,
  );
  await assert.rejects(
    run({
      version: 1,
      name: "x",
      unknown: true,
      sources: [],
      lenses: [
        { type: "filter-summary", maxClaims: 1 },
        { type: "evidence-actions", maxProposals: 1 },
      ],
      limits: { maxSources: 1, maxBytesPerSource: 10, timeoutMs: 10 },
    }),
    /unknown property/,
  );
});

test("stops reading a chunked source once its byte cap is exceeded", async () => {
  let pulls = 0;
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        pull(controller) {
          pulls += 1;
          controller.enqueue(new Uint8Array(8));
          if (pulls === 10) controller.close();
        },
      }),
    );
  await assert.rejects(
    run({
      version: 1,
      name: "stream",
      sources: [
        {
          id: "x",
          type: "json",
          url: "https://example.com",
          maxItems: 1,
          lanes: ["test"],
        },
      ],
      lenses: [
        { type: "filter-summary", maxClaims: 1 },
        { type: "evidence-actions", maxProposals: 1 },
      ],
      limits: { maxSources: 1, maxBytesPerSource: 10, timeoutMs: 1000 },
    }),
    /response too large/,
  );
  assert.ok(pulls < 10);
});

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
        {
          id: "x",
          type: "json",
          url: "https://example.com",
          maxItems: 1,
          lanes: ["test"],
        },
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
