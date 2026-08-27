# Example Prompts for Skill Builder

These examples demonstrate how to interact with the Skill Builder skill.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/skills/ae-ltd-skill-builder/prompts/examples.md" -o "$target/examples.md" && \
echo "[OK] Installed prompt examples.md to $target"
```
