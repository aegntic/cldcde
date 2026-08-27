# Find Datasources Prompt

Find data sources prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/find_datasources_prompt.py" -o "$target/find_datasources_prompt.py" && \
echo "[OK] Installed prompt find_datasources_prompt.py to $target"
```
