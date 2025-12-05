---
description: Use MCP servers to access AI conversation history and project management
---

# Aegntic MCP Servers Workflow

Access your AI conversations from ChatGPT, Grok, Gemini, and Claude through unified MCP servers.

## Available MCP Servers

### 1. Aegntic Hive MCP
**Path:** `/home/ae/AE/01_Laboratory/cldcde/aegntic-hive-mcp/`

Full-featured project management with:
- Web scraping for AI conversations
- Project organization
- Artifact versioning
- Advanced search (semantic, fuzzy, keyword)
- Analytics and trending topics

**Start Server:**
```bash
cd /home/ae/AE/01_Laboratory/cldcde/aegntic-hive-mcp
npm start
```

### 2. AI Memory Server
**Path:** `/home/ae/AE/01_Laboratory/cldcde/mcp-servers/ai-memory-server/`

Streamlined memory access with:
- Multi-service login
- Conversation retrieval
- Cross-service search
- Sync capabilities

**Start Server:**
```bash
cd /home/ae/AE/01_Laboratory/cldcde/mcp-servers/ai-memory-server
node index.js
```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "aegntic-hive": {
      "command": "node",
      "args": ["/home/ae/AE/01_Laboratory/cldcde/aegntic-hive-mcp/server.js"]
    },
    "ai-memory": {
      "command": "node",
      "args": ["/home/ae/AE/01_Laboratory/cldcde/mcp-servers/ai-memory-server/index.js"]
    }
  }
}
```

## Usage Examples

### Login to Services
```
login_service(service: "chatgpt")
login_service(service: "grok")
login_service(service: "gemini")
login_service(service: "claude")
```

### Scrape Conversations
```
scrape_conversations(service: "all")
get_conversations(service: "chatgpt", limit: 10)
```

### Search Across Services
```
search_conversations(query: "python code")
get_trending_topics(service: "claude", limit: 10)
```

### Project Management (Hive only)
```
create_project(name: "My Project", description: "...")
save_artifact(project_id: 1, name: "code.py", content: "...")
export_project_structure(project_id: 1)
```

## Security Notes

- All data stored locally in SQLite
- Session cookies saved for authentication
- No API keys required
- Browser automation for login (non-headless)

---
*ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ*
