# MCP dogfood

Orbit exposes a narrow JSON-RPC endpoint at `POST /mcp`. After `initialize`, discover `get_example_spec`, `run_public_spec`, and `render_markdown` with `tools/list` and invoke them with `tools/call`.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "get_example_spec", "arguments": {} }
}
```

Pass that tool's structured spec to `run_public_spec`, then pass the returned structured brief to `render_markdown`. The endpoint has no action, credential, private-source, or persistence tools.
