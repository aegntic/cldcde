# Claude Code Setup

Connect n8n-MCP to Claude Code CLI for enhanced n8n workflow development from the command line.

## Quick Setup via CLI

### Basic configuration (documentation tools only):
```bash
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -- npx n8n-mcp
```

![Adding n8n-MCP server in Claude Code](./img/cc_command.png)

### Full configuration (with n8n management tools):
```bash
claude mcp add n8n-mcp \
  -e MCP_MODE=stdio \
  -e LOG_LEVEL=error \
  -e DISABLE_CONSOLE_OUTPUT=true \
  -e N8N_API_URL=https://your-n8n-instance.com \
  -e N8N_API_KEY=your-api-key \
  -- npx n8n-mcp
```

Make sure to replace `https://your-n8n-instance.com` with your actual n8n URL and `your-api-key` with your n8n API key.

## Alternative Setup Methods

### Option 1: Import from Claude Desktop

If you already have n8n-MCP configured in Claude Desktop:
```bash
claude mcp add-from-claude-desktop
```

### Option 2: Project Configuration

For team sharing, add to `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

Then use with scope flag:
```bash
claude mcp add n8n-mcp --scope project
```

## Managing Your MCP Server

Check server status:
```bash
claude mcp list
claude mcp get n8n-mcp
```

During a conversation, use the `/mcp` command to see server status and available tools.

![n8n-MCP connected and showing 39 tools available](./img/cc_connected.png)

Remove the server:
```bash
claude mcp remove n8n-mcp
```

## Project Instructions

For optimal results, create a `CLAUDE.md` file in your project root with the instructions from the [main README's Claude Project Setup section](../README.md#-claude-project-setup).

## Tips

- If you're running n8n locally, use `http://localhost:5678` as the N8N_API_URL
- The n8n API credentials are optional - without them, you'll have documentation and validation tools only
- With API credentials, you'll get full workflow management capabilities
- Use `--scope local` (default) to keep your API credentials private
- Use `--scope project` to share configuration with your team (put credentials in environment variables)
- Claude Code will automatically start the MCP server when you begin a conversation
