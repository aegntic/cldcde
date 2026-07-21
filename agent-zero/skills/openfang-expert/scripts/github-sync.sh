#!/bin/bash
# Sync with GitHub and show changes
cd /a0/usr/projects/openfang_3

echo "=== Fetching latest ==="
git fetch origin

echo "=== Recent commits ==="
git log HEAD..origin/main --oneline 2>/dev/null || echo "Up to date or no upstream"

echo "=== Changed files ==="
git diff --name-only origin/main 2>/dev/null || echo "No changes"

echo "=== Check for conflicts ==="
git merge --no-commit --no-ff origin/main 2>&1 || echo "Merge would have conflicts"
git merge --abort 2>/dev/null || true
