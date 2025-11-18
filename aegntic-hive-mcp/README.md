# Aegntic Hive MCP Server

The Aegntic Hive MCP Server is a comprehensive project management system for AI conversations, providing Claude with access to your ChatGPT, Grok, Gemini, and Claude.ai conversations through web scraping. It organizes conversations into projects, manages artifacts with version control, and stores everything in a local SQLite database for unified access and advanced searching.

## Features

- 🔐 **Manual Login**: Secure login to each AI service through browser automation
- 🕷️ **Web Scraping**: Extracts conversations without requiring API keys
- 🗄️ **Local Storage**: Stores conversations in SQLite database
- 🔍 **Advanced Search**: Semantic, fuzzy, exact, and keyword-based search
- 📊 **Unified View**: Access all AI conversations in one place
- 🔄 **Sync**: Keep conversations updated across all services
- 📁 **Project Management**: Organize conversations into projects
- 🎯 **Artifact Versioning**: Track artifacts with full version history
- 📋 **Structured Export**: Export projects to structured JSON format
- 🔄 **Import/Export**: Full project structure import/export capabilities
- 📈 **Analytics**: Topic analysis, keyword insights, and trending analysis

## Setup

1. **Install Dependencies**
```bash
cd aegntic-hive-mcp
npm install
```

2. **Start the Server**
```bash
npm start
```

3. **Configure in Claude Desktop**
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "aegntic-hive": {
      "command": "node",
      "args": ["/path/to/aegntic-hive-mcp/server.js"]
    }
  }
}
```

## Usage

### 1. Login to Services

First, login to each AI service you want to scrape:

```
login_service(service: "chatgpt")
login_service(service: "grok")
login_service(service: "gemini")
login_service(service: "claude")
```

This will open a browser window where you can login manually. Session cookies are saved for future use.

### 2. Scrape Conversations

Scrape conversations from one or all services:

```
scrape_conversations(service: "all")
scrape_conversations(service: "chatgpt")
```

### 3. Access Conversations

Get conversations from the database:

```
get_conversations(service: "chatgpt", limit: 10)
get_conversations() // All services
```

### 4. Get Conversation Messages

Get full conversation history:

```
get_conversation_messages(conversation_id: 123)
```

### 5. Search Conversations

Search across all conversations:

```
search_conversations(query: "python code")
search_conversations(query: "machine learning", service: "claude")
```

### 6. Get Summary

Get overview of all conversations:

```
get_conversation_summary()
```

### 7. Project Management

Create and manage projects:

```
create_project(name: "My AI Project", description: "A project for tracking AI conversations", instructions: "Focus on machine learning topics")
get_projects()
get_project(project_id: 1)
```

### 8. Artifact Management

Save and version artifacts:

```
save_artifact(project_id: 1, name: "analysis.py", type: "code", content: "# Python analysis code", metadata: '{"language": "python"}')
get_artifacts(project_id: 1)
get_artifact_versions(project_id: 1, artifact_name: "analysis.py")
```

### 9. Project Structure Export/Import

Export and import complete project structures:

```
export_project_structure(project_id: 1, file_path: "project_backup.json")
import_project_structure(file_path: "project_backup.json")
```

### 10. Advanced Analytics

Analyze conversations and get insights:

```
analyze_conversation(conversation_id: 1)
get_trending_topics(service: "chatgpt", limit: 10)
get_keyword_insights(service: "claude", limit: 20)
```

## Available Tools

### Core Tools
- `login_service(service)` - Login to an AI service
- `scrape_conversations(service, save_to_db)` - Scrape conversations
- `scrape_conversations_for_project(project_id, service, save_to_db)` - Scrape conversations for a project
- `get_conversations(service, limit, offset)` - Get stored conversations
- `get_conversation_messages(conversation_id)` - Get conversation messages
- `search_conversations(query, service, search_type, topics, keywords, date_range)` - Advanced search
- `clear_conversations(service)` - Clear conversations for a service
- `get_conversation_summary()` - Get summary of all conversations

### Project Management
- `create_project(name, description, instructions)` - Create a new project
- `get_projects()` - Get all projects
- `get_project(project_id)` - Get a specific project

### Artifact Management
- `save_artifact(project_id, name, type, content, metadata)` - Save artifact with versioning
- `get_artifacts(project_id)` - Get all artifacts for a project
- `get_artifact_versions(project_id, artifact_name)` - Get artifact version history

### Import/Export
- `export_to_json(service, file_path)` - Export conversations to JSON
- `import_from_json(file_path)` - Import conversations from JSON
- `convert_to_human_readable(conversation_id, file_path)` - Convert to readable format
- `export_project_structure(project_id, file_path)` - Export complete project structure
- `import_project_structure(file_path)` - Import complete project structure

### Analytics
- `analyze_conversation(conversation_id)` - Analyze conversation for insights
- `get_trending_topics(service, limit)` - Get trending topics
- `get_keyword_insights(service, limit)` - Get keyword insights

## Database Schema

**projects table:**
- `id` - Primary key
- `name` - Project name
- `description` - Project description
- `instructions` - Project instructions
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**artifacts table:**
- `id` - Primary key
- `project_id` - Foreign key to projects
- `name` - Artifact name
- `type` - Artifact type (code, document, image, etc.)
- `content` - Artifact content
- `metadata` - JSON metadata
- `version` - Version number
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**conversations table:**
- `id` - Primary key
- `service` - AI service name
- `project_id` - Foreign key to projects (nullable)
- `conversation_id` - Service-specific conversation ID
- `title` - Conversation title
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `url` - Direct URL to conversation

**messages table:**
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `service` - AI service name
- `role` - 'user' or 'assistant'
- `content` - Message content
- `timestamp` - Message timestamp
- `message_order` - Order within conversation

## Security & Privacy

- All data is stored locally in SQLite database
- Session cookies are saved locally for authentication
- No API keys required
- No data sent to external servers
- Browser automation is non-headless during login for security

## Troubleshooting

### Browser Issues
- Ensure you have Chrome/Chromium installed
- Try clearing sessions.json if login fails
- Check console output for scraping errors

### Scraping Issues
- Web scraping may break if sites change their structure
- Increase wait times if pages load slowly
- Check network connectivity

### Database Issues
- Database is created automatically
- Clear conversations if data gets corrupted
- Check file permissions for database file

## Limitations

- Requires manual login to each service
- Web scraping may be fragile to site changes
- Rate limiting may apply during scraping
- Some conversations may not be fully accessible

## Contributing

The scraping logic is modular and can be extended:
- Add new AI services in `scrapers.js`
- Improve selectors for better extraction
- Add error handling for edge cases
- Optimize database queries

## License

MIT License - see LICENSE file for details.
