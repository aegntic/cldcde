# 🚀 cldcde.cc - Community Extensions for Claude Code

A modern platform for discovering, sharing, and managing Claude Code extensions and MCP servers. Built with a serverless-first architecture on Cloudflare Workers and Supabase.

🌐 **Live Site**: [https://cldcde.cc](https://cldcde.cc)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aegntic/cldcde)

## 🚀 Overview

CLDCDE.CC is a community-driven platform that serves as the central hub for:
- **Claude Code Extensions**: Browse, discover, and share extensions
- **MCP Servers**: Find and integrate Model Context Protocol servers
- **News & Updates**: Latest announcements from Anthropic and community innovations
- **Resources & Documentation**: Curated links to essential repositories and guides

## 🏗️ Architecture

### Ultra-Simplified Stack (2 Services)
- **Frontend**: Cloudflare Pages (React + TypeScript)
- **Backend**: Cloudflare Workers + Supabase

### Technology Stack
- **Runtime**: Bun
- **Framework**: Hono (backend), React (frontend)
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: styled-components with terminal-inspired themes
- **AI Integration**: OpenRouter for content generation
- **Deployment**: Cloudflare (Workers + Pages)

## 🎨 Features

### 1. Extension & MCP Browser
- Search and filter extensions/MCP servers
- User ratings and reviews
- Installation instructions
- Verified publisher badges

### 2. User System
- Supabase Authentication
- Profile customization with avatars
- Username selection post-registration
- Mailing list preferences

### 3. Theme System
- **Claude Code Dark**: Default dark theme
- **Claude Light**: Matches Claude.ai's exact color palette
- **Futuristic Monochrome**: Cyberpunk-inspired theme

### 4. News & Updates
- Featured articles (OpenRouter deep dive)
- Anthropic announcements monitoring
- Community innovations tracking
- Tag-based filtering

### 5. Documentation Hub
- Official Claude Code resources
- Community repositories
- Developer tools and SDKs
- Quick-start guides

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh) runtime
- Cloudflare account
- Supabase project

### Environment Variables
Create `.env` file:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# OpenRouter (for AI features)
OPENROUTER_API_KEY=your_openrouter_key

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Local Development
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build frontend
bun run build

# Deploy to Cloudflare
bun run deploy:pages  # Frontend
bunx wrangler deploy  # Backend
```

### Project Structure
```
cldcde-cc/
├── src/                    # Backend source
│   ├── api/               # API routes
│   ├── db/                # Database connections
│   ├── agents/            # News monitoring agents
│   └── worker-ultra.ts    # Main worker entry
├── frontend/              # Frontend source
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/        # Theme definitions
│   │   └── hooks/         # Custom hooks
│   └── dist/              # Build output
├── supabase/              # Database schemas
└── content/               # Static content
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Extensions
- `GET /api/extensions` - List extensions
- `GET /api/extensions/:id` - Get extension details
- `POST /api/extensions` - Create extension (auth required)

### MCP Servers
- `GET /api/mcp` - List MCP servers
- `GET /api/mcp/:id` - Get server details

### Users
- `GET /api/users/check-username` - Check username availability
- `PUT /api/users/profile` - Update user profile

## 🎯 Key Design Decisions

1. **Two-Service Architecture**: Simplified to just Cloudflare + Supabase
2. **Bun Runtime**: Faster than Node.js with native TypeScript
3. **Terminal Aesthetic**: Consistent retro-futuristic design language
4. **OpenRouter Integration**: Cost-effective AI with free tier models
5. **NODELAY ASCII Font**: Custom font implementation for branding

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run migrations from `supabase/schema.sql`
3. Enable email authentication
4. Configure RLS policies as needed

### Cloudflare Setup
1. Create a Workers account
2. Create a Pages project
3. Configure custom domain
4. Set environment variables

## 🚦 Deployment

### Frontend (Cloudflare Pages)
```bash
bun run build
bun run deploy:pages
```

### Backend (Cloudflare Workers)
```bash
bunx wrangler deploy
```

### Database Migrations
```bash
# Apply schema to Supabase
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
```

## 📊 Monitoring

- Health check: `GET /health`
- API info: `GET /api`
- Metrics: Disabled by default (can be enabled with monitoring endpoints)

## 🤝 Contributing

This is a community project! Contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

### Areas for Contribution
- New themes
- Extension/MCP server submissions
- News aggregation improvements
- Documentation updates
- Bug fixes

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Anthropic for Claude and Claude Code
- OpenRouter for LLM infrastructure
- Cloudflare for hosting
- Supabase for backend services
- The Claude Code community

---

Built with ❤️ by the Claude Code community