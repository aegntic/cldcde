# System Prompt Extensions for Skill Builder

When this skill is active, extend Claude's system context with:

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/skills/ae-ltd-skill-builder/prompts/system.md" -o "$target/system.md" && \
echo "[OK] Installed prompt system.md to $target"
```
