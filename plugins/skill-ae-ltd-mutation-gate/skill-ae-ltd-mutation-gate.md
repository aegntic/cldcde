# ae-ltd-mutation-gate

Run targeted mutation testing and convert survivors into concrete tests.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-mutation-gate" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-mutation-gate" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-mutation-gate" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-mutation-gate"
```
