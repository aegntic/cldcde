#!/usr/bin/env node

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const { BrowserHandler } = require('./browser.js');

const browserHandler = new BrowserHandler();

class GoogleAIStudioServer {
    constructor() {
        this.server = new Server(
            {
                name: 'google-ai-studio-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();

        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await browserHandler.close();
            await this.server.close();
            process.exit(0);
        });
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'generate_content',
                        description: 'Generate content using Google AI Studio via browser automation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                model: {
                                    type: 'string',
                                    description: 'The model to use (e.g., gemini-1.5-pro)',
                                    default: 'gemini-1.5-flash'
                                },
                                prompt: {
                                    type: 'string',
                                    description: 'The prompt to send to the model'
                                }
                            },
                            required: ['prompt']
                        }
                    },
                    {
                        name: 'list_models',
                        description: 'List available Gemini models',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                if (name === 'generate_content') {
                    const text = await browserHandler.generateContent(args.prompt, args.model);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: text
                            }
                        ]
                    };
                } else if (name === 'list_models') {
                    const knownModels = [
                        "gemini-1.5-pro",
                        "gemini-1.5-flash",
                        "gemini-1.5-pro-latest",
                        "gemini-1.5-flash-latest",
                        "gemini-1.0-pro"
                    ];

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(knownModels, null, 2)
                            }
                        ]
                    };
                } else {
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            } catch (error) {
                console.error(`Error executing ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`
                        }
                    ],
                    isError: true
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Google AI Studio MCP server running on stdio');

        // Initialize browser on start
        await browserHandler.init();
    }
}

const server = new GoogleAIStudioServer();
server.run().catch(console.error);
