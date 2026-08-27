# Website Intelligence Engine

Analyzes a reference website and produces an original, reusable, production-ready template ecosystem with design tokens, motion DNA, component/section libraries, placeholder catalogs, CMS schemas, and manifests.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/wie" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/wie"
```
