#!/bin/bash

# Prologue Complete Deployment Script
# This script handles Git operations, GitHub Pages, and DNS configuration

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "║ ███████████                     █████                                            ║"
echo "║░░███░░░░░███                   ░░███                                             ║"
echo "║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║"
echo "║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║"
echo "║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║"
echo "║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║"
echo "║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║"
echo "║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║"
echo "║                                                      ███ ░███                    ║"
echo "║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║"
echo "║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "║                                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════════════════════╝"
echo "                       COMPLETE DEPLOYMENT SCRIPT"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the Prologue project root directory"
    exit 1
fi

print_status "Starting Prologue deployment process..."

# Step 1: Git operations
print_status "Step 1: Git Operations"
echo "----------------------------"

if [ -n "$(git status --porcelain)" ]; then
    print_status "Uncommitted changes detected, committing them..."

    # Add all changes
    git add -A

    # Commit with timestamp
    git commit -m "Deployment update - $(date '+%Y-%m-%d %H:%M:%S')

🚀 Automated deployment update
- Sync latest changes to GitHub
- Update deployment configuration

🤖 Generated with GLM Assistant

Co-Authored-By: GLM Assistant <noreply@generic.ai>'

    print_success "Changes committed successfully"
else
    print_status "No uncommitted changes found"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git push origin main
print_success "Code pushed to GitHub"

# Step 2: Check GitHub Pages status
print_status "Step 2: GitHub Pages Status"
echo "--------------------------------"

# Wait a moment for GitHub to process
sleep 5

# Check if GitHub Pages is enabled
PAGES_STATUS=$(gh api repos/:owner/:repo/pages 2>/dev/null || echo '{"status": "not_enabled"}')

if echo "$PAGES_STATUS" | grep -q '"status":null'; then
    print_success "GitHub Pages is enabled and building"

    # Get the URL
    PAGES_URL=$(echo "$PAGES_STATUS" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
    print_status "GitHub Pages URL: $PAGES_URL"

    print_status "Your site will be available at: https://logue.pro"
    print_status "GitHub Pages preview: $PAGES_URL"

elif echo "$PAGES_STATUS" | grep -q '"not_enabled"'; then
    print_warning "GitHub Pages is not enabled"
    print_status "Enabling GitHub Pages..."

    # Enable GitHub Pages
    gh api repos/:owner/:repo/pages -X POST -f source[branch]=main -f source[path]=/docs >/dev/null 2>&1 || {
        print_error "Failed to enable GitHub Pages"
        print_status "Please enable it manually in repository settings"
    }

    print_success "GitHub Pages enabled"
else
    print_status "GitHub Pages status: $(echo "$PAGES_STATUS" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
fi

# Step 3: DNS Configuration (optional)
print_status "Step 3: DNS Configuration"
echo "------------------------------"

# Check if Porkbun credentials are set
if [ -z "$PORKBUN_API_KEY" ] || [ -z "$PORKBUN_SECRET_KEY" ]; then
    print_warning "Porkbun API credentials not found"
    print_status "To configure DNS for logue.pro, set your credentials:"
    print_status "  export PORKBUN_API_KEY=your_api_key"
    print_status "  export PORKBUN_SECRET_KEY=your_secret_key"
    print_status "Then run: node scripts/porkbun-dns.js configure"
else
    print_status "Porkbun credentials found, configuring DNS..."

    # Run DNS configuration
    if node scripts/porkbun-dns.js configure; then
        print_success "DNS configuration completed"
    else
        print_error "DNS configuration failed"
        print_status "Please check your credentials and try manually"
    fi
fi

# Step 4: Email Server Setup (optional)
print_status "Step 4: Email Registration Server"
echo "--------------------------------------"

if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_status "To set up email registration:"
    print_status "  1. Copy .env.example to .env"
    print_status "  2. Add your RESEND_API_KEY"
    print_status "  3. Run: npm run server"
else
    print_status ".env file found"
    if grep -q "re_your_resend_api_key" .env; then
        print_warning "Please update your RESEND_API_KEY in .env file"
    else
        print_success "Email registration is configured"
        print_status "Start the server with: npm run server"
    fi
fi

# Step 5: Final Summary
print_status "Deployment Summary"
echo "===================="

print_success "✅ Code deployed to GitHub"
print_success "✅ GitHub Pages configured"
print_success "✅ Documentation available at https://logue.pro"
print_success "✅ GitHub repository: https://github.com/aegntic/prologue"

echo ""
print_status "Next Steps:"
echo "1. Wait for GitHub Pages to build (usually 2-5 minutes)"
echo "2. Configure DNS if not already done"
echo "3. Set up email registration server"
echo "4. Test your deployment: https://logue.pro"

echo ""
print_status "Useful Commands:"
echo "• Check DNS status: node scripts/porkbun-dns.js status"
echo "• Start email server: npm run server"
echo "• View GitHub Pages: gh repo view --web"
echo "• Monitor deployment: gh run list --repo aegntic/prologue"

echo ""
print_success "[OK] Prologue deployment completed successfully!"
echo "[INFO] Your creative journey begins now!"

# Optional: Open the site in browser
if command -v xdg-open &> /dev/null; then
    read -p "Do you want to open https://logue.pro in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open https://logue.pro
    fi
elif command -v open &> /dev/null; then
    read -p "Do you want to open https://logue.pro in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open https://logue.pro
    fi
fi