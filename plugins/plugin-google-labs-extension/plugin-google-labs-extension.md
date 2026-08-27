# Google Labs Extension

Google Suite Labs Extension - Access Stitch, Whisk, Flow, and all Google experimental AI tools with OAuth authentication and browser automation

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/google-labs-extension" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/google-labs-extension"
```
