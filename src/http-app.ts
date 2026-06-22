import { Hono } from "hono";
import type { Brief } from "./contracts.js";
import { publicExample } from "./example.js";
import { markdown } from "./kernel/markdown.js";
import { run } from "./kernel/run.js";

export type Runner = (value: unknown) => Promise<Brief>;

type RpcRequest = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: { name?: unknown; arguments?: Record<string, unknown> };
};

const tools = [
  {
    name: "get_example_spec",
    description: "Get Orbit's checked-in bounded public example specification.",
    inputSchema: { type: "object", additionalProperties: false },
  },
  {
    name: "run_public_spec",
    description:
      "Run a bounded public Orbit spec. No credentials or actions are supported.",
    inputSchema: {
      type: "object",
      properties: { spec: { type: "object" } },
      required: ["spec"],
      additionalProperties: false,
    },
  },
  {
    name: "render_markdown",
    description:
      "Render an Orbit brief as Markdown without fetching or mutating anything.",
    inputSchema: {
      type: "object",
      properties: { brief: { type: "object" } },
      required: ["brief"],
      additionalProperties: false,
    },
  },
];

const textResult = (text: string, structuredContent?: unknown) => ({
  content: [{ type: "text", text }],
  ...(structuredContent === undefined ? {} : { structuredContent }),
});

export function createHttpApp(runner: Runner = run) {
  const app = new Hono();
  app.get("/api/example", (c) => c.json(publicExample));
  app.post("/api/runs", async (c) => {
    try {
      return c.json(await runner(await c.req.json()), 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "invalid request" },
        400,
      );
    }
  });
  app.post("/mcp", async (c) => {
    let request: RpcRequest;
    try {
      request = await c.req.json<RpcRequest>();
    } catch {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        },
        400,
      );
    }
    const id = request.id ?? null;
    const ok = (result: unknown) => c.json({ jsonrpc: "2.0", id, result });
    const fail = (code: number, message: string) =>
      c.json({ jsonrpc: "2.0", id, error: { code, message } });
    try {
      if (request.method === "initialize") {
        return ok({
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "orbit", version: "0.0.1" },
        });
      }
      if (request.method === "notifications/initialized")
        return c.body(null, 202);
      if (request.method === "ping") return ok({});
      if (request.method === "tools/list") return ok({ tools });
      if (request.method !== "tools/call")
        return fail(-32601, "Method not found");
      const name = request.params?.name;
      const args = request.params?.arguments ?? {};
      if (name === "get_example_spec") {
        return ok(
          textResult(JSON.stringify(publicExample, null, 2), publicExample),
        );
      }
      if (name === "run_public_spec") {
        const brief = await runner(args.spec);
        return ok(textResult(JSON.stringify(brief, null, 2), brief));
      }
      if (name === "render_markdown") {
        return ok(textResult(markdown(args.brief as Brief)));
      }
      return fail(-32602, "Unknown tool");
    } catch (error) {
      return ok({
        ...textResult(error instanceof Error ? error.message : "Tool failed"),
        isError: true,
      });
    }
  });
  return app;
}
