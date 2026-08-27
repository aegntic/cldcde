# Vault Analysis Prompts

Each analysis prompt provides specific scope, criteria, and expected outputs to guide comprehensive vault assessment and improvement.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/obsidian-elite-rag/prompts/vault-analysis.md" -o "$target/vault-analysis.md" && \
echo "[OK] Installed prompt vault-analysis.md to $target"
```
