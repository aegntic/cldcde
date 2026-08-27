# Dataset First Look Prompt

Dataset first look prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/dataset_first_look_prompt.py" -o "$target/dataset_first_look_prompt.py" && \
echo "[OK] Installed prompt dataset_first_look_prompt.py to $target"
```
