#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CollaborationManager } from './collaboration-manager.js';
import { OpenRouterClient } from './openrouter-client.js';

const server = new Server(
  { name: 'ai-collaboration-hub', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

let collaborationManager: CollaborationManager;

async function initializeClients() {
  const geminiClient = new OpenRouterClient({
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-pro-1.5',
    maxTokens: 1000000,
    apiKey: process.env.OPENROUTER_API_KEY
  });
  collaborationManager = new CollaborationManager(geminiClient);
}server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_collaboration',
        description: 'Start new AI collaboration session',
        inputSchema: {
          type: 'object',
          properties: {
            maxExchanges: { type: 'number' },
            requireApproval: { type: 'boolean' }
          }
        }
      },
      {
        name: 'collaborate_with_gemini',
        description: 'Send message to Gemini with oversight',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            content: { type: 'string' },
            context: { type: 'string' }
          },
          required: ['sessionId', 'content']
        }
      },
      {
        name: 'view_conversation',
        description: 'View conversation log for session',
        inputSchema: {
          type: 'object',
          properties: { sessionId: { type: 'string' } },
          required: ['sessionId']
        }
      },
      {
        name: 'end_collaboration',
        description: 'End collaboration session',
        inputSchema: {
          type: 'object',
          properties: { sessionId: { type: 'string' } },
          required: ['sessionId']
        }
      }
    ]
  };
});server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'start_collaboration':
        const sessionId = collaborationManager.createSession(args);
        return {
          content: [{ type: 'text', text: `🚀 Started collaboration session: ${sessionId}` }]
        };

      case 'collaborate_with_gemini':
        const response = await collaborationManager.sendToGemini(
          args.sessionId,
          args.content,
          args.context
        );
        return {
          content: [{ type: 'text', text: `✅ Gemini responded: ${response}` }]
        };

      case 'view_conversation':
        const log = collaborationManager.getConversationLog(args.sessionId);
        const formatted = log.map(msg => 
          `[${msg.timestamp.toISOString()}] ${msg.from}: ${msg.content}`
        ).join('\n');
        return {
          content: [{ type: 'text', text: `📝 Conversation log:\n${formatted}` }]
        };

      case 'end_collaboration':
        collaborationManager.endSession(args.sessionId);
        return {
          content: [{ type: 'text', text: `🔚 Ended session: ${args.sessionId}` }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
      isError: true
    };
  }
});

async function main() {
  await initializeClients();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🤝 AI Collaboration Hub MCP server running');
}

main().catch(console.error);