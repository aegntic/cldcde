# ae-ltd-n8n-orbit

Generate production-ready n8n workflows from natural language goals.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-n8n-orbit" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-n8n-orbit" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-n8n-orbit" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-n8n-orbit"
```
