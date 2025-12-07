#!/bin/bash

# CLDCDE GitHub Deployment Script
# Deploy your entire ecosystem to GitHub with proper branding

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/aegntic/cldcde.git"
BRANCH="main"

echo -e "${BLUE}🚀 CLDCDE GitHub Deployment Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in CLDCDE root directory${NC}"
    exit 1
fi

# Show current status
echo -e "${YELLOW}📋 Current Status:${NC}"
echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repo')"
echo "Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote set')"
echo ""

# Ask for confirmation
read -p "Do you want to deploy CLDCDE to GitHub? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Starting deployment...${NC}"
echo ""

# Initialize git repo if not already done
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git repository...${NC}"
    git init
    git remote add origin $REPO_URL
fi

# Add all files
echo -e "${YELLOW}📝 Adding files to git...${NC}"
git add .

# Create commit
echo -e "${YELLOW}💾 Creating commit...${NC}"
git commit -m "🚀 Deploy CLDCDE Ecosystem v1.0.0

Features:
- Complete CLDCDE.cc branding across all tools
- Enhanced MCP server integrations
- Updated ae.ltd attribution
- GitHub deployment workflow
- Contributor acknowledgments

Tools Included:
- YouTube Creator Pro & Basic
- OBS Studio Control
- Aegntic MCP Server
- AI Memory Server
- Context7 MCP
- N8n Integration
- Google AI Studio MCP

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>" || echo "✅ No changes to commit"

# Push to GitHub
echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
if git push -u origin $BRANCH 2>/dev/null; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}⚠️  Push failed. You may need to push manually:${NC}"
    echo "git push -u origin $BRANCH"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Summary:${NC}"
echo "📍 Repository: $REPO_URL"
echo "🌐 Website: https://cldcde.cc"
echo "📚 Docs: Will be available at https://aegntic.github.io/cldcde"
echo "🔧 GitHub Actions: Will run automatically on push"
echo ""

# Next steps
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Visit your repository: $REPO_URL"
echo "2. Enable GitHub Pages in repository settings"
echo "3. Set up repository secrets for deployment"
echo "4. Create a release tag: git tag v1.0.0 && git push --tags"
echo ""

echo -e "${GREEN}✨ CLDCDE ecosystem is now live!${NC}"