# Windsurf Setup

Connect n8n-MCP to Windsurf IDE for enhanced n8n workflow development with AI assistance.

[![n8n-mcp Windsurf Setup Tutorial](./img/windsurf_tut.png)](https://www.youtube.com/watch?v=klxxT1__izg)

## Video Tutorial

Watch the complete setup process: [n8n-MCP Windsurf Setup Tutorial](https://www.youtube.com/watch?v=klxxT1__izg)

## Setup Process

### 1. Access MCP Configuration

1. Go to Settings in Windsurf
2. Navigate to Windsurf Settings
3. Go to MCP Servers > Manage Plugins
4. Click "View Raw Config"

### 2. Add n8n-MCP Configuration

Copy the configuration from this repository and add it to your MCP config:

**Basic configuration (documentation tools only):**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true"
      }
    }
  }
}
```

**Full configuration (with n8n management tools):**
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

### 3. Configure n8n Connection

1. Replace `https://your-n8n-instance.com` with your actual n8n URL
2. Replace `your-api-key` with your n8n API key
3. Click refresh to apply the changes

### 4. Set Up Project Instructions

1. Create a `.windsurfrules` file in your project root
2. Copy the Claude Project instructions from the [main README's Claude Project Setup section](../README.md#-claude-project-setup)
