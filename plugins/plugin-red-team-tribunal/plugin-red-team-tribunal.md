# Red Team Tribunal Skill

The Red Team Tribunal utilizes Opus 4.6 Agent Teams to create an adversarial review loop that prevents "confident mistakes" through multi-agent consensus.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/red-team-tribunal" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/red-team-tribunal"
```
