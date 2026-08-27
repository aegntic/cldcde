# Youtube Creator Pro

Advanced YouTube Creator Plugin with AI-Powered Workflows

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/youtube-creator-pro" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/youtube-creator-pro"
```
