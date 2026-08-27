#!/usr/bin/env bash
set -euo pipefail

html="$(curl -fsSL https://cldcde.cc)"
if echo "$html" | grep -qi 'Parked at Porkbun'; then
  echo "[FAIL] cldcde.cc is still the Porkbun parked page" >&2
  exit 1
fi
if ! echo "$html" | grep -qi 'CLDCDE'; then
  echo "[FAIL] cldcde.cc did not contain CLDCDE" >&2
  exit 1
fi
echo "[OK] cldcde.cc is not parked"
