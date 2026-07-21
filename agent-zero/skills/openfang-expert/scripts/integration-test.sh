#!/bin/bash
# Run live integration tests
set -e

echo "=== Stopping existing daemon ==="
openfang stop 2>/dev/null || true
sleep 2

echo "=== Building release ==="
cd /a0/usr/projects/openfang_3
cargo build --release -p openfang-cli

echo "=== Starting daemon ==="
source ~/.openfang/.env && target/release/openfang start &
sleep 6

echo "=== Testing health ==="
curl -s http://127.0.0.1:50051/api/health

echo ""
echo "=== Testing agents ==="
curl -s http://127.0.0.1:50051/api/agents

echo ""
echo "=== Testing status ==="
curl -s http://127.0.0.1:50051/api/status

echo ""
echo "✅ Integration tests passed!"
