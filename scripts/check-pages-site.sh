#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/.pages-dist"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[OK] $1"
}

[ -d "$OUT_DIR" ] || fail "Missing Pages output directory: $OUT_DIR. Run 'bun run site:build' first."

for file in index.html index.js _redirects; do
  [ -f "$OUT_DIR/$file" ] || fail "Missing required file: $OUT_DIR/$file"
done

[ -s "$OUT_DIR/index.js" ] || fail "Built JavaScript bundle is empty: $OUT_DIR/index.js"

if ! grep -q "./index.js" "$OUT_DIR/index.html"; then
  fail "index.html does not reference ./index.js"
fi

if grep -q "./index.tsx" "$OUT_DIR/index.html"; then
  fail "index.html still references ./index.tsx"
fi

if [ -f "$OUT_DIR/static/downloads/ae-ltd/latest.json" ]; then
  MANIFEST_PATH="$OUT_DIR/static/downloads/ae-ltd/latest.json"
elif [ -f "$OUT_DIR/static/downloads/ae-ltd/manifest.json" ]; then
  MANIFEST_PATH="$OUT_DIR/static/downloads/ae-ltd/manifest.json"
else
  MANIFEST_PATH=""
fi

if [ -n "$MANIFEST_PATH" ]; then
  python3 - "$MANIFEST_PATH" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))

required = ["brand", "version", "packs"]
missing = [k for k in required if k not in data]
if missing:
    raise SystemExit(f"Manifest missing keys: {', '.join(missing)}")

if not isinstance(data["packs"], list) or not data["packs"]:
    raise SystemExit("Manifest packs must be a non-empty array")

print("[OK] AE.LTD manifest is valid JSON")
PY
else
  echo "[WARN] AE.LTD manifest missing at .pages-dist/static/downloads/ae-ltd/"
fi

pass "Pages bundle validated"
