import { Hono } from "hono";
import type { Brief } from "./contracts.js";
import { publicExample } from "./example.js";
import { markdown } from "./kernel/markdown.js";
import { validateBrief } from "./kernel/validate.js";

export type Runner = (value: unknown) => Promise<Brief>;
export type HttpAppOptions = { runner?: Runner; maxRequestBytes?: number };
type RpcRequest = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: { name?: unknown; arguments?: Record<string, unknown> };
};
const DEFAULT_MAX_REQUEST_BYTES = 256_000;
const tools = [
  {
    name: "get_example_spec",
    description: "Get Orbit's checked-in bounded public example specification.",
    inputSchema: { type: "object", additionalProperties: false },
  },
  {
    name: "run_public_spec",
    description: "Run a policy-approved bounded public Orbit spec.",
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
      "Render a validated Orbit brief as Markdown without fetching or mutating anything.",
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
async function boundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (
    declared !== null &&
    (!/^\d+$/.test(declared) || Number(declared) > maxBytes)
  )
    throw new Error("request body too large");
  if (!request.body) throw new Error("request body required");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("request body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export function createHttpApp(options: HttpAppOptions = {}) {
  const { runner, maxRequestBytes = DEFAULT_MAX_REQUEST_BYTES } = options;
  if (!Number.isInteger(maxRequestBytes) || maxRequestBytes < 1)
    throw new Error("invalid maxRequestBytes");
  const app = new Hono();
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "no-referrer");
    c.header(
      "Content-Security-Policy",
      // svelte-hono emits an inline import map and hydration bootstrap. The
      // page renders only escaped structured data and loads code from self.
      "default-src 'self'; script-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
    );
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  });
  app.get("/api/example", (c) => c.json(publicExample));
  app.post("/api/runs", async (c) => {
    try {
      if (!runner)
        return c.json(
          { error: "run endpoint is disabled; inject a policy-bound runner" },
          403,
        );
      return c.json(
        await runner(await boundedJson(c.req.raw, maxRequestBytes)),
        201,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "invalid request";
      return c.json(
        { error: message },
        message === "request body too large" ? 413 : 400,
      );
    }
  });
  app.post("/mcp", async (c) => {
    let request: RpcRequest;
    try {
      request = (await boundedJson(c.req.raw, maxRequestBytes)) as RpcRequest;
    } catch (error) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code:
              error instanceof Error &&
              error.message === "request body too large"
                ? -32001
                : -32700,
            message: error instanceof Error ? error.message : "Parse error",
          },
        },
        error instanceof Error && error.message === "request body too large"
          ? 413
          : 400,
      );
    }
    const id = request.id ?? null;
    const ok = (result: unknown) => c.json({ jsonrpc: "2.0", id, result });
    const fail = (code: number, message: string) =>
      c.json({ jsonrpc: "2.0", id, error: { code, message } });
    try {
      if (request.method === "initialize")
        return ok({
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "orbit", version: "0.0.1" },
        });
      if (request.method === "notifications/initialized")
        return c.body(null, 202);
      if (request.method === "ping") return ok({});
      if (request.method === "tools/list") return ok({ tools });
      if (request.method !== "tools/call")
        return fail(-32601, "Method not found");
      const name = request.params?.name;
      const args = request.params?.arguments ?? {};
      if (name === "get_example_spec")
        return ok(
          textResult(JSON.stringify(publicExample, null, 2), publicExample),
        );
      if (name === "run_public_spec") {
        if (!runner)
          throw new Error("run tool is disabled; inject a policy-bound runner");
        const brief = await runner(args.spec);
        return ok(textResult(JSON.stringify(brief, null, 2), brief));
      }
      if (name === "render_markdown") {
        validateBrief(args.brief);
        return ok(textResult(markdown(args.brief)));
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
