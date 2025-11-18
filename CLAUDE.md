# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start development server with hot reload
- `bun build` - Build frontend for production
- `bun start` - Run production server
- `bun test` - Run tests (no tests implemented yet)

### Database
- Neo4j must be running locally or configured via environment variables
- Database initialization: Create constraints and sample data by running queries in `src/db/neo4j.ts`

## Architecture

### Backend Structure
The backend uses Hono framework on Bun runtime with a modular API design:

- **API Routes** (`src/api/`): Each module exports route handlers
  - Auth endpoints handle JWT-based authentication
  - Extensions and MCP endpoints manage platform resources
  - All routes use Zod for validation

- **Database** (`src/db/neo4j.ts`): Neo4j graph database
  - Graph model: Users -> Extensions/MCPs with relationships (CREATED, INSTALLED, RATED)
  - Connection pool management with graceful fallback
  - Cypher queries for all database operations

- **Authentication** (`src/auth/`): JWT tokens with bcrypt password hashing
  - Middleware in `server.ts` protects routes
  - Token verification for protected endpoints

### Frontend Structure
React application with terminal-inspired UI:

- **Components** (`frontend/src/components/`): Modular React components
  - Theme-aware components using styled-components
  - Terminal aesthetic with ASCII art and monospace fonts

- **Theming** (`frontend/src/styles/themes.ts`): Multiple terminal themes
  - Theme context provider for global theme management
  - Themes: Default, Dracula, Monokai, Solarized, Nord, Gruvbox

- **State Management**: React Context API for auth and theme state

### Key Technical Decisions
1. **Bun over Node.js**: Faster runtime with built-in TypeScript support
2. **Hono over Express**: Lightweight, edge-ready framework
3. **Neo4j over SQL**: Graph relationships perfect for user-extension connections
4. **styled-components**: Dynamic theming with CSS-in-JS
5. **Zod validation**: Type-safe runtime validation for APIs

### Development Workflow
1. Backend changes require server restart (automatic with `bun dev`)
2. Frontend uses Bun's built-in bundler with hot module replacement
3. All API endpoints return JSON with consistent error handling
4. Database queries should handle connection failures gracefully

### Important Files
- `server.ts`: Main server entry point with middleware setup
- `src/api/*`: API route handlers
- `src/db/neo4j.ts`: Database connection and query functions
- `frontend/src/App.tsx`: Main React application
- `frontend/src/components/`: UI components