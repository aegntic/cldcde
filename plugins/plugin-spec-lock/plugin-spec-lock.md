# Spec Lock Plugin

The Living Spec Synchronizer prevents documentation rot by maintaining bi-directional sync between code and specifications. It treats documentation as executable code that must stay in sync with implementation.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/spec-lock" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/spec-lock"
```
