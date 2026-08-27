# Hyperliquid Risk Monitor

Mission-critical real-time risk monitoring system with automated alerts, circuit breakers, and emergency shutdown for live Hyperliquid trading by ae.ltd

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}" && \
cp -R "$tmp/cldcde/plugins/hyperliquid-risk-monitor" "${AE_PLUGIN_DIR:-$HOME/.claude/plugins}/" && \
true && \
echo "[OK] Installed plugins/hyperliquid-risk-monitor"
```
