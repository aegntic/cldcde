# Debt Sentinel Plugin

The Tech-Debt Sentinel is a hook-based architectural enforcer that prevents "vibe coding" slop by blocking anti-patterns before they enter the codebase.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/debt-sentinel" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/debt-sentinel"
```
