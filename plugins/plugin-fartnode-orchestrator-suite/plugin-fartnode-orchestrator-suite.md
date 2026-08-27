# Fartnode Orchestrator Suite

Master multi-agent orchestration system that deploys and manages specialized subagents for comprehensive viral automation ecosystems by ae.ltd

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/fartnode-orchestrator-suite" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/fartnode-orchestrator-suite"
```
