# CLDCDE - Claude Code Development Environment

The community platform for Claude Code extensions and resources.

🌐 **Live Platform**: [https://cldcde.cc](https://cldcde.cc)

## 🎯 CLDCDE Ecosystem

This project is the backend for the **CLDCDE.CC Platform**, a community hub for Claude Code extensions, MCP servers, and resources.

### Core Features
- **Extension & MCP Browser**: Search, discover, and install tools
- **News & Updates**: Latest from Anthropic and community innovations
- **Documentation Hub**: Curated guides and resources
- **User Profiles**: Share extensions and track contributions

### Technology Stack
- **Frontend**: React + TypeScript on Cloudflare Pages (in a separate repository)
- **Backend**: Hono + Cloudflare Workers + Supabase
- **Runtime**: Bun for faster development
- **Database**: Supabase (PostgreSQL + Auth)

## 🏗️ Development

### Prerequisites
- [Bun](https://bun.sh) runtime
- A Cloudflare account
- A Supabase project

### Environment Setup
```bash
# Clone repository
git clone https://github.com/iamcatface/cldcde-platform.git
cd cldcde-platform

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Cloudflare credentials
```

### Development Commands
```bash
# Run the development server
bun run dev:worker

# Deploy to Cloudflare
wrangler deploy
```