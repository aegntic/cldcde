# Graphiti Mcp

Repo-synced item. Add a README or metadata file for a richer listing.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}" && \
cp -R "$tmp/cldcde/mcp-servers/graphiti-mcp" "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}/" && \
cd "${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}/graphiti-mcp" && \
if [ -f package.json ]; then npm install; elif [ -f pyproject.toml ]; then (command -v uv >/dev/null 2>&1 && uv sync) || python3 -m pip install -e .; elif [ -f requirements.txt ]; then python3 -m pip install -r requirements.txt; fi && \
echo "[OK] Installed mcp-servers/graphiti-mcp to ${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}"
```
