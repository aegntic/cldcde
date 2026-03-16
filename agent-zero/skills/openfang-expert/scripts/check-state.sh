#!/bin/bash
# Check current OpenFang state

echo "=== OpenFang State Check ==="
echo ""

echo "1. Daemon Status:"
openfang status 2>&1 | head -15

echo ""
echo "2. MCP Servers:"
curl -s http://127.0.0.1:50051/api/mcp/servers 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for s in data.get('servers', []):
        status = '✅' if s.get('connected') else '❌'
        print(f'  {status} {s.get("name")}: {s.get("tools", 0)} tools')
except:
    print('  Could not fetch MCP status')
"

echo ""
echo "3. Recent Logs:"
tail -10 ~/.openfang/data/logs/*.log 2>/dev/null || echo "  No logs found"

echo ""
echo "4. Config Validation:"
cat ~/.openfang/config.toml | head -20

echo ""
echo "5. Build Status:"
cd /a0/usr/projects/openfang_3
cargo check --workspace 2>&1 | tail -5
