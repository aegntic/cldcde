# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Cloudflare Worker)
```bash
bun dev:worker       # Start Worker dev server
wrangler deploy      # Deploy to Cloudflare
```

### Frontend (Website)
```bash
cd website && npm run dev      # Start Vite dev server
cd website && npm run build    # Build for production
```

## Architecture

CLDCDE is a community platform for Claude Code extensions and MCP servers.

```
cldcde-platform/
├── src/                    # Backend
│   └── worker-ultra.ts     # Cloudflare Worker entry point
├── website/                # Frontend (React + Vite + Tailwind)
├── mcp-servers/            # MCP server implementations
└── plugins/                # Plugin ecosystem
```

### Stack
- **Backend**: Cloudflare Workers + Hono
- **Frontend**: React 19 + Vite + Tailwind
- **Entry Point**: `src/worker-ultra.ts`

## Development

1. Backend: `bun dev:worker`
2. Frontend: `cd website && npm run dev`