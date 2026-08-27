# Prologue Plugin

Cross-platform interactive menu system for the @aegntic ecosystem. Works with Claude Code, Factory Droid, Antigravity, Gemini, and standalone CLI.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/prologue-plugin" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/prologue-plugin"
```
