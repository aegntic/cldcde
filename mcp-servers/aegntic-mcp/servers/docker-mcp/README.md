# Docker MCP Server

A comprehensive MCP server for Docker container and image management with Docker Hub integration.

## Features

- Container lifecycle management (create/start/stop/remove)
- Image operations (build/pull/push/inspect)
- Docker Compose support
- Swarm mode management
- Docker Hub integration
- Advanced monitoring and logging

## Installation

```bash
npm install
```

## Configuration

Set environment variables in `.env` file:

```ini
DOCKER_HOST=unix:///var/run/docker.sock
DOCKER_HUB_USERNAME=your_username
DOCKER_HUB_PASSWORD=your_password
PORT=3000
```

## API Endpoints

### Containers
- `GET /containers` - List all containers
- `POST /containers/:id/start` - Start container
- `POST /containers/:id/stop` - Stop container
- `DELETE /containers/:id` - Remove container

### Images
- `GET /images` - List all images
- `POST /images/pull` - Pull image from registry
- `POST /images/push` - Push image to registry
- `POST /images/build` - Build image from Dockerfile

### Docker Compose
- `POST /compose/up` - Run docker-compose up
- `POST /compose/down` - Run docker-compose down

## Usage Examples

```bash
# Start server
npm start

# List containers
curl http://localhost:3000/containers

# Stop container
curl -X POST http://localhost:3000/containers/abc123/stop
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## License

MIT
