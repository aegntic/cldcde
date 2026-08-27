# ae-ltd-mcp-foundry

Scaffold and harden MCP servers with strict contracts and validation.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-mcp-foundry" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-mcp-foundry" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-mcp-foundry" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-mcp-foundry"
```
