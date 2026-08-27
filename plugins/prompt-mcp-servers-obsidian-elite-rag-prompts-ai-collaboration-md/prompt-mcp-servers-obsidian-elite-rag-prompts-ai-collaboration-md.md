# AI Collaboration Prompts

Each collaboration prompt includes context, objectives, and expected outcomes to guide effective AI-assisted work and learning.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/obsidian-elite-rag/prompts/ai-collaboration.md" -o "$target/ai-collaboration.md" && \
echo "[OK] Installed prompt ai-collaboration.md to $target"
```
