# Retrieval Optimization Prompts

00-Core/           # Foundational knowledge 01-Projects/       # Active work 02-Research/       # Learning areas 03-Workflows/      # Reusable processes 04-AI-Paired/      # AI interactions 05-Resources/      # External references

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/obsidian-elite-rag/prompts/retrieval-optimization.md" -o "$target/retrieval-optimization.md" && \
echo "[OK] Installed prompt retrieval-optimization.md to $target"
```
