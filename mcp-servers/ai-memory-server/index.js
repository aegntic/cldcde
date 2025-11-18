#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true });

class AIMemoryServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ai-memory-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'login_to_service',
          description: 'Login to an AI service (ChatGPT, Grok, Gemini, Claude) and save session',
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
          name: 'get_conversations',
          description: 'Retrieve conversations from a specific AI service',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                enum: ['chatgpt', 'grok', 'gemini', 'claude', 'all'],
                description: 'The AI service to get conversations from, or "all" for unified view',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of conversations to retrieve',
                default: 50,
              },
              search: {
                type: 'string',
                description: 'Search term to filter conversations',
              },
            },
            required: ['service'],
          },
        },
        {
          name: 'get_conversation_details',
          description: 'Get detailed messages from a specific conversation',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                description: 'The AI service',
              },
              conversation_id: {
                type: 'string',
                description: 'The conversation ID',
              },
            },
            required: ['service', 'conversation_id'],
          },
        },
        {
          name: 'search_across_all_services',
          description: 'Search for content across all AI services',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              services: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['chatgpt', 'grok', 'gemini', 'claude'],
                },
                description: 'Services to search in (default: all)',
              },
              date_range: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date' },
                  end: { type: 'string', format: 'date' },
                },
                description: 'Date range filter',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'sync_all_conversations',
          description: 'Sync conversations from all logged-in services',
          inputSchema: {
            type: 'object',
            properties: {
              force_refresh: {
                type: 'boolean',
                description: 'Force refresh even if recently synced',
                default: false,
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'memory://conversations/all',
          mimeType: 'application/json',
          name: 'All AI Conversations',
          description: 'Unified view of all conversations across AI services',
        },
        {
          uri: 'memory://conversations/chatgpt',
          mimeType: 'application/json',
          name: 'ChatGPT Conversations',
          description: 'ChatGPT conversation history',
        },
        {
          uri: 'memory://conversations/grok',
          mimeType: 'application/json',
          name: 'Grok Conversations',
          description: 'Grok conversation history',
        },
        {
          uri: 'memory://conversations/gemini',
          mimeType: 'application/json',
          name: 'Gemini Conversations',
          description: 'Gemini conversation history',
        },
        {
          uri: 'memory://conversations/claude',
          mimeType: 'application/json',
          name: 'Claude Conversations',
          description: 'Claude conversation history',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const service = uri.split('/').pop();
      
      if (service === 'all') {
        const allConversations = await this.getAllConversations();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(allConversations, null, 2),
          }],
        };
      }
      
      const conversations = await this.getConversationsFromService(service);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(conversations, null, 2),
        }],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'login_to_service':
            return await this.loginToService(args.service);
          case 'get_conversations':
            return await this.getConversations(args.service, args.limit, args.search);
          case 'get_conversation_details':
            return await this.getConversationDetails(args.service, args.conversation_id);
          case 'search_across_all_services':
            return await this.searchAcrossServices(args.query, args.services, args.date_range);
          case 'sync_all_conversations':
            return await this.syncAllConversations(args.force_refresh);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`,
          }],
          isError: true,
        };
      }
    });
  }

  async loginToService(service) {
    const browser = await puppeteer.launch({ 
      headless: false,
      userDataDir: path.join(DATA_DIR, `browser-${service}`),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const urls = {
        chatgpt: 'https://chat.openai.com/',
        grok: 'https://x.com/i/grok',
        gemini: 'https://gemini.google.com/',
        claude: 'https://claude.ai/'
      };

      await page.goto(urls[service]);
      
      return {
        content: [{
          type: 'text',
          text: `Browser opened for ${service}. Please login manually. The session will be saved automatically. Close the browser when done.`,
        }],
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async getConversations(service, limit = 50, search = null) {
    if (service === 'all') {
      return await this.getAllConversations(limit, search);
    }
    
    const conversations = await this.getConversationsFromService(service, limit, search);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(conversations, null, 2),
      }],
    };
  }

  async getConversationsFromService(service, limit = 50, search = null) {
    const browser = await puppeteer.launch({ 
      headless: true,
      userDataDir: path.join(DATA_DIR, `browser-${service}`),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const scrapers = {
        chatgpt: this.scrapeChatGPT,
        grok: this.scrapeGrok,
        gemini: this.scrapeGemini,
        claude: this.scrapeClaude
      };

      const scraper = scrapers[service];
      if (!scraper) {
        throw new Error(`Scraper not implemented for ${service}`);
      }

      const conversations = await scraper.call(this, page, limit, search);
      await this.saveConversations(service, conversations);
      
      return conversations;
    } finally {
      await browser.close();
    }
  }

  async scrapeChatGPT(page, limit, search) {
    await page.goto('https://chat.openai.com/');
    
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 10000 });
    
    // Get conversation list
    const conversations = await page.evaluate((limit, search) => {
      const items = document.querySelectorAll('[data-testid="conversation-turn"]');
      const results = [];
      
      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        const titleElement = item.querySelector('h3');
        const timeElement = item.querySelector('time');
        
        if (titleElement) {
          const title = titleElement.textContent.trim();
          const time = timeElement ? timeElement.getAttribute('datetime') : null;
          
          if (!search || title.toLowerCase().includes(search.toLowerCase())) {
            results.push({
              id: item.getAttribute('data-conversation-id') || `chatgpt-${i}`,
              title,
              timestamp: time,
              service: 'chatgpt',
              url: item.querySelector('a')?.href || ''
            });
          }
        }
      }
      
      return results;
    }, limit, search);
    
    return conversations;
  }

  async scrapeGrok(page, limit, search) {
    await page.goto('https://x.com/i/grok');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="cellInnerDiv"]', { timeout: 10000 });
    
    const conversations = await page.evaluate((limit, search) => {
      const items = document.querySelectorAll('[data-testid="cellInnerDiv"]');
      const results = [];
      
      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        const textContent = item.textContent.trim();
        
        if (textContent && (!search || textContent.toLowerCase().includes(search.toLowerCase()))) {
          results.push({
            id: `grok-${i}`,
            title: textContent.substring(0, 100) + '...',
            timestamp: new Date().toISOString(),
            service: 'grok',
            content: textContent
          });
        }
      }
      
      return results;
    }, limit, search);
    
    return conversations;
  }

  async scrapeGemini(page, limit, search) {
    await page.goto('https://gemini.google.com/');
    
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 10000 });
    
    const conversations = await page.evaluate((limit, search) => {
      const items = document.querySelectorAll('[data-testid="conversation-turn"]');
      const results = [];
      
      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        const textContent = item.textContent.trim();
        
        if (textContent && (!search || textContent.toLowerCase().includes(search.toLowerCase()))) {
          results.push({
            id: `gemini-${i}`,
            title: textContent.substring(0, 100) + '...',
            timestamp: new Date().toISOString(),
            service: 'gemini',
            content: textContent
          });
        }
      }
      
      return results;
    }, limit, search);
    
    return conversations;
  }

  async scrapeClaude(page, limit, search) {
    await page.goto('https://claude.ai/');
    
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 10000 });
    
    const conversations = await page.evaluate((limit, search) => {
      const items = document.querySelectorAll('[data-testid="conversation-item"]');
      const results = [];
      
      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        const titleElement = item.querySelector('h3, .conversation-title');
        const timeElement = item.querySelector('[data-testid="conversation-time"]');
        
        if (titleElement) {
          const title = titleElement.textContent.trim();
          const time = timeElement ? timeElement.textContent : null;
          
          if (!search || title.toLowerCase().includes(search.toLowerCase())) {
            results.push({
              id: `claude-${i}`,
              title,
              timestamp: time,
              service: 'claude',
              url: item.querySelector('a')?.href || ''
            });
          }
        }
      }
      
      return results;
    }, limit, search);
    
    return conversations;
  }

  async getAllConversations(limit = 50, search = null) {
    const services = ['chatgpt', 'grok', 'gemini', 'claude'];
    const allConversations = [];
    
    for (const service of services) {
      try {
        const conversations = await this.getConversationsFromService(service, limit, search);
        allConversations.push(...conversations);
      } catch (error) {
        console.error(`Error getting conversations from ${service}:`, error.message);
      }
    }
    
    // Sort by timestamp (newest first)
    allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return allConversations.slice(0, limit);
  }

  async getConversationDetails(service, conversationId) {
    const browser = await puppeteer.launch({ 
      headless: true,
      userDataDir: path.join(DATA_DIR, `browser-${service}`),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to specific conversation
      const urls = {
        chatgpt: `https://chat.openai.com/c/${conversationId}`,
        grok: `https://x.com/i/grok`,
        gemini: `https://gemini.google.com/app/${conversationId}`,
        claude: `https://claude.ai/chat/${conversationId}`
      };

      await page.goto(urls[service]);
      
      // Extract conversation messages
      const messages = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[data-testid="conversation-turn"], .message, .chat-message');
        const messages = [];
        
        messageElements.forEach((element, index) => {
          const text = element.textContent.trim();
          const isUser = element.classList.contains('user') || element.getAttribute('data-author') === 'user';
          
          if (text) {
            messages.push({
              id: index,
              role: isUser ? 'user' : 'assistant',
              content: text,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        return messages;
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(messages, null, 2),
        }],
      };
    } finally {
      await browser.close();
    }
  }

  async searchAcrossServices(query, services = ['chatgpt', 'grok', 'gemini', 'claude'], dateRange = null) {
    const results = [];
    
    for (const service of services) {
      try {
        const conversations = await this.getConversationsFromService(service, 100, query);
        
        const filtered = conversations.filter(conv => {
          const matchesQuery = conv.title.toLowerCase().includes(query.toLowerCase()) ||
                              (conv.content && conv.content.toLowerCase().includes(query.toLowerCase()));
          
          if (!matchesQuery) return false;
          
          if (dateRange) {
            const convDate = new Date(conv.timestamp);
            const start = dateRange.start ? new Date(dateRange.start) : null;
            const end = dateRange.end ? new Date(dateRange.end) : null;
            
            if (start && convDate < start) return false;
            if (end && convDate > end) return false;
          }
          
          return true;
        });
        
        results.push(...filtered);
      } catch (error) {
        console.error(`Error searching ${service}:`, error.message);
      }
    }
    
    // Sort by relevance and timestamp
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }

  async syncAllConversations(forceRefresh = false) {
    const services = ['chatgpt', 'grok', 'gemini', 'claude'];
    const results = {};
    
    for (const service of services) {
      try {
        const conversations = await this.getConversationsFromService(service, 100);
        results[service] = {
          count: conversations.length,
          lastSync: new Date().toISOString()
        };
      } catch (error) {
        results[service] = {
          error: error.message,
          lastSync: new Date().toISOString()
        };
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }

  async saveConversations(service, conversations) {
    const filePath = path.join(DATA_DIR, `${service}-conversations.json`);
    await fs.writeFile(filePath, JSON.stringify(conversations, null, 2));
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Memory MCP server running on stdio');
  }
}

const server = new AIMemoryServer();
server.run().catch(console.error);
