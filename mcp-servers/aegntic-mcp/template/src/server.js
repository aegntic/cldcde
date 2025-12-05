/**
 * MCP Server Implementation
 */

const mcp = require('mcp-server');

// Create MCP server
const server = new mcp.Server({
  name: 'MCP Server',
  description: 'A flexible MCP server template'
});

// Add your methods here
server.method({
  name: 'example',
  description: 'An example method',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'An example parameter'
      }
    },
    required: ['param1']
  },
  handler: async ({ param1 }) => {
    return {
      success: true,
      message: `Received parameter: ${param1}`
    };
  }
});

module.exports = server;