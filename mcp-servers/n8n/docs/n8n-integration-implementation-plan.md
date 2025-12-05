# n8n MCP Client Tool Integration - Implementation Plan (Simplified)

## Overview

This document provides a **simplified** implementation plan for making n8n-mcp compatible with n8n's MCP Client Tool (v1.1). Based on expert review, we're taking a minimal approach that extends the existing single-session server rather than creating new architecture.

## Key Design Principles

1. **Minimal Changes**: Extend existing single-session server with n8n compatibility mode
2. **No Overengineering**: No complex session management or multi-session architecture
3. **Docker-Native**: Separate Docker image for n8n deployment
4. **Remote Deployment**: Designed to run alongside n8n in production
5. **Backward Compatible**: Existing functionality remains unchanged

## Prerequisites

- Docker and Docker Compose
- n8n version 1.104.2 or higher (with MCP Client Tool v1.1)
- Basic understanding of Docker networking

## Implementation Approach

Instead of creating new multi-session architecture, we'll extend the existing single-session server with an n8n compatibility mode. This approach was recommended by all three expert reviewers as simpler and more maintainable.

## Architecture Changes

```
src/
├── http-server-single-session.ts  # MODIFY: Add n8n mode flag
└── mcp/
    └── server.ts                  # NO CHANGES NEEDED

Docker/
├── Dockerfile.n8n                 # NEW: n8n-specific image
├── docker-compose.n8n.yml         # NEW: Simplified stack
└── .github/workflows/
    └── docker-build-n8n.yml       # NEW: Build workflow
```

## Implementation Steps

### Step 1: Modify Existing Single-Session Server

#### 1.1 Update `src/http-server-single-session.ts`

Add n8n compatibility mode to the existing server with minimal changes:

```typescript
// Add these constants at the top (after imports)
const PROTOCOL_VERSION = "2024-11-05";
const N8N_MODE = process.env.N8N_MODE === 'true';

// In the constructor or start method, add logging
if (N8N_MODE) {
  logger.info('Running in n8n compatibility mode');
}

// In setupRoutes method, add the protocol version endpoint
if (N8N_MODE) {
  app.get('/mcp', (req, res) => {
    res.json({
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: {
        name: "n8n-mcp",
        version: PROJECT_VERSION,
        capabilities: {
          tools: true,
          resources: false,
          prompts: false,
        },
      },
    });
  });
}

// In handleMCPRequest method, add session header
if (N8N_MODE && this.session) {
  res.setHeader('Mcp-Session-Id', this.session.sessionId);
}

// Update error handling to use JSON-RPC format
catch (error) {
  logger.error('MCP request error:', error);
  
  if (N8N_MODE) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
      id: null,
    });
  } else {
    // Keep existing error handling for backward compatibility
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

That's it! No new files, no complex session management. Just a few lines of code.

### Step 2: Update Package Scripts

#### 2.1 Update `package.json`

Add a simple script for n8n mode:

```json
{
  "scripts": {
    "start:n8n": "N8N_MODE=true MCP_MODE=http node dist/mcp/index.js"
  }
}
```

### Step 3: Create Docker Infrastructure for n8n

#### 3.1 Create `Dockerfile.n8n`

```dockerfile
# Dockerfile.n8n - Optimized for n8n integration
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json tsconfig*.json ./

# Install ALL dependencies
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY src ./src
RUN npm run build && npm run rebuild

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/data ./data
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

EXPOSE 3001

HEALTHCHECK CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/mcp/index.js"]
```

#### 3.2 Create `docker-compose.n8n.yml`

```yaml
# docker-compose.n8n.yml - Simple stack for n8n + n8n-mcp
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE:-true}
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-changeme}
      - N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n-net
    depends_on:
      n8n-mcp:
        condition: service_healthy

  n8n-mcp:
    image: ghcr.io/${GITHUB_USER:-czlonkowski}/n8n-mcp-n8n:latest
    build:
      context: .
      dockerfile: Dockerfile.n8n
    container_name: n8n-mcp
    restart: unless-stopped
    environment:
      - MCP_MODE=http
      - N8N_MODE=true
      - AUTH_TOKEN=${MCP_AUTH_TOKEN}
      - NODE_ENV=production
      - HTTP_PORT=3001
    networks:
      - n8n-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  n8n-net:
    driver: bridge

volumes:
  n8n_data:
```

#### 3.3 Create `.env.n8n.example`

```bash
# .env.n8n.example - Copy to .env and configure

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=changeme
N8N_BASIC_AUTH_ACTIVE=true

# MCP Configuration
# Generate with: openssl rand -base64 32
MCP_AUTH_TOKEN=your-secure-token-minimum-32-characters

# GitHub username for image registry
GITHUB_USER=czlonkowski
```

### Step 4: Create GitHub Actions Workflow

#### 4.1 Create `.github/workflows/docker-build-n8n.yml`

```yaml
name: Build n8n Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']
    paths:
      - 'src/**'
      - 'package*.json'
      - 'Dockerfile.n8n'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-n8n

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      
    steps:
      - uses: actions/checkout@v4
      
      - uses: docker/setup-buildx-action@v3
      
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}
            
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.n8n
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Step 5: Testing

#### 5.1 Unit Tests for n8n Mode

Create `tests/unit/http-server-n8n-mode.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

describe('n8n Mode', () => {
  it('should return protocol version on GET /mcp', async () => {
    process.env.N8N_MODE = 'true';
    const app = await createTestApp();
    
    const response = await request(app)
      .get('/mcp')
      .expect(200);
    
    expect(response.body.protocolVersion).toBe('2024-11-05');
    expect(response.body.serverInfo.capabilities.tools).toBe(true);
  });
  
  it('should include session ID in response headers', async () => {
    process.env.N8N_MODE = 'true';
    const app = await createTestApp();
    
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer test-token')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1 });
    
    expect(response.headers['mcp-session-id']).toBeDefined();
  });
  
  it('should format errors as JSON-RPC', async () => {
    process.env.N8N_MODE = 'true';
    const app = await createTestApp();
    
    const response = await request(app)
      .post('/mcp')
      .send({ invalid: 'request' })
      .expect(500);
    
    expect(response.body.jsonrpc).toBe('2.0');
    expect(response.body.error.code).toBe(-32603);
  });
});
```

#### 5.2 Quick Deployment Script

Create `deploy/quick-deploy-n8n.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Quick Deploy n8n + n8n-mcp"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Generate auth token if not exists
if [ ! -f .env ]; then
  cp .env.n8n.example .env
  TOKEN=$(openssl rand -base64 32)
  sed -i "s/your-secure-token-minimum-32-characters/$TOKEN/" .env
  echo "Generated MCP_AUTH_TOKEN: $TOKEN"
fi

# Deploy
docker-compose -f docker-compose.n8n.yml up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Access n8n at http://localhost:5678"
echo "   Username: admin (or check .env)"
echo "   Password: changeme (or check .env)"
echo ""
echo "2. Create a workflow with MCP Client Tool:"
echo "   - Server URL: http://n8n-mcp:3001/mcp"
echo "   - Authentication: Bearer Token"
echo "   - Token: Check .env file for MCP_AUTH_TOKEN"
echo ""
echo "📊 View logs: docker-compose -f docker-compose.n8n.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.n8n.yml down"
```

## Implementation Checklist (Simplified)

### Code Changes
- [ ] Add N8N_MODE flag to `http-server-single-session.ts`
- [ ] Add protocol version endpoint (GET /mcp) when N8N_MODE=true
- [ ] Add Mcp-Session-Id header to responses
- [ ] Update error responses to JSON-RPC format when N8N_MODE=true
- [ ] Add npm script `start:n8n` to package.json

### Docker Infrastructure
- [ ] Create `Dockerfile.n8n` for n8n-specific image
- [ ] Create `docker-compose.n8n.yml` for simple deployment
- [ ] Create `.env.n8n.example` template
- [ ] Create GitHub Actions workflow `docker-build-n8n.yml`
- [ ] Create `deploy/quick-deploy-n8n.sh` script

### Testing
- [ ] Write unit tests for n8n mode functionality
- [ ] Test with actual n8n MCP Client Tool
- [ ] Verify protocol version endpoint
- [ ] Test authentication flow
- [ ] Validate error formatting

### Documentation
- [ ] Update README with n8n deployment section
- [ ] Document N8N_MODE environment variable
- [ ] Add troubleshooting guide for common issues

## Quick Start Guide

### 1. One-Command Deployment

```bash
# Clone and deploy
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
./deploy/quick-deploy-n8n.sh
```

### 2. Manual Configuration in n8n

After deployment, configure the MCP Client Tool in n8n:

1. Open n8n at `http://localhost:5678`
2. Create a new workflow
3. Add "MCP Client Tool" node (under AI category)
4. Configure:
   - **Server URL**: `http://n8n-mcp:3001/mcp`
   - **Authentication**: Bearer Token
   - **Token**: Check your `.env` file for MCP_AUTH_TOKEN
5. Select a tool (e.g., `list_nodes`)
6. Execute the workflow

### 3. Production Deployment

For production with SSL, use a reverse proxy:

```nginx
# nginx configuration
server {
    listen 443 ssl;
    server_name n8n.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The MCP server should remain internal only - n8n connects via Docker network.

## Success Criteria

The implementation is successful when:

1. **Minimal Code Changes**: Only ~20 lines added to existing server
2. **Protocol Compliance**: GET /mcp returns correct protocol version
3. **n8n Connection**: MCP Client Tool connects successfully
4. **Tool Execution**: Tools work without modification
5. **Backward Compatible**: Existing Claude Desktop usage unaffected

## Troubleshooting

### Common Issues

1. **"Protocol version mismatch"**
   - Ensure N8N_MODE=true is set
   - Check GET /mcp returns "2024-11-05"

2. **"Authentication failed"**
   - Verify AUTH_TOKEN matches in .env and n8n
   - Token must be 32+ characters
   - Use "Bearer Token" auth type in n8n

3. **"Connection refused"**
   - Check containers are on same network
   - Use internal hostname: `http://n8n-mcp:3001/mcp`
   - Verify health check passes

4. **Testing the Setup**
   ```bash
   # Check protocol version
   docker exec n8n-mcp curl http://localhost:3001/mcp
   
   # View logs
   docker-compose -f docker-compose.n8n.yml logs -f n8n-mcp
   ```

## Summary

This simplified approach:
- **Extends existing code** rather than creating new architecture
- **Adds n8n compatibility** with minimal changes
- **Uses separate Docker image** for clean deployment
- **Maintains backward compatibility** for existing users
- **Avoids overengineering** with simple, practical solutions

Total implementation effort: ~2-3 hours (vs. 2-3 days for multi-session approach)