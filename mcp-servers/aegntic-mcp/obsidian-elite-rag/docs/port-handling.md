# MCP Server Port Handling

This document provides guidance on how port handling works in Aegntic MCP servers and how to customize the port settings.

## Flexible Port Selection

All Aegntic MCP servers now come with flexible port selection:

1. By default, the server will try to use port 3000
2. If port 3000 is in use, the server will automatically find the next available port
3. The server will display all usable URLs including localhost and network IP addresses
4. For mobile access, a QR code is provided when possible

## Configuring the Port

You can configure the port in several ways:

### Environment Variable

Set the `MCP_PORT` environment variable to your preferred port:

```bash
# Unix/Linux/macOS
export MCP_PORT=3001
npx @aegntic/firebase-studio-mcp

# Windows Command Prompt
set MCP_PORT=3001
npx @aegntic/firebase-studio-mcp

# Windows PowerShell
$env:MCP_PORT=3001
npx @aegntic/firebase-studio-mcp
```

### Command Line Argument (if implemented)

Some MCP servers may support a command-line argument for port configuration:

```bash
npx @aegntic/firebase-studio-mcp --port 3001
```

### Configuration File (if implemented)

Some MCP servers may support a configuration file where you can set the port:

```json
{
  "port": 3001
}
```

## Port Selection Process

The port selection process follows these steps:

1. Check if a port is specified via environment variable, command line, or config file
2. If not specified, use the default port (usually 3000)
3. Test if the preferred port is available
4. If the preferred port is unavailable, increment and try the next port
5. Continue until an available port is found
6. Start the server on the available port

## Connection Issues

If you're having trouble connecting to the MCP server:

1. Check the console output for the actual port being used
2. Make sure no firewall is blocking the connection
3. When connecting from another device, make sure both devices are on the same network
4. For mobile scanning, ensure the QR code is fully visible and properly scanned

## For MCP Server Developers

If you're developing an MCP server, here's how to implement flexible port handling:

1. Use the `port-utils.js` module to find an available port
2. Accept port configuration via environment variable, command line, and/or config file
3. Provide clear feedback about which port is ultimately used
4. Show multiple connection URLs for different scenarios
5. Handle connection errors gracefully with user-friendly messages