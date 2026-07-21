#!/bin/bash
# Run full validation after changes
set -e
cd /a0/usr/projects/openfang_3

echo "=== Building workspace ==="
cargo build --workspace --lib

echo "=== Running tests ==="
cargo test --workspace

echo "=== Running clippy ==="
cargo clippy --workspace --all-targets -- -D warnings

echo "✅ All validations passed!"
