# Website Gen Automation

Intelligent website generation and distribution workflow with animation studio integration, SEO optimization, and human-like AI content distribution by ae.ltd

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/website-gen-automation" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/website-gen-automation"
```
