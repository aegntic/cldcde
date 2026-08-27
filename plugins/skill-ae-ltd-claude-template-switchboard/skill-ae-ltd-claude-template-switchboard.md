# ae-ltd-claude-template-switchboard

Select and adapt the right CLAUDE.md template for repo context.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-claude-template-switchboard" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-claude-template-switchboard" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-claude-template-switchboard" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-claude-template-switchboard"
```
