# Docker Troubleshooting Guide

This guide helps resolve common issues when running n8n-mcp with Docker, especially when connecting to n8n instances.

## Table of Contents
- [Common Issues](#common-issues)
  - [502 Bad Gateway Errors](#502-bad-gateway-errors)
  - [Custom Database Path Not Working](#custom-database-path-not-working-v27160)
  - [Container Name Conflicts](#container-name-conflicts)
  - [n8n API Connection Issues](#n8n-api-connection-issues)
- [Docker Networking](#docker-networking)
- [Quick Solutions](#quick-solutions)
- [Debugging Steps](#debugging-steps)

## Common Issues

### Docker Configuration File Not Working (v2.8.2+)

**Symptoms:**
- Config file mounted but environment variables not set
- Container starts but ignores configuration
- Getting "permission denied" errors

**Solutions:**

1. **Ensure file is mounted correctly:**
```bash
# Correct - mount as read-only
docker run -v $(pwd)/config.json:/app/config.json:ro ...

# Check if file is accessible
docker exec n8n-mcp cat /app/config.json
```

2. **Verify JSON syntax:**
```bash
# Validate JSON file
cat config.json | jq .
```

3. **Check Docker logs for parsing errors:**
```bash
docker logs n8n-mcp | grep -i config
```

4. **Common issues:**
- Invalid JSON syntax (use a JSON validator)
- File permissions (should be readable)
- Wrong mount path (must be `/app/config.json`)
- Dangerous variables blocked (PATH, LD_PRELOAD, etc.)

### Custom Database Path Not Working (v2.7.16+)

**Symptoms:**
- `NODE_DB_PATH` environment variable is set but ignored
- Database always created at `/app/data/nodes.db`
- Custom path setting has no effect

**Root Cause:** Fixed in v2.7.16. Earlier versions had hardcoded paths in docker-entrypoint.sh.

**Solutions:**

1. **Update to v2.7.16 or later:**
```bash
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
```

2. **Ensure path ends with .db:**
```bash
# Correct
NODE_DB_PATH=/app/data/custom/my-nodes.db

# Incorrect (will be rejected)
NODE_DB_PATH=/app/data/custom/my-nodes
```

3. **Use path within mounted volume for persistence:**
```yaml
services:
  n8n-mcp:
    environment:
      NODE_DB_PATH: /app/data/custom/nodes.db
    volumes:
      - n8n-mcp-data:/app/data  # Ensure parent directory is mounted
```

### 502 Bad Gateway Errors

**Symptoms:**
- `n8n_health_check` returns 502 error
- All n8n management API calls fail
- n8n web UI is accessible but API is not

**Root Cause:** Network connectivity issues between n8n-mcp container and n8n instance.

**Solutions:**

#### 1. When n8n runs in Docker on same machine

Use Docker's special hostnames instead of `localhost`:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "N8N_API_URL=http://host.docker.internal:5678",
        "-e", "N8N_API_KEY=your-api-key",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

**Alternative hostnames to try:**
- `host.docker.internal` (Docker Desktop on macOS/Windows)
- `172.17.0.1` (Default Docker bridge IP on Linux)
- Your machine's actual IP address (e.g., `192.168.1.100`)

#### 2. When both containers are in same Docker network

```bash
# Create a shared network
docker network create n8n-network

# Run n8n in the network
docker run -d --name n8n --network n8n-network -p 5678:5678 n8nio/n8n

# Configure n8n-mcp to use container name
```

```json
{
  "N8N_API_URL": "http://n8n:5678"
}
```

#### 3. For Docker Compose setups

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    networks:
      - n8n-net
    ports:
      - "5678:5678"
  
  n8n-mcp:
    image: ghcr.io/czlonkowski/n8n-mcp:latest
    environment:
      N8N_API_URL: http://n8n:5678
      N8N_API_KEY: ${N8N_API_KEY}
    networks:
      - n8n-net

networks:
  n8n-net:
    driver: bridge
```

### Container Cleanup Issues (Fixed in v2.7.20+)

**Symptoms:**
- Containers accumulate after Claude Desktop restarts
- Containers show as "unhealthy" but don't clean up
- `--rm` flag doesn't work as expected

**Root Cause:** Fixed in v2.7.20 - containers weren't handling termination signals properly.

**Solutions:**

1. **Update to v2.7.20+ and use --init flag (Recommended):**
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm", "--init",
    "ghcr.io/czlonkowski/n8n-mcp:latest"
  ]
}
```

2. **Manual cleanup of old containers:**
```bash
# Remove all stopped n8n-mcp containers
docker ps -a | grep n8n-mcp | grep Exited | awk '{print $1}' | xargs -r docker rm
```

3. **For versions before 2.7.20:**
- Manually clean up containers periodically
- Consider using HTTP mode instead

### n8n API Connection Issues

**Symptoms:**
- API calls fail but n8n web UI works
- Authentication errors
- API endpoints return 404

**Solutions:**

1. **Verify n8n API is enabled:**
   - Check n8n settings → REST API is enabled
   - Ensure API key is valid and not expired

2. **Test API directly:**
```bash
# From host machine
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows

# From inside Docker container
docker run --rm curlimages/curl \
  -H "X-N8N-API-KEY: your-key" \
  http://host.docker.internal:5678/api/v1/workflows
```

3. **Check n8n environment variables:**
```yaml
environment:
  - N8N_BASIC_AUTH_ACTIVE=true
  - N8N_BASIC_AUTH_USER=user
  - N8N_BASIC_AUTH_PASSWORD=password
```

## Docker Networking

### Understanding Docker Network Modes

| Scenario | Use This URL | Why |
|----------|--------------|-----|
| n8n on host, n8n-mcp in Docker | `http://host.docker.internal:5678` | Docker can't reach host's localhost |
| Both in same Docker network | `http://container-name:5678` | Direct container-to-container |
| n8n behind reverse proxy | `http://your-domain.com` | Use public URL |
| Local development | `http://YOUR_LOCAL_IP:5678` | Use machine's IP address |

### Finding Your Configuration

```bash
# Check if n8n is running in Docker
docker ps | grep n8n

# Find Docker network
docker network ls

# Get container details
docker inspect n8n | grep NetworkMode

# Find your local IP
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

## Quick Solutions

### Solution 1: Use Host Network (Linux only)
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "--network", "host",
    "-e", "N8N_API_URL=http://localhost:5678",
    "ghcr.io/czlonkowski/n8n-mcp:latest"
  ]
}
```

### Solution 2: Use Your Machine's IP
```json
{
  "N8N_API_URL": "http://192.168.1.100:5678"  // Replace with your IP
}
```

### Solution 3: HTTP Mode Deployment
Deploy n8n-mcp as HTTP server to avoid stdio/Docker issues:

```bash
# Start HTTP server
docker run -d \
  -p 3000:3000 \
  -e MCP_MODE=http \
  -e AUTH_TOKEN=your-token \
  -e N8N_API_URL=http://host.docker.internal:5678 \
  -e N8N_API_KEY=your-n8n-key \
  ghcr.io/czlonkowski/n8n-mcp:latest

# Configure Claude with mcp-remote
```

## Debugging Steps

### 1. Enable Debug Logging
```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "DEBUG_MCP": "true"
  }
}
```

### 2. Test Connectivity
```bash
# Test from n8n-mcp container
docker run --rm ghcr.io/czlonkowski/n8n-mcp:latest \
  sh -c "apk add curl && curl -v http://host.docker.internal:5678/api/v1/workflows"
```

### 3. Check Docker Logs
```bash
# View n8n-mcp logs
docker logs $(docker ps -q -f ancestor=ghcr.io/czlonkowski/n8n-mcp:latest)

# View n8n logs
docker logs n8n
```

### 4. Validate Environment
```bash
# Check what n8n-mcp sees
docker run --rm ghcr.io/czlonkowski/n8n-mcp:latest \
  sh -c "env | grep N8N"
```

### 5. Network Diagnostics
```bash
# Check Docker networks
docker network inspect bridge

# Test DNS resolution
docker run --rm busybox nslookup host.docker.internal
```

## Platform-Specific Notes

### Docker Desktop (macOS/Windows)
- `host.docker.internal` works out of the box
- Ensure Docker Desktop is running
- Check Docker Desktop settings → Resources → Network

### Linux
- `host.docker.internal` requires Docker 20.10+
- Alternative: Use `--add-host=host.docker.internal:host-gateway`
- Or use the Docker bridge IP: `172.17.0.1`

### Windows with WSL2
- Use `host.docker.internal` or WSL2 IP
- Check firewall rules for port 5678
- Ensure n8n binds to `0.0.0.0` not `127.0.0.1`

## Still Having Issues?

1. **Check n8n logs** for API-related errors
2. **Verify firewall/security** isn't blocking connections
3. **Try simpler setup** - Run n8n-mcp on host instead of Docker
4. **Report issue** with debug logs at [GitHub Issues](https://github.com/czlonkowski/n8n-mcp/issues)

## Useful Commands

```bash
# Remove all n8n-mcp containers
docker rm -f $(docker ps -aq -f ancestor=ghcr.io/czlonkowski/n8n-mcp:latest)

# Test n8n API with curl
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows

# Run interactive debug session
docker run -it --rm \
  -e LOG_LEVEL=debug \
  -e N8N_API_URL=http://host.docker.internal:5678 \
  -e N8N_API_KEY=your-key \
  ghcr.io/czlonkowski/n8n-mcp:latest \
  sh

# Check container networking
docker run --rm alpine ping -c 4 host.docker.internal
```