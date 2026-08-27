# Correlation Investigation Prompt

Correlation investigation prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/correlation_investigation_prompt.py" -o "$target/correlation_investigation_prompt.py" && \
echo "[OK] Installed prompt correlation_investigation_prompt.py to $target"
```
