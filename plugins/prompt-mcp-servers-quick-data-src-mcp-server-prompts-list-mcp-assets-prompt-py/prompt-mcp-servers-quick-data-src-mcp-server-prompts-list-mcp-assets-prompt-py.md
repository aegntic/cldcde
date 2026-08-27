# List Mcp Assets Prompt

List MCP assets prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/list_mcp_assets_prompt.py" -o "$target/list_mcp_assets_prompt.py" && \
echo "[OK] Installed prompt list_mcp_assets_prompt.py to $target"
```
