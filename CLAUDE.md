# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start development server with hot reload
- `bun build` - Build frontend for production
- `bun start` - Run production server
- `bun test` - Run tests
- `bun run dev:worker` - Start Cloudflare Worker development
- `bun run build:worker` - Build Worker for deployment

### Database & Infrastructure
- `bun db:init` - Initialize Neo4j database with schema and sample data
- `bun run db:migrate` - Run D1 database migrations
- `bun run search:index` - Index content for Meilisearch
- `bun run preflight` - Run system preflight checks
- `bun run setup:wizard` - Interactive setup assistant

### Deployment
- `bun run deploy` - Full deployment (frontend + Worker)
- `bun run deploy:pages` - Deploy frontend to Cloudflare Pages
- `bun run secrets:set` - Configure environment secrets

## Architecture

### Multi-Runtime Backend System
CLDCDE uses a **polyglot architecture** with multiple runtime environments:

- **Main Server** (`server.ts`): Hono framework on Bun runtime
- **Edge Workers** (`src/worker.ts`): Cloudflare Workers for global distribution
- **Background Agents** (`src/agents/`): Automated content monitoring and processing
- **Database Layer**: Multi-database approach with graceful fallback

### Database Architecture
- **Neo4j** (`src/db/neo4j.ts`): Primary graph database for complex relationships
  - Graph model: Users ↔ Extensions/MCPs with relationships (CREATED, INSTALLED, RATED)
  - Automatic schema initialization with constraints and indexes
  - Graceful degradation when database unavailable
- **Supabase**: PostgreSQL for structured data and authentication
- **D1 (Cloudflare)**: Edge database for low-latency operations
- **Caching**: Upstash Redis for distributed caching

### API Structure (`src/api/`)
Modular Hono route handlers with consistent patterns:
- **auth.ts**: JWT-based authentication with bcrypt
- **extensions.ts**: Extension marketplace management
- **mcp.ts**: MCP server registry and distribution
- **users.ts**: User profiles and settings
- **featured.ts**: Featured content curation
- **monitoring.ts**: System analytics and health
- **innovation.ts**: AI-powered trend tracking

All routes use:
- Zod validation for type safety
- Consistent error handling
- CORS configuration for multiple origins
- Authentication middleware where required

### Frontend Architecture
**Terminal-Inspired React Application**:
- **Components** (`frontend/src/components/`): Modular UI with terminal aesthetic
  - Theme-aware using styled-components
  - ASCII art headers and monospace fonts
  - Framer Motion for smooth animations
- **Theming** (`frontend/src/styles/themes.ts`): Multiple terminal themes
  - Claude Code Dark (default)
  - Futuristic Monochrome (cyberpunk-inspired)
  - Comprehensive design system with spacing, typography, and colors
- **State Management**: React Context API for auth and theme
- **PWA Support**: Progressive Web App capabilities

### Background Processing (`src/agents/`)
Automated workflows for content management:
- **anthropic-monitor.ts**: Claude API and documentation monitoring
- **github-innovation-tracker.ts**: GitHub trend analysis and innovation tracking
- **blog-generator.ts**: AI-powered content creation
- **cron-handler.ts**: Scheduled task coordination
- **rss-feeds.ts**: Content aggregation from external sources

### Plugin Ecosystem
12+ specialized plugins organized by category:
- **Content Creation**: youtube-creator, youtube-creator-pro, ai-video-recording
- **Streaming**: obs-studio-control
- **Development**: experimental-dev, claude-shortcuts
- **Automation**: viral-automation-suite, various orchestration tools
- **Distribution**: Marketplace with Git-based distribution

## Key Technical Decisions

1. **Bun Runtime**: Native TypeScript, faster execution, built-in bundler
2. **Hono Framework**: Lightweight (<10kb), edge-ready, TypeScript-first
3. **Multi-Database**: Neo4j for relationships, PostgreSQL for structured data, D1 for edge
4. **Cloudflare Workers**: Global edge distribution with minimal latency
5. **Graph Database**: Natural fit for user-extension relationships and social features
6. **Terminal UI**: Unique aesthetic targeting developer audience
7. **AI-Enhanced**: Automated content curation and trend analysis

## Development Workflow

### Environment Setup
1. Install Bun runtime
2. Configure Neo4j locally or use cloud instance
3. Set up Supabase project for auth and PostgreSQL
4. Configure Cloudflare account for Workers deployment
5. Copy `.env.example` to `.env` and configure variables

### Development Process
1. `bun dev` starts main server with hot reload
2. Frontend changes use Bun's built-in bundler with HMR
3. `bun run dev:worker` for Worker development
4. All API endpoints return JSON with consistent error format
5. Database operations handle connection failures gracefully
6. Use `bun run preflight` to validate setup before deployment

### Code Patterns
- **Type Safety**: Zod schemas for all API inputs/outputs
- **Error Handling**: Consistent error responses with proper HTTP codes
- **Caching Strategy**: Multi-layer caching with intelligent invalidation
- **Database Transactions**: Use `runTransaction()` for complex operations
- **Authentication**: JWT middleware with role-based access control

## Important Files

### Core Application
- `server.ts`: Main Hono server with middleware and routes
- `src/worker.ts`: Cloudflare Worker for edge deployment
- `src/db/neo4j.ts`: Neo4j connection management and utilities

### API Layer
- `src/api/*.ts`: Route handlers following consistent patterns
- `src/db/queries.ts`: Reusable Cypher query functions

### Frontend
- `frontend/src/App.tsx`: Main React application with routing
- `frontend/src/components/`: Reusable terminal-themed components
- `frontend/src/styles/themes.ts`: Complete design system

### Background Processing
- `src/agents/*.ts`: Automated content monitoring and processing
- `scripts/`: Build, deployment, and maintenance utilities

## Performance & Security

### Performance Optimizations
- Global CDN via Cloudflare
- Multi-layer caching (Edge, Redis, Browser)
- Database connection pooling
- Lazy loading for frontend components
- Optimized bundle splitting

### Security Measures
- JWT token management with secure expiration
- Input validation on all endpoints
- CORS configuration for approved origins
- Rate limiting and abuse prevention
- Environment-based secrets management