#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/.pages-dist"

cd "$ROOT_DIR"

bun run build

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Frontend bundle
[ -f "$ROOT_DIR/dist/index.js" ] || {
  echo "[FAIL] Missing built bundle: $ROOT_DIR/dist/index.js" >&2
  exit 1
}
cp "$ROOT_DIR/dist/index.js" "$OUT_DIR/index.js"

# Production HTML references built JS instead of TS entry
sed 's#\./index.tsx#./index.js#g' "$ROOT_DIR/frontend/src/index.html" > "$OUT_DIR/index.html"

# Preserve current static semantics for existing frontend code
if [ -d "$ROOT_DIR/public" ]; then
  cp -R "$ROOT_DIR/public/." "$OUT_DIR/"
  mkdir -p "$OUT_DIR/static"
  cp -R "$ROOT_DIR/public/." "$OUT_DIR/static/"
fi

# SPA fallback for deep links
cat > "$OUT_DIR/_redirects" <<'REDIRECTS'
/* /index.html 200
REDIRECTS

echo "[OK] Pages bundle prepared at $OUT_DIR"
