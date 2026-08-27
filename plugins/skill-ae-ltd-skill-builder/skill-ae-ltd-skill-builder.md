# ae-ltd-skill-builder

Factory for creating, validating, and managing Claude Code skills with proper structure and tooling.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-skill-builder" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-skill-builder" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-skill-builder" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-skill-builder"
```
