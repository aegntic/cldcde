#!/bin/bash

echo "==================================="
echo "CLDCDE Pro - GitHub OAuth Setup"
echo "==================================="
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "Found existing .env file"
    source .env
else
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ Created .env file"
fi

echo ""
echo "Current GitHub OAuth Configuration:"
echo "-----------------------------------"

if [ -z "$GITHUB_CLIENT_ID" ]; then
    echo "❌ GITHUB_CLIENT_ID: Not set"
else
    echo "✓ GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:0:10}..."
fi

if [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "❌ GITHUB_CLIENT_SECRET: Not set"
else
    echo "✓ GITHUB_CLIENT_SECRET: ****"
fi

if [ -z "$GITHUB_REDIRECT_URI" ]; then
    echo "❌ GITHUB_REDIRECT_URI: Not set (will use default)"
else
    echo "✓ GITHUB_REDIRECT_URI: $GITHUB_REDIRECT_URI"
fi

echo ""
echo "To set up GitHub OAuth:"
echo "----------------------"
echo "1. Go to: https://github.com/settings/developers"
echo "2. Click 'New OAuth App'"
echo "3. Use these settings:"
echo "   - Application name: CLDCDE Pro"
echo "   - Homepage URL: http://localhost:8083"
echo "   - Authorization callback URL: http://localhost:8083/auth/github/callback"
echo ""
echo "4. After creating the app, edit .env and add:"
echo "   GITHUB_CLIENT_ID='your_client_id'"
echo "   GITHUB_CLIENT_SECRET='your_client_secret'"
echo ""
echo "5. Run the dashboard:"
echo "   source .env && cargo run -p web-dashboard"
echo ""
echo "Current OAuth URLs:"
echo "------------------"
echo "Login page: http://localhost:8083/login"
echo "OAuth start: http://localhost:8083/auth/github"
echo "OAuth callback: http://localhost:8083/auth/github/callback"
echo ""