# List of Connected Servers

This document lists all servers connected to Cline and Claude on this machine.

## Claude Export MCP Server
- **Description**: Exports Claude Desktop projects, conversations, and artifacts to Markdown format.
- **Path**: servers/export/claude-export-mcp/
- **Main File**: claude-export-mcp.js
- **Functionality**:
  - Export all Claude Desktop content organized by projects.
  - Maintain correct directory structure (projects, conversations, artifacts, files).
  - Copy project files associated with each project.

## Firebase Studio MCP Server
- **Description**: Manages and interacts with Firebase Realtime Database for studio applications.
- **Path**: servers/studio/firebase-studio-mcp/
- **Main File**: firebase-studio-mcp.js
- **Functionality**:
  - Connects to Firebase Realtime Database.
  - Handles CRUD operations for studio-related data.
  - Syncs data between client and server.

## N8N MCP Server
- **Description**: Integrates n8n (formerly Nodeclipse) into the MCP ecosystem.
- **Path**: servers/shared/n8n-mcp/
- **Main File**: n8n-mcp.js
- **Functionality**:
  - Connects n8n workflows to MCP.
  - Enables automation and integration tasks.
  - Manages workflow triggers and executions.

## Template Server
- **Description**: Standardized template for creating new MCP servers.
- **Path**: template/
- **Main File**: index.js
- **Functionality**:
  - Serves as a base for new server implementations.
  - Includes basic server setup and structure.
  - Can be customized for specific use cases.

## Cline
- **Description**: The main MCP server for managing and coordinating tasks.
- **Path**: servers/clin
