# Docker Usage Guide for n8n-mcp

## Running in HTTP Mode

The n8n-mcp Docker container can be run in HTTP mode using several methods:

### Method 1: Using Environment Variables (Recommended)

```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-secure-token-here \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Method 2: Using docker-compose

```bash
# Create a .env file
cat > .env << EOF
MCP_MODE=http
AUTH_TOKEN=your-secure-token-here
PORT=3000
EOF

# Run with docker-compose
docker-compose up -d
```

### Method 3: Using a Configuration File

Create a `config.json` file:
```json
{
  "MCP_MODE": "http",
  "AUTH_TOKEN": "your-secure-token-here",
  "PORT": "3000",
  "LOG_LEVEL": "info"
}
```

Run with the config file:
```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -v $(pwd)/config.json:/app/config.json:ro \
  ghcr.io/czlonkowski/n8n-mcp:latest
```

### Method 4: Using the n8n-mcp serve Command

```bash
docker run -d -p 3000:3000 \
  --name n8n-mcp-server \
  -e AUTH_TOKEN=your-secure-token-here \
  ghcr.io/czlonkowski/n8n-mcp:latest \
  n8n-mcp serve
```

## Important Notes

1. **AUTH_TOKEN is required** for HTTP mode. Generate a secure token:
   ```bash
   openssl rand -base64 32
   ```

2. **Environment variables take precedence** over config file values

3. **Default mode is stdio** if MCP_MODE is not specified

4. **Health check endpoint** is available at `http://localhost:3000/health`

## Troubleshooting

### Container exits immediately
- Check logs: `docker logs n8n-mcp-server`
- Ensure AUTH_TOKEN is set for HTTP mode

### "n8n-mcp: not found" error
- This has been fixed in the latest version
- Use the full command: `node /app/dist/mcp/index.js` as a workaround

### Config file not working
- Ensure the file is valid JSON
- Mount as read-only: `-v $(pwd)/config.json:/app/config.json:ro`
- Check that the config parser is present: `docker exec n8n-mcp-server ls -la /app/docker/`