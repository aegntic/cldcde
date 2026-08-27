# Prompt 3: Technical Spec Pass

Read:

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/.claude/skills/ae-proof-agent/prompts/03-TECHSPEC.md" -o "$target/03-TECHSPEC.md" && \
echo "[OK] Installed prompt 03-TECHSPEC.md to $target"
```
