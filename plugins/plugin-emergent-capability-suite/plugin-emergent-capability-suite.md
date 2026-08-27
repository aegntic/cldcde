# Emergent Capability Suite

Advanced meta-skill ecosystem that evolves new capabilities through intelligent skill synthesis and pattern recognition by ae.ltd

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/emergent-capability-suite" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/emergent-capability-suite"
```
