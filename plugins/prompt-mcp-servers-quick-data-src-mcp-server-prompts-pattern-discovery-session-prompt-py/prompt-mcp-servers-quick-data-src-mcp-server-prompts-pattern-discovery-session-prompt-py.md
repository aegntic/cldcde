# Pattern Discovery Session Prompt

Pattern discovery session prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/pattern_discovery_session_prompt.py" -o "$target/pattern_discovery_session_prompt.py" && \
echo "[OK] Installed prompt pattern_discovery_session_prompt.py to $target"
```
