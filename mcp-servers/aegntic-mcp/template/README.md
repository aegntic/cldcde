# MCP Server Template

This is a template for creating MCP servers with flexible port handling and enhanced user experience.

## Features

- Automatic port selection (falls back to next available port if default is in use)
- Shows connection URLs for both localhost and network IPs
- Generates QR code for easy mobile connection (when optional dependency is installed)
- Consistent formatting and error handling

## Usage

1. Copy this template directory to start a new MCP server
2. Modify the server.js file to add your MCP methods
3. Update package.json with your server's name and details
4. Update this README.md with documentation for your server

## Port Configuration

By default, the server tries to use port 3000. If this port is already in use, it will automatically find the next available port.

You can specify a different port using the `MCP_PORT` environment variable:

```bash
# Unix/Linux/macOS
export MCP_PORT=3001
npm start

# Windows Command Prompt  
set MCP_PORT=3001
npm start

# Windows PowerShell
$env:MCP_PORT=3001
npm start
```

## Requirements

- Node.js 14 or higher
- mcp-server package (automatically installed with dependencies)
- qrcode-terminal (optional, for QR code generation)

## Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

## License

MIT