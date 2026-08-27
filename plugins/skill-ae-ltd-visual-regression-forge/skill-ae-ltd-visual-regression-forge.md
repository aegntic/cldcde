# ae-ltd-visual-regression-forge

Baseline-and-diff UI quality gate for confident releases.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-visual-regression-forge" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-visual-regression-forge" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-visual-regression-forge" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-visual-regression-forge"
```
