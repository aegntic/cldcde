#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

const Database = require('./database.js');
const ConversationScraper = require('./scrapers.js');
const { format } = require('date-fns');
const SearchEngine = require('./search.js');

class AIConversationsMCP {
  constructor() {
    this.db = new Database();
    this.scraper = new ConversationScraper();
    this.searchEngine = new SearchEngine();

    this.server = new Server(
        {
            name: 'aegntic-hive-mcp',
            version: '1.0.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'login_service',
            description: 'Login to an AI service (chatgpt, grok, gemini, claude)',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'The AI service to login to',
                },
              },
              required: ['service'],
            },
          },
          {
            name: 'scrape_conversations',
            description: 'Scrape conversations from AI services',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude', 'all'],
                  description: 'The AI service to scrape from, or "all" for all services',
                },
                save_to_db: {
                  type: 'boolean',
                  description: 'Whether to save conversations to database',
                  default: true,
                },
              },
              required: ['service'],
            },
          },
          {
            name: 'scrape_conversations_for_project',
            description: 'Scrape conversations and assign to a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID to assign conversations to',
                },
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude', 'all'],
                  description: 'The AI service to scrape from, or "all" for all services',
                },
                save_to_db: {
                  type: 'boolean',
                  description: 'Whether to save conversations to database',
                  default: true,
                },
              },
              required: ['project_id', 'service'],
            },
          },
          {
            name: 'get_conversations',
            description: 'Get stored conversations from database',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'Filter by AI service',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of conversations to return',
                  default: 50,
                },
                offset: {
                  type: 'number',
                  description: 'Number of conversations to skip',
                  default: 0,
                },
              },
            },
          },
          {
            name: 'get_conversation_messages',
            description: 'Get messages from a specific conversation',
            inputSchema: {
              type: 'object',
              properties: {
                conversation_id: {
                  type: 'number',
                  description: 'Database ID of the conversation',
                },
              },
              required: ['conversation_id'],
            },
          },
          {
            name: 'search_conversations',
            description: 'Search conversations by content or title',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'Filter by AI service',
                },
                min_score: {
                  type: 'number',
                  description: 'Minimum score for fuzzy/semantic search',
                  default: 0.3
                },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by topics'
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by keywords'
                },
                date_range: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' }
                  },
                  description: 'Filter by date range'
                },
                search_type: {
                  type: 'string',
                  enum: ['exact', 'fuzzy', 'semantic', 'keyword'],
                  description: 'Type of search: exact, fuzzy, semantic, keyword',
                  default: 'fuzzy'
                }
              },
              required: ['query'],
            },
          },
          {
            name: 'clear_conversations',
            description: 'Clear all conversations from database for a service',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'The AI service to clear conversations for',
                },
              },
              required: ['service'],
            },
          },
          {
            name: 'get_conversation_summary',
            description: 'Get a summary of all conversations across services',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'export_to_json',
            description: 'Export conversations to JSON format',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'Filter by AI service',
                },
                file_path: {
                  type: 'string',
                  description: 'Path where to save the JSON file',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'import_from_json',
            description: 'Import conversations from JSON format',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the JSON file to import',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'convert_to_human_readable',
            description: 'Convert a conversation to human-readable format',
            inputSchema: {
              type: 'object',
              properties: {
                conversation_id: {
                  type: 'number',
                  description: 'Database ID of the conversation',
                },
                file_path: {
                  type: 'string',
                  description: 'Path where to save the human-readable file',
                },
              },
              required: ['conversation_id', 'file_path'],
            },
          },
          {
            name: 'analyze_conversation',
            description: 'Analyze a conversation for keywords, topics, sentiment, and summary',
            inputSchema: {
              type: 'object',
              properties: {
                conversation_id: {
                  type: 'number',
                  description: 'Database ID of the conversation',
                },
              },
              required: ['conversation_id'],
            },
          },
          {
            name: 'get_trending_topics',
            description: 'Get trending topics across all conversations',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'Filter by AI service',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of topics to return',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'get_keyword_insights',
            description: 'Get keyword insights across all conversations',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                  description: 'Filter by AI service',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of keywords to return',
                  default: 20,
                },
              },
            },
          },
          {
            name: 'create_project',
            description: 'Create a new project',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Project name',
                },
                description: {
                  type: 'string',
                  description: 'Project description',
                },
                instructions: {
                  type: 'string',
                  description: 'Project instructions',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_projects',
            description: 'Get all projects',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_project',
            description: 'Get a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID',
                },
              },
              required: ['project_id'],
            },
          },
          {
            name: 'save_artifact',
            description: 'Save an artifact with versioning',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID',
                },
                name: {
                  type: 'string',
                  description: 'Artifact name',
                },
                type: {
                  type: 'string',
                  description: 'Artifact type (e.g., code, document, image)',
                },
                content: {
                  type: 'string',
                  description: 'Artifact content',
                },
                metadata: {
                  type: 'string',
                  description: 'Artifact metadata (JSON string)',
                },
              },
              required: ['project_id', 'name', 'type', 'content'],
            },
          },
          {
            name: 'get_artifacts',
            description: 'Get all artifacts for a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID',
                },
              },
              required: ['project_id'],
            },
          },
          {
            name: 'get_artifact_versions',
            description: 'Get all versions of an artifact',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID',
                },
                artifact_name: {
                  type: 'string',
                  description: 'Artifact name',
                },
              },
              required: ['project_id', 'artifact_name'],
            },
          },
          {
            name: 'export_project_structure',
            description: 'Export complete project structure to JSON',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: 'Project ID',
                },
                file_path: {
                  type: 'string',
                  description: 'Path where to save the JSON file',
                },
              },
              required: ['project_id', 'file_path'],
            },
          },
          {
            name: 'import_project_structure',
            description: 'Import complete project structure from JSON',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the JSON file to import',
                },
              },
              required: ['file_path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'login_service':
            return await this.handleLogin(args.service);

          case 'scrape_conversations':
            return await this.handleScrape(args.service, args.save_to_db ?? true);

          case 'scrape_conversations_for_project':
            return await this.handleScrapeForProject(args.project_id, args.service, args.save_to_db ?? true);

          case 'get_conversations':
            return await this.handleGetConversations(args.service, args.limit, args.offset);

          case 'get_conversation_messages':
            return await this.handleGetMessages(args.conversation_id);

          case 'search_conversations':
            return await this.handleSearch(args);

          case 'clear_conversations':
            return await this.handleClear(args.service);

          case 'get_conversation_summary':
            return await this.handleSummary();

          case 'export_to_json':
            return await this.handleExportToJSON(args.service, args.file_path);

          case 'import_from_json':
            return await this.handleImportFromJSON(args.file_path);

          case 'convert_to_human_readable':
            return await this.handleConvertToHumanReadable(args.conversation_id, args.file_path);

          case 'analyze_conversation':
            return await this.handleAnalyzeConversation(args.conversation_id);

          case 'get_trending_topics':
            return await this.handleGetTrendingTopics(args.service, args.limit);

          case 'get_keyword_insights':
            return await this.handleGetKeywordInsights(args.service, args.limit);

          case 'create_project':
            return await this.handleCreateProject(args.name, args.description, args.instructions);

          case 'get_projects':
            return await this.handleGetProjects();

          case 'get_project':
            return await this.handleGetProject(args.project_id);

          case 'save_artifact':
            return await this.handleSaveArtifact(args.project_id, args.name, args.type, args.content, args.metadata);

          case 'get_artifacts':
            return await this.handleGetArtifacts(args.project_id);

          case 'get_artifact_versions':
            return await this.handleGetArtifactVersions(args.project_id, args.artifact_name);

          case 'export_project_structure':
            return await this.handleExportProjectStructure(args.project_id, args.file_path);

          case 'import_project_structure':
            return await this.handleImportProjectStructure(args.file_path);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error handling ${name}:`, error);
        throw new McpError(ErrorCode.InternalError, `Error: ${error.message}`);
      }
    });
  }

  async handleLogin(service) {
    await this.scraper.init();
    await this.scraper.loginToService(service);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully logged in to ${service}. Session cookies have been saved.`,
        },
      ],
    };
  }

  async handleCreateProject(name, description, instructions) {
    const projectId = await this.db.saveProject(name, description, instructions);
    return {
      content: [
        {
          type: 'text',
          text: `Project created with ID: ${projectId}`,
        },
      ],
    };
  }

  async handleGetProjects() {
    const projects = await this.db.getProjects();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  }

  async handleGetProject(projectId) {
    const project = await this.db.getProject(projectId);
    if (project) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    } else {
      throw new McpError(ErrorCode.NotFound, `Project with ID ${projectId} not found.`);
    }
  }

  async handleSaveArtifact(projectId, name, type, content, metadata) {
    const version = await this.db.getLatestArtifactVersion(projectId, name) + 1;
    const artifactId = await this.db.saveArtifact(projectId, name, type, content, metadata, version);
    return {
      content: [
        {
          type: 'text',
          text: `Artifact saved with ID: ${artifactId}, version: ${version}`,
        },
      ],
    };
  }

  async handleGetArtifacts(projectId) {
    const artifacts = await this.db.getArtifacts(projectId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(artifacts, null, 2),
        },
      ],
    };
  }

  async handleGetArtifactVersions(projectId, artifactName) {
    const versions = await this.db.getArtifactVersions(projectId, artifactName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(versions, null, 2),
        },
      ],
    };
  }

  async handleExportProjectStructure(projectId, filePath) {
    const project = await this.db.getProject(projectId);
    if (!project) {
      throw new McpError(ErrorCode.NotFound, `Project with ID ${projectId} not found.`);
    }

    const conversations = await this.db.getConversations(null, 1000, 0);
    const projectConversations = conversations.filter(conv => conv.project_id === projectId);

    // Get details of all conversations including messages
    const detailedConversations = await Promise.all(
      projectConversations.map(async conv => ({
        ...conv,
        messages: await this.db.getConversationMessages(conv.id)
      }))
    );

    const artifacts = await this.db.getArtifacts(projectId);

    const projectStructure = {
      project,
      conversations: detailedConversations,
      artifacts
    };

    require('fs').writeFileSync(filePath, JSON.stringify(projectStructure, null, 2));

    return {
      content: [
        {
          type: 'text',
          text: `Project structure exported to ${filePath}`,
        },
      ],
    };
  }

  async handleImportProjectStructure(filePath) {
    const jsonData = require('fs').readFileSync(filePath, 'utf8');
    const { project, conversations, artifacts } = JSON.parse(jsonData);

    const existingProject = await this.db.getProject(project.id);
    let projectId;

    if (existingProject) {
      projectId = existingProject.id;
      // Update project details
      await this.db.saveProject(project.name, project.description, project.instructions);
    } else {
      projectId = await this.db.saveProject(project.name, project.description, project.instructions);
    }

    // Import conversations
    for (const conv of conversations) {
      const conversationDbId = await this.db.saveConversation(
        conv.service,
        projectId,
        conv.conversation_id,
        conv.title,
        conv.created_at,
        conv.updated_at,
        conv.url
      );
      // Clear existing messages for this conversation
      await this.db.db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationDbId]);
      // Save messages
      for (const message of conv.messages) {
        await this.db.saveMessage(
          conversationDbId,
          conv.service,
          message.role,
          message.content,
          message.timestamp,
          message.message_order
        );
      }
    }

    // Import artifacts
    for (const artifact of artifacts) {
      await this.db.saveArtifact(
        projectId,
        artifact.name,
        artifact.type,
        artifact.content,
        artifact.metadata,
        artifact.version
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: `Project structure imported from ${filePath}`,
        },
      ],
    };
  }

  async handleScrape(service, saveToDb) {
    await this.scraper.init();
    
    let results;
    if (service === 'all') {
      results = await this.scraper.scrapeAll();
    } else {
      const scraperMethod = `scrape${service.charAt(0).toUpperCase() + service.slice(1)}`;
      if (typeof this.scraper[scraperMethod] !== 'function') {
        throw new Error(`Scraper method ${scraperMethod} not found`);
      }
      results = { [service]: await this.scraper[scraperMethod]() };
    }

    if (saveToDb) {
      const projectId = null; // Default to no project
      await this.saveConversationsToDb(projectId, results);
    }

    const summary = Object.entries(results)
      .map(([svc, conversations]) => `${svc}: ${conversations.length} conversations`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Scraping completed:\n${summary}`,
        },
      ],
    };
  }

  async handleScrapeForProject(projectId, service, saveToDb) {
    await this.scraper.init();
    
    let results;
    if (service === 'all') {
      results = await this.scraper.scrapeAll();
    } else {
      const scraperMethod = `scrape${service.charAt(0).toUpperCase() + service.slice(1)}`;
      if (typeof this.scraper[scraperMethod] !== 'function') {
        throw new Error(`Scraper method ${scraperMethod} not found`);
      }
      results = { [service]: await this.scraper[scraperMethod]() };
    }

    if (saveToDb) {
      await this.saveConversationsToDb(projectId, results);
    }

    const summary = Object.entries(results)
      .map(([svc, conversations]) => `${svc}: ${conversations.length} conversations`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Scraping completed for project ${projectId}:\n${summary}`,
        },
      ],
    };
  }

  async saveConversationsToDb(projectId, results) {
    for (const [service, conversations] of Object.entries(results)) {
      for (const conv of conversations) {
        try {
          const now = new Date().toISOString();
          const conversationDbId = await this.db.saveConversation(
            service,
            projectId,
            conv.id,
            conv.title,
            now,
            now,
            conv.url
          );

          // Clear existing messages for this conversation
          await this.db.db.run(
            'DELETE FROM messages WHERE conversation_id = ?',
            [conversationDbId]
          );

          // Save messages
          if (conv.messages) {
            for (const message of conv.messages) {
              await this.db.saveMessage(
                conversationDbId,
                service,
                message.role,
                message.content,
                now,
                message.order
              );
            }
          }
        } catch (error) {
          console.error(`Error saving conversation ${conv.id}:`, error);
        }
      }
    }
  }

  async handleGetConversations(service, limit = 50, offset = 0) {
    const conversations = await this.db.getConversations(service, limit, offset);
    
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      service: conv.service,
      conversation_id: conv.conversation_id,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      url: conv.url,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedConversations, null, 2),
        },
      ],
    };
  }

  async handleGetMessages(conversationId) {
    const messages = await this.db.getConversationMessages(conversationId);
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      order: msg.message_order,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedMessages, null, 2),
        },
      ],
    };
  }

  async handleSearch(args) {
    const conversations = await this.db.getConversations(args.service, 1000, 0);
    const searchOptions = {
      searchType: args.search_type || 'fuzzy',
      topics: args.topics || [],
      keywords: args.keywords || [],
      dateRange: args.date_range ? {
        start: new Date(args.date_range.start),
        end: new Date(args.date_range.end)
      } : null,
      minScore: args.min_score || 0.3,
      services: args.service ? [args.service] : []
    };

    const results = this.searchEngine.searchConversations(conversations, args.query, searchOptions);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} conversations matching "${args.query}":\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  async handleExportToJSON(service, filePath) {
    const conversations = await this.db.getConversations(service, 1000, 0);

    // Export conversations to JSON file
    const jsonContent = JSON.stringify(conversations, null, 2);
    require('fs').writeFileSync(filePath, jsonContent);

    return {
      content: [
        {
          type: 'text',
          text: `Conversations exported to ${filePath}`,
        },
      ],
    };
  }

  async handleImportFromJSON(filePath) {
    const jsonData = require('fs').readFileSync(filePath, 'utf8');
    const conversations = JSON.parse(jsonData);

    // Save conversations to the database
    for (const conv of conversations) {
      const conversationDbId = await this.db.saveConversation(
        conv.service,
        conv.conversation_id,
        conv.title,
        conv.created_at,
        conv.updated_at,
        conv.url
      );

      // Save messages
      for (const message of conv.messages || []) {
        await this.db.saveMessage(
          conversationDbId,
          conv.service,
          message.role,
          message.content,
          message.timestamp,
          message.message_order
        );
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Conversations imported from ${filePath}`,
        },
      ],
    };
  }

  async handleConvertToHumanReadable(conversationId, filePath) {
    const messages = await this.db.getConversationMessages(conversationId);

    const humanReadableContent = messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const time = new Date(msg.timestamp).toLocaleString();
      return `[${role} - ${time}]: ${msg.content}`;
    }).join('\n\n');

    require('fs').writeFileSync(filePath, humanReadableContent);

    return {
      content: [
        {
          type: 'text',
          text: `Conversation ${conversationId} converted to human-readable format and saved to ${filePath}`,
        },
      ],
    };
  }

  async handleClear(service) {
    const deleted = await this.db.clearConversations(service);
    
    return {
      content: [
        {
          type: 'text',
          text: `Cleared ${deleted} conversations from ${service}`,
        },
      ],
    };
  }

  async handleSummary() {
    const services = ['chatgpt', 'grok', 'gemini', 'claude'];
    const summary = {};

    for (const service of services) {
      const conversations = await this.db.getConversations(service, 1000, 0);
      summary[service] = {
        total_conversations: conversations.length,
        latest_conversation: conversations[0]?.updated_at || 'None',
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  async handleAnalyzeConversation(conversationId) {
    const messages = await this.db.getConversationMessages(conversationId);
    const conversationText = messages.map(msg => msg.content).join(' ');
    
    const analysis = this.searchEngine.analyzeConversation({
      title: `Conversation ${conversationId}`,
      content: conversationText
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async handleGetTrendingTopics(service, limit = 10) {
    const conversations = await this.db.getConversations(service, 1000, 0);
    
    // Get messages for each conversation to analyze
    const conversationsWithContent = await Promise.all(
      conversations.map(async conv => {
        const messages = await this.db.getConversationMessages(conv.id);
        return {
          ...conv,
          content: messages.map(msg => msg.content).join(' ')
        };
      })
    );

    const trendingTopics = this.searchEngine.getTrendingTopics(conversationsWithContent, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trendingTopics, null, 2),
        },
      ],
    };
  }

  async handleGetKeywordInsights(service, limit = 20) {
    const conversations = await this.db.getConversations(service, 1000, 0);
    
    // Get messages for each conversation to analyze
    const conversationsWithContent = await Promise.all(
      conversations.map(async conv => {
        const messages = await this.db.getConversationMessages(conv.id);
        return {
          ...conv,
          content: messages.map(msg => msg.content).join(' ')
        };
      })
    );

    const keywordInsights = this.searchEngine.getKeywordInsights(conversationsWithContent, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(keywordInsights, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Aegntic Hive MCP server started');
  }

  async stop() {
    await this.scraper.close();
    this.db.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  process.exit(0);
});

// Start the server
const server = new AIConversationsMCP();
server.start().catch(console.error);
