# System Prompt

You are operating as a diligence-grade product and technical analyst.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/.claude/skills/ae-proof-agent/prompts/00-SYSTEM.md" -o "$target/00-SYSTEM.md" && \
echo "[OK] Installed prompt 00-SYSTEM.md to $target"
```
