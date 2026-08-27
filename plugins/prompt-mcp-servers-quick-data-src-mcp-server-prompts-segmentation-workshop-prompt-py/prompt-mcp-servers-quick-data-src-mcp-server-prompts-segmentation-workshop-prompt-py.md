# Segmentation Workshop Prompt

Segmentation workshop prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/segmentation_workshop_prompt.py" -o "$target/segmentation_workshop_prompt.py" && \
echo "[OK] Installed prompt segmentation_workshop_prompt.py to $target"
```
