# MCP dogfood

Orbit exposes a minimal, non-mutating JSON-RPC subset (not broad MCP conformance) at `POST /mcp`. After `initialize`, discover `get_example_spec`, `run_public_spec`, and `render_markdown` with `tools/list` and invoke them with `tools/call`.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "get_example_spec", "arguments": {} }
}
```

Pass that tool's structured spec to `run_public_spec`, then pass the returned structured brief to `render_markdown`. Those are the only methods and tools supported. The endpoint has no arbitrary-spec, action, outcome, credential, private-source, or persistence tools.
