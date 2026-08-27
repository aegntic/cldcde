# Prompt 2: PRD Pass

Read:

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/.claude/skills/ae-proof-agent/prompts/02-PRD.md" -o "$target/02-PRD.md" && \
echo "[OK] Installed prompt 02-PRD.md to $target"
```
