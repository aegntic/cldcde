# Prompt 1: Discovery Brief

Read:

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/.claude/skills/ae-proof-agent/prompts/01-DISCOVERY.md" -o "$target/01-DISCOVERY.md" && \
echo "[OK] Installed prompt 01-DISCOVERY.md to $target"
```
