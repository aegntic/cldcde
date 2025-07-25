#!/bin/bash

echo "Testing CLDCDE Pro GitHub Dark Theme Implementation"
echo "=================================================="
echo ""

# Check if the server is running
echo "1. Checking if web dashboard is running on port 8081..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/ > /tmp/status_code.txt
STATUS=$(cat /tmp/status_code.txt)

if [ "$STATUS" = "200" ]; then
    echo "✓ Web dashboard is running successfully"
else
    echo "✗ Web dashboard is not responding (HTTP $STATUS)"
    exit 1
fi

echo ""
echo "2. Checking for GitHub dark theme CSS..."
curl -s http://localhost:8081/static/css/github-dark.css | head -20 > /tmp/github_css.txt
if grep -q "color-canvas-default" /tmp/github_css.txt; then
    echo "✓ GitHub dark theme CSS is loaded"
    echo "  Found GitHub color variables:"
    grep "color-" /tmp/github_css.txt | head -5 | sed 's/^/    /'
else
    echo "✗ GitHub dark theme CSS not found"
fi

echo ""
echo "3. Checking dashboard HTML structure..."
curl -s http://localhost:8081/dashboard | grep -E "(github-dark|repositories|user-profile)" > /tmp/dashboard_check.txt
if [ -s /tmp/dashboard_check.txt ]; then
    echo "✓ Dashboard contains GitHub theme elements"
else
    echo "✗ Dashboard might not have GitHub theme applied"
fi

echo ""
echo "4. Checking if repositories page exists..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/repositories > /tmp/repo_status.txt
REPO_STATUS=$(cat /tmp/repo_status.txt)
if [ "$REPO_STATUS" = "200" ] || [ "$REPO_STATUS" = "302" ]; then
    echo "✓ Repositories page is accessible (HTTP $REPO_STATUS)"
else
    echo "✗ Repositories page not accessible (HTTP $REPO_STATUS)"
fi

echo ""
echo "=================================================="
echo "GitHub Dark Theme Implementation Test Complete"
echo ""
echo "Access the dashboard at: http://localhost:8081"
echo "Login page: http://localhost:8081/login"
echo "Dashboard: http://localhost:8081/dashboard"
echo "Repositories: http://localhost:8081/repositories"
echo ""
echo "Default credentials (for testing):"
echo "Username: admin"
echo "Password: admin123"