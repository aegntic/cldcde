#!/bin/bash

# Test script to verify re-initialization fix works

echo "Starting n8n MCP server..."
AUTH_TOKEN=test123456789012345678901234567890 npm run start:http &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Testing multiple initialize requests..."

# First initialize request
echo "1. First initialize request:"
RESPONSE1=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer test123456789012345678901234567890" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {
          "listChanged": false
        }
      },
      "clientInfo": {
        "name": "test-client-1",
        "version": "1.0.0"
      }
    }
  }')

if echo "$RESPONSE1" | grep -q '"result"'; then
    echo "✅ First initialize request succeeded"
else
    echo "❌ First initialize request failed: $RESPONSE1"
fi

# Second initialize request (this was failing before)
echo "2. Second initialize request (this was failing before the fix):"
RESPONSE2=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer test123456789012345678901234567890" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {
          "listChanged": false
        }
      },
      "clientInfo": {
        "name": "test-client-2",
        "version": "1.0.0"
      }
    }
  }')

if echo "$RESPONSE2" | grep -q '"result"'; then
    echo "✅ Second initialize request succeeded - FIX WORKING!"
else
    echo "❌ Second initialize request failed: $RESPONSE2"
fi

# Third initialize request to be sure
echo "3. Third initialize request:"
RESPONSE3=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer test123456789012345678901234567890" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {
          "listChanged": false
        }
      },
      "clientInfo": {
        "name": "test-client-3",
        "version": "1.0.0"
      }
    }
  }')

if echo "$RESPONSE3" | grep -q '"result"'; then
    echo "✅ Third initialize request succeeded"
else
    echo "❌ Third initialize request failed: $RESPONSE3"
fi

# Check health to see active transports
echo "4. Checking server health for active transports:"
HEALTH=$(curl -s -X GET http://localhost:3000/health)
echo "$HEALTH" | python3 -m json.tool

# Cleanup
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "Test completed!"