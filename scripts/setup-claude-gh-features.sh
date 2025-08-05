#!/bin/bash

# Claude Code GitHub CLI Extensions Setup Script
# Adds custom aliases and features for Claude Code development

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Claude Code GitHub CLI Extensions Installer                 ║"
echo "║   Adding shortcuts and features for Claude development        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated. Please run:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""
echo "📦 Installing Claude Code aliases and extensions..."
echo ""

# Create Claude-specific aliases
echo "🔧 Creating Claude Code aliases..."

# Repository creation with Claude defaults
gh alias set claude-create '!gh repo create "$1" \
  --private \
  --description "Claude Code project: $2" \
  --clone \
  --add-readme \
  --license mit \
  --gitignore node'

# Quick commit with Claude attribution
gh alias set claude-commit '!git add -A && git commit -m "$1

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"'

# Create issue with Claude Code template
gh alias set claude-issue '!gh issue create \
  --title "$1" \
  --body "## Description
$2

## Tasks
- [ ] Task 1
- [ ] Task 2

## Claude Code Context
- Extension/MCP affected: 
- Version: 
- Platform: 

---
Created with Claude Code CLI extensions"'

# Create PR with Claude template
gh alias set claude-pr '!gh pr create \
  --title "$1" \
  --body "## Summary
$2

## Changes
- 
- 

## Testing
- [ ] Tested locally
- [ ] All tests pass
- [ ] Documentation updated

## Claude Code
- [ ] Follows terminal aesthetic
- [ ] Compatible with all themes
- [ ] Performance impact assessed

---
🤖 Generated with Claude Code"'

# Quick deploy to Cloudflare
gh alias set claude-deploy '!echo "🚀 Deploying to Cloudflare..." && \
  bun run build && \
  bunx wrangler deploy && \
  bun run deploy:pages'

# Setup new Claude project
gh alias set claude-init '!echo "🎯 Initializing Claude Code project..." && \
  bun init -y && \
  mkdir -p src frontend/src/components frontend/src/styles && \
  touch README.md PLAN.md TASKS.md CLAUDE.md && \
  echo "# Claude Code Project

## Description
$1

## Setup
\`\`\`bash
bun install
bun dev
\`\`\`

## Architecture
- Frontend: React + TypeScript
- Backend: Hono + Cloudflare Workers
- Database: Supabase
- Styling: styled-components

---
🤖 Generated with Claude Code" > README.md'

# List all Claude repos
gh alias set claude-list '!gh repo list --topic claude-code'

# Quick status check
gh alias set claude-status '!echo "📊 Claude Code Project Status" && \
  echo "=========================" && \
  git status --short && \
  echo "" && \
  echo "📝 Recent Commits:" && \
  git log --oneline -5 && \
  echo "" && \
  echo "🔄 GitHub Status:" && \
  gh pr status && \
  gh issue status'

# Add Claude topics to repo
gh alias set claude-topics '!gh repo edit --add-topic claude-code --add-topic mcp --add-topic extensions'

# Create GitHub Action for Claude deployment
gh alias set claude-action '!mkdir -p .github/workflows && \
  echo "name: Deploy Claude Code

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install
    
    - name: Build
      run: bun run build
    
    - name: Deploy to Cloudflare
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        
    - name: Deploy Pages
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        command: pages deploy dist --project-name=\${{ github.event.repository.name }}
" > .github/workflows/deploy.yml'

# Setup Claude Code badges for README
gh alias set claude-badges '!echo "Adding Claude Code badges to README..." && \
  sed -i "" "1s/^/[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-blue)](https://claude.ai\/code)\n[![MCP Support](https://img.shields.io/badge/MCP-Enabled-green)](https://modelcontextprotocol.io)\n[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-orange)](https://developers.cloudflare.com)\n\n/" README.md'

# Quick search Claude repos
gh alias set claude-search '!gh search repos "claude-code $1" --limit 20'

# Clone with Claude setup
gh alias set claude-clone '!gh repo clone "$1" && \
  cd "$(basename "$1" .git)" && \
  if [ -f "bun.lockb" ]; then \
    echo "📦 Installing with Bun..." && bun install; \
  elif [ -f "package.json" ]; then \
    echo "📦 Installing dependencies..." && npm install; \
  fi && \
  echo "✅ Claude Code project ready!"'

# Create extension template
gh alias set claude-ext '!mkdir -p "$1" && cd "$1" && \
  gh claude-init "Claude Code Extension: $1" && \
  mkdir -p src/extension && \
  echo "{
  \"name\": \"$1\",
  \"version\": \"1.0.0\",
  \"description\": \"Claude Code Extension\",
  \"main\": \"src/extension/index.ts\",
  \"type\": \"module\",
  \"scripts\": {
    \"dev\": \"bun run --watch src/extension/index.ts\",
    \"build\": \"bun build src/extension/index.ts --outdir=dist\",
    \"test\": \"bun test\"
  },
  \"keywords\": [\"claude-code\", \"extension\"],
  \"author\": \"\",
  \"license\": \"MIT\"
}" > package.json'

# Create MCP server template
gh alias set claude-mcp '!mkdir -p "$1" && cd "$1" && \
  gh claude-init "MCP Server: $1" && \
  mkdir -p src/server && \
  echo "{
  \"name\": \"@mcp/$1\",
  \"version\": \"1.0.0\",
  \"description\": \"Model Context Protocol Server\",
  \"main\": \"src/server/index.ts\",
  \"type\": \"module\",
  \"scripts\": {
    \"start\": \"bun run src/server/index.ts\",
    \"dev\": \"bun run --watch src/server/index.ts\",
    \"build\": \"bun build src/server/index.ts --outdir=dist\"
  },
  \"keywords\": [\"mcp\", \"claude-code\", \"model-context-protocol\"],
  \"author\": \"\",
  \"license\": \"MIT\"
}" > package.json'

echo ""
echo "✅ Claude Code GitHub CLI extensions installed!"
echo ""
echo "📚 Available Commands:"
echo ""
echo "  Repository Management:"
echo "    gh claude-create <name> <description>  - Create Claude repo with defaults"
echo "    gh claude-list                         - List all Claude Code repos"
echo "    gh claude-topics                       - Add Claude topics to current repo"
echo "    gh claude-search <query>               - Search Claude Code repos"
echo "    gh claude-clone <repo>                 - Clone and setup Claude project"
echo ""
echo "  Development:"
echo "    gh claude-commit <message>             - Commit with Claude attribution"
echo "    gh claude-issue <title> <body>         - Create issue with template"
echo "    gh claude-pr <title> <body>            - Create PR with template"
echo "    gh claude-status                       - Show project status"
echo "    gh claude-deploy                       - Deploy to Cloudflare"
echo ""
echo "  Project Templates:"
echo "    gh claude-init <description>           - Initialize new Claude project"
echo "    gh claude-ext <name>                   - Create extension template"
echo "    gh claude-mcp <name>                   - Create MCP server template"
echo "    gh claude-action                       - Create GitHub Action workflow"
echo "    gh claude-badges                       - Add badges to README"
echo ""
echo "💡 Examples:"
echo "  gh claude-create my-extension \"VS Code extension for Claude\""
echo "  gh claude-commit \"Add dark mode support\""
echo "  gh claude-ext my-awesome-extension"
echo "  gh claude-mcp filesystem-server"
echo ""
echo "🔧 Configuration:"
echo "  These aliases are stored in ~/.config/gh/config.yml"
echo "  You can edit them with: gh alias list"
echo ""

# Create a quick reference card
cat > ~/.claude-gh-reference.md << 'EOF'
# Claude Code GitHub CLI Quick Reference

## 🚀 Quick Start
```bash
# Create new Claude project
gh claude-create my-project "Description here"
cd my-project
gh claude-action  # Setup CI/CD
gh claude-deploy  # Deploy to Cloudflare
```

## 📝 Daily Workflow
```bash
# Check status
gh claude-status

# Make changes and commit
gh claude-commit "Fix authentication bug"

# Create issue
gh claude-issue "Add user profiles" "Need to implement user profile pages"

# Create PR
gh claude-pr "Feature: User profiles" "Implements user profile functionality"
```

## 🛠️ Project Templates
```bash
# Create extension
gh claude-ext my-extension
cd my-extension
bun install

# Create MCP server
gh claude-mcp my-server
cd my-server
bun install
```

## 🔍 Discovery
```bash
# Find Claude projects
gh claude-search "authentication"
gh claude-list

# Clone existing project
gh claude-clone username/repo-name
```

## 📊 Project Management
```bash
# Add Claude badges to README
gh claude-badges

# Add topics for discoverability
gh claude-topics

# Setup GitHub Actions
gh claude-action
```

## 🎨 Customization
Edit aliases: `gh alias list`
Config file: `~/.config/gh/config.yml`

---
Created by Claude Code Extensions Installer
EOF

echo "📄 Quick reference saved to: ~/.claude-gh-reference.md"
echo ""
echo "🔧 Setting up shell aliases for deprecated commands..."

# Migration aliases for deprecated commands
# TODO: Remove these after one major release
echo "# Migration aliases for deprecated cldcde commands" >> ~/.bashrc
echo "# TODO: Remove these after one major release" >> ~/.bashrc
echo "alias cldex='echo \"⚠️ cldex is deprecated ⇒ use cldism\" && cldism \"\$@\"'" >> ~/.bashrc
echo "alias cldlist='echo \"⚠️ cldlist is deprecated ⇒ use cldism-list\" && cldism-list \"\$@\"'" >> ~/.bashrc
echo "alias cldshow='echo \"⚠️ cldshow is deprecated ⇒ use cldism-show\" && cldism-show \"\$@\"'" >> ~/.bashrc

# Also add to zshrc if it exists
if [ -f ~/.zshrc ]; then
    echo "# Migration aliases for deprecated cldcde commands" >> ~/.zshrc
    echo "# TODO: Remove these after one major release" >> ~/.zshrc
    echo "alias cldex='echo \"⚠️ cldex is deprecated ⇒ use cldism\" && cldism \"\$@\"'" >> ~/.zshrc
    echo "alias cldlist='echo \"⚠️ cldlist is deprecated ⇒ use cldism-list\" && cldism-list \"\$@\"'" >> ~/.zshrc
    echo "alias cldshow='echo \"⚠️ cldshow is deprecated ⇒ use cldism-show\" && cldism-show \"\$@\"'" >> ~/.zshrc
fi

echo "Migration aliases added to shell configuration files."
echo ""
echo "🎉 Setup complete! Happy coding with Claude! 🤖"
