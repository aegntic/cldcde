# Notebooklm Pro

NotebookLM Pro - Advanced conversational research and document analysis with session-based RAG, Gemini integration, and multi-source synthesis

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/notebooklm-pro" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/notebooklm-pro"
```
