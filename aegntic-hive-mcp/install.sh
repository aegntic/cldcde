#!/bin/bash

echo "Installing Aegntic Hive MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Make server executable
chmod +x server.js

echo "Installation complete!"
echo ""
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "To configure with Claude Desktop, add this to your MCP configuration:"
echo "{"
echo "  \"mcpServers\": {"
echo "    \"aegntic-hive\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$(pwd)/server.js\"]"
echo "    }"
echo "  }"
echo "}"
