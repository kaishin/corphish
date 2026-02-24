# TODO

## MCP Server for Host CLI Tools

Expose host-installed CLIs to the container agent via an MCP server running on the host.

- [ ] Design MCP server that wraps one or more host CLIs
- [ ] Run the MCP server on the host (bound to `192.168.65.1` or `0.0.0.0`)
- [ ] Configure the container to connect to it (via `~/.claude/mcp.json` or equivalent)
- [ ] Wire up the MCP server start in `src/index.ts` alongside the host proxy
- [ ] Document in `CLAUDE.md` under a new "MCP Servers" section
