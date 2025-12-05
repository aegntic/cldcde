# Claude Export MCP Server

An MCP (Model Context Protocol) server for exporting Claude Desktop projects, conversations, and artifacts to Markdown format.

## Features

- Export all Claude Desktop content organized by projects
- Maintain correct directory structure (projects, conversations, artifacts, files)
- Export all artifacts with appropriate file extensions
- Copy project files associated with each project
- Automatically detect Claude Desktop location on different operating systems
- Simple MCP server interface that can be used within Claude chats

## Installation

You can install and run this tool using npx:

```bash
npx @aegntic/claude-export-mcp
```

Or install it globally:

```bash
npm install -g @aegntic/claude-export-mcp
claude-export-mcp
```

## Usage

1. Start the server:
   ```bash
   npx @aegntic/claude-export-mcp
   ```

2. The server will start on http://localhost:3000 (or the port specified in the PORT environment variable)

3. In Claude, add this MCP server by searching for MCP servers and adding the URL (http://localhost:3000)

4. Once added, you can use the `export_chats` tool to export your projects and conversations:
   ```
   Parameters:
   {
     "claudePath": "/optional/path/to/claude/desktop/folder",
     "exportPath": "/optional/path/to/export/directory"
   }
   ```

If you don't specify paths, the tool will automatically detect the Claude Desktop location and export to a folder named "claude-export" in the current directory.

## Export Structure

The export maintains Claude Desktop's project structure:

```
/claude-export/
  ├── project-1/
  │   ├── conversations/
  │   │   └── conversation-title/
  │   │       ├── conversation.md
  │   │       └── artifacts/
  │   ├── artifacts/          # Project-wide artifacts
  │   └── files/              # Project files
  └── project-2/
      ├── conversations/
      │   └── ...
      ├── artifacts/
      └── files/
```

Each project contains:
- Conversations directory with each conversation and its specific artifacts
- Project-wide artifacts directory with all artifacts from the project
- Files directory with any local project files associated with the project

## MCP Tools

- **export_chats**: Export Claude Desktop projects, conversations, and artifacts to Markdown
  - Parameters:
    - `claudePath` (optional): Path to Claude Desktop folder
    - `exportPath` (optional): Path where to export the Markdown files
  
- **server_info**: Get information about this MCP server
  - No parameters required

## Development

To contribute to this project:

1. Clone the repository
2. Navigate to the server directory: `cd servers/claude-export-mcp`
3. Install dependencies: `npm install`
4. Start the server: `npm start`

## License

MIT
