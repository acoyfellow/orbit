import assert from "node:assert/strict";
import test from "node:test";
import type { Brief } from "../src/contracts.js";
import { createHttpApp } from "../src/http-app.js";

const brief: Brief = {
  version: 1,
  runId: "run_test",
  specName: "Test",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:00:01.000Z",
  sourceReceipts: [],
  evidence: [],
  claims: [],
  gaps: [],
  proposals: [],
};
const app = createHttpApp({ runner: async () => brief, maxRequestBytes: 1024 });
const rpc = (method: string, params?: unknown) =>
  app.request("/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

test("serves the checked-in public spec rather than a brief fixture", async () => {
  const response = await app.request("/api/example");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.version, 1);
  assert.ok(body.sources.length >= 2);
  assert.equal(body.evidence, undefined);
});

test("run route delegates and returns a brief", async () => {
  const response = await app.request("/api/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ any: "spec" }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), brief);
});

test("MCP initializes and discovers only narrow read-only tools", async () => {
  const initialized = await (await rpc("initialize")).json();
  assert.equal(initialized.result.serverInfo.name, "orbit");
  const listed = await (await rpc("tools/list")).json();
  assert.deepEqual(
    listed.result.tools.map((tool: { name: string }) => tool.name),
    ["get_example_spec", "run_public_spec", "render_markdown"],
  );
});

test("MCP gets the spec, runs, and renders markdown", async () => {
  const example = await (
    await rpc("tools/call", { name: "get_example_spec", arguments: {} })
  ).json();
  assert.equal(example.result.structuredContent.version, 1);
  const run = await (
    await rpc("tools/call", {
      name: "run_public_spec",
      arguments: { spec: {} },
    })
  ).json();
  assert.equal(run.result.structuredContent.runId, "run_test");
  const rendered = await (
    await rpc("tools/call", { name: "render_markdown", arguments: { brief } })
  ).json();
  assert.match(rendered.result.content[0].text, /^# Test/m);
});

test("generic app disables runs unless a policy-bound runner is injected", async () => {
  const response = await createHttpApp().request("/api/runs", {
    method: "POST",
    body: "{}",
  });
  assert.equal(response.status, 403);
});

test("caps streamed request bodies without relying on content-length", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(`{"value":"${"x".repeat(2000)}"}`),
      );
      controller.close();
    },
  });
  const request = new Request("http://localhost/api/runs", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
  const response = await app.fetch(request);
  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /too large/);
});

test("adds baseline browser security headers", async () => {
  const response = await app.request("/api/example");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  const csp = response.headers.get("content-security-policy") ?? "";
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.match(csp, /frame-ancestors 'none'/);
});

test("render_markdown rejects incomplete briefs", async () => {
  const response = await rpc("tools/call", {
    name: "render_markdown",
    arguments: { brief: { version: 1, specName: "unsafe" } },
  });
  const body = await response.json();
  assert.equal(body.result.isError, true);
});

test("MCP rejects unknown methods and tools", async () => {
  assert.equal((await (await rpc("actions/list")).json()).error.code, -32601);
  assert.equal(
    (
      await (
        await rpc("tools/call", { name: "write_something", arguments: {} })
      ).json()
    ).error.code,
    -32602,
  );
});
