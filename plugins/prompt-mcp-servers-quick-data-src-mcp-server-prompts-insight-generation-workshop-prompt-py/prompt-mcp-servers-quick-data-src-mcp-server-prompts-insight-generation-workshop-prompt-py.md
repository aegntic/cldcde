# Insight Generation Workshop Prompt

Insight generation workshop prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/insight_generation_workshop_prompt.py" -o "$target/insight_generation_workshop_prompt.py" && \
echo "[OK] Installed prompt insight_generation_workshop_prompt.py to $target"
```
