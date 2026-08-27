# Compound Engineering Plugin

The Compound Engineering Plugin coordinates Debt-Sentinel, Red Team Tribunal, and Spec-Lock into unified, multi-stage workflows. It provides orchestration, metrics tracking, and quality gates for comprehensive code quality management.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/compound-engineering" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/compound-engineering"
```
