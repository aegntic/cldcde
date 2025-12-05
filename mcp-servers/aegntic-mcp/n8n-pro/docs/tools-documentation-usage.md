# MCP Tools Documentation Usage Guide

The `tools_documentation` tool provides comprehensive documentation for all MCP tools, making it easy for LLMs to understand how to use the tools effectively.

## Basic Usage

### 1. Get Documentation for Specific Tools

```json
{
  "name": "tools_documentation",
  "arguments": {
    "tools": ["search_nodes", "get_node_essentials"]
  }
}
```

Returns detailed documentation including parameters, examples, and best practices for the specified tools.

### 2. Search Tools by Keyword

```json
{
  "name": "tools_documentation",
  "arguments": {
    "search": "validation"
  }
}
```

Finds all tools related to validation, including their descriptions and use cases.

### 3. Browse Tools by Category

```json
{
  "name": "tools_documentation",
  "arguments": {
    "category": "workflow_management"
  }
}
```

Available categories:
- **discovery**: Tools for finding and exploring nodes
- **configuration**: Tools for configuring nodes
- **validation**: Tools for validating configurations
- **workflow_management**: Tools for creating and updating workflows
- **execution**: Tools for running workflows
- **templates**: Tools for working with workflow templates

### 4. Get All Categories

```json
{
  "name": "tools_documentation",
  "arguments": {}
}
```

Returns a list of all categories and the tools in each category.

### 5. Include Quick Reference Guide

```json
{
  "name": "tools_documentation",
  "arguments": {
    "tools": ["n8n_create_workflow"],
    "includeQuickReference": true
  }
}
```

Includes a quick reference guide with workflow building process, performance tips, and common patterns.

## Response Format

The tool returns structured documentation with:

- **Parameters**: Complete parameter descriptions with types, requirements, and defaults
- **Return Format**: Example of what the tool returns
- **Common Use Cases**: Real-world scenarios where the tool is useful
- **Examples**: Working examples with input and expected output
- **Performance Notes**: Speed and efficiency considerations
- **Best Practices**: Recommended usage patterns
- **Common Pitfalls**: Mistakes to avoid
- **Related Tools**: Other tools that work well together

## Example: Learning About search_nodes

Request:
```json
{
  "name": "tools_documentation",
  "arguments": {
    "tools": ["search_nodes"]
  }
}
```

Response includes:
- How to search effectively (single words work best)
- Performance characteristics (fast, cached)
- Common searches (http, webhook, email, database, slack)
- Pitfalls to avoid (multi-word searches use OR logic)
- Related tools for next steps

## Tips for LLMs

1. **Start with categories**: Browse available tools by category to understand what's possible
2. **Search by task**: Use search to find tools for specific tasks like "validation" or "workflow"
3. **Learn tool combinations**: Check "Related Tools" to understand workflow patterns
4. **Check examples**: Every tool has working examples to copy and modify
5. **Avoid pitfalls**: Pay attention to "Common Pitfalls" to prevent errors

## Integration with Workflow Building

The documentation helps build workflows efficiently:

1. **Discovery Phase**: Use `search_nodes` and `list_nodes` documentation
2. **Configuration Phase**: Learn from `get_node_essentials` examples
3. **Validation Phase**: Understand validation tool options and profiles
4. **Creation Phase**: Follow `n8n_create_workflow` best practices
5. **Update Phase**: Master `n8n_update_partial_workflow` operations

## Performance Optimization

The documentation emphasizes performance:
- Which tools are fast (essentials) vs slow (full info)
- Optimal parameters (e.g., limit: 200+ for list_nodes)
- Caching behavior
- Token savings with partial updates

This documentation system ensures LLMs can use the MCP tools effectively without trial and error.