#!/bin/bash

echo "🔨 Building aegntic-auth MCP server..."

cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build the project
echo "🏗️ Building TypeScript..."
bun build ./src/index.ts --outdir ./dist --target node --external @modelcontextprotocol/sdk --external stripe --external nodemailer --external jsonwebtoken

# Make executable
chmod +x dist/index.js

echo "✅ Build complete!"
echo ""
echo "To use the aegntic-auth server:"
echo "1. Set environment variables in ~/.claude/.env"
echo "2. Run: /restart-mcp"
echo "3. The auth server will be available in Claude"