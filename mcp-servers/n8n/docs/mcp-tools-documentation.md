# MCP Tools Documentation for LLMs

This document provides comprehensive documentation for the most commonly used MCP tools in the n8n-mcp server. Each tool includes parameters, return formats, examples, and best practices.

## Table of Contents
1. [search_nodes](#search_nodes)
2. [get_node_essentials](#get_node_essentials)
3. [list_nodes](#list_nodes)
4. [validate_node_minimal](#validate_node_minimal)
5. [validate_node_operation](#validate_node_operation)
6. [get_node_for_task](#get_node_for_task)
7. [n8n_create_workflow](#n8n_create_workflow)
8. [n8n_update_partial_workflow](#n8n_update_partial_workflow)

---

## search_nodes

**Brief Description**: Search for n8n nodes by keywords in names and descriptions.

### Parameters
- `query` (string, required): Search term - single word recommended for best results
- `limit` (number, optional): Maximum results to return (default: 20)

### Return Format
```json
{
  "nodes": [
    {
      "nodeType": "nodes-base.slack",
      "displayName": "Slack",
      "description": "Send messages to Slack channels"
    }
  ],
  "totalFound": 5
}
```

### Common Use Cases
1. **Finding integration nodes**: `search_nodes("slack")` to find Slack integration
2. **Finding HTTP nodes**: `search_nodes("http")` for HTTP/webhook nodes
3. **Finding database nodes**: `search_nodes("postgres")` for PostgreSQL nodes

### Examples
```json
// Search for Slack-related nodes
{
  "query": "slack",
  "limit": 10
}

// Search for webhook nodes
{
  "query": "webhook",
  "limit": 20
}
```

### Performance Notes
- Fast operation (cached results)
- Single-word queries are more precise
- Returns results with OR logic (any word matches)

### Best Practices
- Use single words for precise results: "slack" not "send slack message"
- Try shorter terms if no results: "sheet" instead of "spreadsheet"
- Search is case-insensitive
- Common searches: "http", "webhook", "email", "database", "slack"

### Common Pitfalls
- Multi-word searches return too many results (OR logic)
- Searching for exact phrases doesn't work
- Node types aren't searchable here (use exact type with get_node_info)

### Related Tools
- `list_nodes` - Browse nodes by category
- `get_node_essentials` - Get node configuration after finding it
- `list_ai_tools` - Find AI-capable nodes specifically

---

## get_node_essentials

**Brief Description**: Get only the 10-20 most important properties for a node with working examples.

### Parameters
- `nodeType` (string, required): Full node type with prefix (e.g., "nodes-base.httpRequest")

### Return Format
```json
{
  "nodeType": "nodes-base.httpRequest",
  "displayName": "HTTP Request",
  "essentialProperties": [
    {
      "name": "method",
      "type": "options",
      "default": "GET",
      "options": ["GET", "POST", "PUT", "DELETE"],
      "required": true
    },
    {
      "name": "url",
      "type": "string",
      "required": true,
      "placeholder": "https://api.example.com/endpoint"
    }
  ],
  "examples": [
    {
      "name": "Simple GET Request",
      "configuration": {
        "method": "GET",
        "url": "https://api.example.com/users"
      }
    }
  ],
  "tips": [
    "Use expressions like {{$json.url}} to make URLs dynamic",
    "Enable 'Split Into Items' for array responses"
  ]
}
```

### Common Use Cases
1. **Quick node configuration**: Get just what you need without parsing 100KB+ of data
2. **Learning node basics**: Understand essential properties with examples
3. **Building workflows efficiently**: 95% smaller responses than get_node_info

### Examples
```json
// Get essentials for HTTP Request node
{
  "nodeType": "nodes-base.httpRequest"
}

// Get essentials for Slack node
{
  "nodeType": "nodes-base.slack"
}

// Get essentials for OpenAI node
{
  "nodeType": "nodes-langchain.openAi"
}
```

### Performance Notes
- Very fast (<5KB responses vs 100KB+ for full info)
- Curated for 20+ common nodes
- Automatic fallback for unconfigured nodes

### Best Practices
- Always use this before get_node_info
- Node type must include prefix: "nodes-base.slack" not "slack"
- Check examples section for working configurations
- Use tips section for common patterns

### Common Pitfalls
- Forgetting the prefix in node type
- Using wrong package name (n8n-nodes-base vs @n8n/n8n-nodes-langchain)
- Case sensitivity in node types

### Related Tools
- `get_node_info` - Full schema when essentials aren't enough
- `search_node_properties` - Find specific properties
- `get_node_for_task` - Pre-configured for common tasks

---

## list_nodes

**Brief Description**: List available n8n nodes with optional filtering by package, category, or capabilities.

### Parameters
- `package` (string, optional): Filter by exact package name
- `category` (string, optional): Filter by category (trigger, transform, output, input)
- `developmentStyle` (string, optional): Filter by implementation style
- `isAITool` (boolean, optional): Filter for AI-capable nodes
- `limit` (number, optional): Maximum results (default: 50, max: 500)

### Return Format
```json
{
  "nodes": [
    {
      "nodeType": "nodes-base.webhook",
      "displayName": "Webhook",
      "description": "Receive HTTP requests",
      "categories": ["trigger"],
      "version": 2
    }
  ],
  "total": 104,
  "hasMore": false
}
```

### Common Use Cases
1. **Browse all triggers**: `list_nodes({category: "trigger", limit: 200})`
2. **List all nodes**: `list_nodes({limit: 500})`
3. **Find AI nodes**: `list_nodes({isAITool: true})`
4. **Browse core nodes**: `list_nodes({package: "n8n-nodes-base"})`

### Examples
```json
// List all trigger nodes
{
  "category": "trigger",
  "limit": 200
}

// List all AI-capable nodes
{
  "isAITool": true,
  "limit": 100
}

// List nodes from core package
{
  "package": "n8n-nodes-base",
  "limit": 200
}
```

### Performance Notes
- Fast operation (cached results)
- Default limit of 50 may miss nodes - use 200+
- Returns metadata only, not full schemas

### Best Practices
- Always set limit to 200+ for complete results
- Use exact package names: "n8n-nodes-base" not "@n8n/n8n-nodes-base"
- Categories are singular: "trigger" not "triggers"
- Common categories: trigger (104), transform, output, input

### Common Pitfalls
- Default limit (50) misses many nodes
- Using wrong package name format
- Multiple filters may return empty results

### Related Tools
- `search_nodes` - Search by keywords
- `list_ai_tools` - Specifically for AI nodes
- `get_database_statistics` - Overview of all nodes

---

## validate_node_minimal

**Brief Description**: Quick validation checking only for missing required fields.

### Parameters
- `nodeType` (string, required): Node type to validate (e.g., "nodes-base.slack")
- `config` (object, required): Node configuration to check

### Return Format
```json
{
  "valid": false,
  "missingRequired": ["channel", "messageType"],
  "message": "Missing 2 required fields"
}
```

### Common Use Cases
1. **Quick validation**: Check if all required fields are present
2. **Pre-flight check**: Validate before creating workflow
3. **Minimal overhead**: Fastest validation option

### Examples
```json
// Validate Slack message configuration
{
  "nodeType": "nodes-base.slack",
  "config": {
    "resource": "message",
    "operation": "send",
    "text": "Hello World"
    // Missing: channel
  }
}

// Validate HTTP Request
{
  "nodeType": "nodes-base.httpRequest",
  "config": {
    "method": "POST"
    // Missing: url
  }
}
```

### Performance Notes
- Fastest validation option
- No schema loading overhead
- Returns only missing fields

### Best Practices
- Use for quick checks during workflow building
- Follow up with validate_node_operation for complex nodes
- Check operation-specific requirements

### Common Pitfalls
- Doesn't validate field values or types
- Doesn't check operation-specific requirements
- Won't catch configuration errors beyond missing fields

### Related Tools
- `validate_node_operation` - Comprehensive validation
- `validate_workflow` - Full workflow validation

---

## validate_node_operation

**Brief Description**: Comprehensive node configuration validation with operation awareness and helpful error messages.

### Parameters
- `nodeType` (string, required): Node type to validate
- `config` (object, required): Complete node configuration including operation fields
- `profile` (string, optional): Validation profile (minimal, runtime, ai-friendly, strict)

### Return Format
```json
{
  "valid": false,
  "errors": [
    {
      "field": "channel",
      "message": "Channel is required to send Slack message",
      "suggestion": "Add channel: '#general' or '@username'"
    }
  ],
  "warnings": [
    {
      "field": "unfurl_links",
      "message": "Consider setting unfurl_links: false for better performance"
    }
  ],
  "examples": {
    "minimal": {
      "resource": "message",
      "operation": "send",
      "channel": "#general",
      "text": "Hello World"
    }
  }
}
```

### Common Use Cases
1. **Complex node validation**: Slack, Google Sheets, databases
2. **Operation-specific checks**: Different rules per operation
3. **Getting fix suggestions**: Helpful error messages with solutions

### Examples
```json
// Validate Slack configuration
{
  "nodeType": "nodes-base.slack",
  "config": {
    "resource": "message",
    "operation": "send",
    "text": "Hello team!"
  },
  "profile": "ai-friendly"
}

// Validate Google Sheets operation
{
  "nodeType": "nodes-base.googleSheets",
  "config": {
    "operation": "append",
    "sheetId": "1234567890",
    "range": "Sheet1!A:Z"
  },
  "profile": "runtime"
}
```

### Performance Notes
- Slower than minimal validation
- Loads full node schema
- Operation-aware validation rules

### Best Practices
- Use "ai-friendly" profile for balanced validation
- Check examples in response for working configurations
- Follow suggestions to fix errors
- Essential for complex nodes (Slack, databases, APIs)

### Common Pitfalls
- Forgetting operation fields (resource, operation, action)
- Using wrong profile (too strict or too lenient)
- Ignoring warnings that could cause runtime issues

### Related Tools
- `validate_node_minimal` - Quick required field check
- `get_property_dependencies` - Understand field relationships
- `validate_workflow` - Validate entire workflow

---

## get_node_for_task

**Brief Description**: Get pre-configured node settings for common automation tasks.

### Parameters
- `task` (string, required): Task identifier (e.g., "post_json_request", "receive_webhook")

### Return Format
```json
{
  "task": "post_json_request",
  "nodeType": "nodes-base.httpRequest",
  "displayName": "HTTP Request",
  "configuration": {
    "method": "POST",
    "url": "={{ $json.api_endpoint }}",
    "responseFormat": "json",
    "options": {
      "bodyContentType": "json"
    },
    "bodyParametersJson": "={{ JSON.stringify($json) }}"
  },
  "userMustProvide": [
    "url - The API endpoint URL",
    "bodyParametersJson - The JSON data to send"
  ],
  "tips": [
    "Use expressions to make values dynamic",
    "Enable 'Split Into Items' for batch processing"
  ]
}
```

### Common Use Cases
1. **Quick task setup**: Configure nodes for specific tasks instantly
2. **Learning patterns**: See how to configure nodes properly
3. **Common workflows**: Standard patterns like webhooks, API calls, database queries

### Examples
```json
// Get configuration for JSON POST request
{
  "task": "post_json_request"
}

// Get webhook receiver configuration
{
  "task": "receive_webhook"
}

// Get AI chat configuration
{
  "task": "chat_with_ai"
}
```

### Performance Notes
- Instant response (pre-configured templates)
- No database lookups required
- Includes working examples

### Best Practices
- Use list_tasks first to see available options
- Check userMustProvide section
- Follow tips for best results
- Common tasks: API calls, webhooks, database queries, AI chat

### Common Pitfalls
- Not all tasks available (use list_tasks)
- Configuration needs customization
- Some fields still need user input

### Related Tools
- `list_tasks` - See all available tasks
- `get_node_essentials` - Alternative approach
- `search_templates` - Find complete workflow templates

---

## n8n_create_workflow

**Brief Description**: Create a new workflow in n8n with nodes and connections.

### Parameters
- `name` (string, required): Workflow name
- `nodes` (array, required): Array of node definitions
- `connections` (object, required): Node connections mapping
- `settings` (object, optional): Workflow settings

### Return Format
```json
{
  "id": "workflow-uuid",
  "name": "My Workflow",
  "active": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "nodes": [...],
  "connections": {...}
}
```

### Common Use Cases
1. **Automated workflow creation**: Build workflows programmatically
2. **Template deployment**: Deploy pre-built workflow patterns
3. **Multi-workflow systems**: Create interconnected workflows

### Examples
```json
// Create simple webhook → HTTP request workflow
{
  "name": "Webhook to API",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "path": "/my-webhook",
        "httpMethod": "POST"
      }
    },
    {
      "id": "http-1",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.example.com/process",
        "responseFormat": "json"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
    }
  }
}
```

### Performance Notes
- API call to n8n instance required
- Workflow created in inactive state
- Must be manually activated in UI

### Best Practices
- Always include typeVersion for nodes
- Use node names (not IDs) in connections
- Position nodes logically ([x, y] coordinates)
- Test with validate_workflow first
- Start simple, add complexity gradually

### Common Pitfalls
- Missing typeVersion causes errors
- Using node IDs instead of names in connections
- Forgetting required node properties
- Creating cycles in connections
- Workflow can't be activated via API

### Related Tools
- `validate_workflow` - Validate before creating
- `n8n_update_partial_workflow` - Modify existing workflows
- `n8n_trigger_webhook_workflow` - Execute workflows

---

## n8n_update_partial_workflow

**Brief Description**: Update workflows using diff operations for precise, incremental changes without sending the entire workflow.

### Parameters
- `id` (string, required): Workflow ID to update
- `operations` (array, required): Array of diff operations (max 5)
- `validateOnly` (boolean, optional): Test without applying changes

### Return Format
```json
{
  "success": true,
  "workflow": {
    "id": "workflow-uuid",
    "name": "Updated Workflow",
    "nodes": [...],
    "connections": {...}
  },
  "appliedOperations": 3
}
```

### Common Use Cases
1. **Add nodes to existing workflows**: Insert new functionality
2. **Update node configurations**: Change parameters without full replacement
3. **Manage connections**: Add/remove node connections
4. **Quick edits**: Rename, enable/disable nodes, update settings

### Examples
```json
// Add a new node and connect it
{
  "id": "workflow-123",
  "operations": [
    {
      "type": "addNode",
      "node": {
        "id": "set-1",
        "name": "Set Data",
        "type": "n8n-nodes-base.set",
        "typeVersion": 3,
        "position": [600, 300],
        "parameters": {
          "values": {
            "string": [{
              "name": "status",
              "value": "processed"
            }]
          }
        }
      }
    },
    {
      "type": "addConnection",
      "source": "HTTP Request",
      "target": "Set Data"
    }
  ]
}

// Update multiple properties
{
  "id": "workflow-123",
  "operations": [
    {
      "type": "updateName",
      "name": "Production Workflow v2"
    },
    {
      "type": "updateNode",
      "nodeName": "Webhook",
      "changes": {
        "parameters.path": "/v2/webhook"
      }
    },
    {
      "type": "addTag",
      "tag": "production"
    }
  ]
}
```

### Performance Notes
- 80-90% token savings vs full updates
- Maximum 5 operations per request
- Two-pass processing handles dependencies
- Transactional: all or nothing

### Best Practices
- Use validateOnly: true to test first
- Keep operations under 5 for reliability
- Operations can be in any order (v2.7.0+)
- Use node names, not IDs in operations
- For updateNode, use dot notation for nested paths

### Common Pitfalls
- Exceeding 5 operations limit
- Using node IDs instead of names
- Forgetting required node properties in addNode
- Not testing with validateOnly first

### Related Tools
- `n8n_update_full_workflow` - Complete workflow replacement
- `n8n_get_workflow` - Fetch current workflow state
- `validate_workflow` - Validate changes before applying

---

## Quick Reference

### Workflow Building Process
1. **Discovery**: `search_nodes` → `list_nodes`
2. **Configuration**: `get_node_essentials` → `get_node_for_task`
3. **Validation**: `validate_node_minimal` → `validate_node_operation`
4. **Creation**: `validate_workflow` → `n8n_create_workflow`
5. **Updates**: `n8n_update_partial_workflow`

### Performance Tips
- Use `get_node_essentials` instead of `get_node_info` (95% smaller)
- Set high limits on `list_nodes` (200+)
- Use single words in `search_nodes`
- Validate incrementally while building

### Common Node Types
- **Triggers**: webhook, schedule, emailReadImap, slackTrigger
- **Core**: httpRequest, code, set, if, merge, splitInBatches
- **Integrations**: slack, gmail, googleSheets, postgres, mongodb
- **AI**: agent, openAi, chainLlm, documentLoader

### Error Prevention
- Always include node type prefixes: "nodes-base.slack"
- Use node names (not IDs) in connections
- Include typeVersion in all nodes
- Test with validateOnly before applying changes
- Check userMustProvide sections in templates