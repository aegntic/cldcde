# Cloud Aegnts With Computer Use

Run AI aegnts in isolated sandboxes that record themselves interacting with software they build. Features automatic video recording, browser automation, artifact generation, and merge-ready PRs.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/cloud-agents" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/cloud-agents"
```
