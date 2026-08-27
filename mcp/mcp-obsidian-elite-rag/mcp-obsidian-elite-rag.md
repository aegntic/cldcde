# Obsidian Elite Rag

Elite Obsidian RAG System - Second Brain with Claude Code Integration

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}" && \
cp -R "$tmp/cldcde/mcp-servers/obsidian-elite-rag" "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}/" && \
cd "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}/obsidian-elite-rag" && \
if [ -f package.json ]; then npm install; elif [ -f pyproject.toml ]; then (command -v uv >/dev/null 2>&1 && uv sync) || python3 -m pip install -e .; elif [ -f requirements.txt ]; then python3 -m pip install -r requirements.txt; fi && \
echo "[OK] Installed mcp-servers/obsidian-elite-rag to ${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}"
```
