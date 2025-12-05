import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import path from 'path';
import { n8nDocumentationToolsFinal } from './tools';
import { n8nManagementTools } from './tools-n8n-manager';
import { logger } from '../utils/logger';
import { NodeRepository } from '../database/node-repository';
import { DatabaseAdapter, createDatabaseAdapter } from '../database/database-adapter';
import { PropertyFilter } from '../services/property-filter';
import { ExampleGenerator } from '../services/example-generator';
import { TaskTemplates } from '../services/task-templates';
import { ConfigValidator } from '../services/config-validator';
import { EnhancedConfigValidator, ValidationMode, ValidationProfile } from '../services/enhanced-config-validator';
import { PropertyDependencies } from '../services/property-dependencies';
import { SimpleCache } from '../utils/simple-cache';
import { TemplateService } from '../templates/template-service';
import { WorkflowValidator } from '../services/workflow-validator';
import { isN8nApiConfigured } from '../config/n8n-api';
import * as n8nHandlers from './handlers-n8n-manager';
import { handleUpdatePartialWorkflow } from './handlers-workflow-diff';
import { getToolDocumentation, getToolsOverview } from './tools-documentation';
import { PROJECT_VERSION } from '../utils/version';

interface NodeRow {
  node_type: string;
  package_name: string;
  display_name: string;
  description?: string;
  category?: string;
  development_style?: string;
  is_ai_tool: number;
  is_trigger: number;
  is_webhook: number;
  is_versioned: number;
  version?: string;
  documentation?: string;
  properties_schema?: string;
  operations?: string;
  credentials_required?: string;
}

export class N8NDocumentationMCPServer {
  private server: Server;
  private db: DatabaseAdapter | null = null;
  private repository: NodeRepository | null = null;
  private templateService: TemplateService | null = null;
  private initialized: Promise<void>;
  private cache = new SimpleCache();

  constructor() {
    // Try multiple database paths
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'nodes.db'),
      path.join(__dirname, '../../data', 'nodes.db'),
      './data/nodes.db'
    ];
    
    let dbPath: string | null = null;
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        dbPath = p;
        break;
      }
    }
    
    if (!dbPath) {
      logger.error('Database not found in any of the expected locations:', possiblePaths);
      throw new Error('Database nodes.db not found. Please run npm run rebuild first.');
    }
    
    // Initialize database asynchronously
    this.initialized = this.initializeDatabase(dbPath);
    
    logger.info('Initializing n8n Documentation MCP server');
    
    // Log n8n API configuration status at startup
    const apiConfigured = isN8nApiConfigured();
    const totalTools = apiConfigured ? 
      n8nDocumentationToolsFinal.length + n8nManagementTools.length : 
      n8nDocumentationToolsFinal.length;
    
    logger.info(`MCP server initialized with ${totalTools} tools (n8n API: ${apiConfigured ? 'configured' : 'not configured'})`);
    
    this.server = new Server(
      {
        name: 'n8n-documentation-mcp',
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
  
  private async initializeDatabase(dbPath: string): Promise<void> {
    try {
      this.db = await createDatabaseAdapter(dbPath);
      this.repository = new NodeRepository(this.db);
      this.templateService = new TemplateService(this.db);
      logger.info(`Initialized database from: ${dbPath}`);
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw new Error(`Failed to open database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    await this.initialized;
    if (!this.db || !this.repository) {
      throw new Error('Database not initialized');
    }
  }

  private setupHandlers(): void {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async () => {
      const response = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'n8n-documentation-mcp',
          version: PROJECT_VERSION,
        },
      };
      
      // Debug logging
      if (process.env.DEBUG_MCP === 'true') {
        logger.debug('Initialize handler called', { response });
      }
      
      return response;
    });

    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Combine documentation tools with management tools if API is configured
      const tools = [...n8nDocumentationToolsFinal];
      const isConfigured = isN8nApiConfigured();
      
      if (isConfigured) {
        tools.push(...n8nManagementTools);
        logger.debug(`Tool listing: ${tools.length} tools available (${n8nDocumentationToolsFinal.length} documentation + ${n8nManagementTools.length} management)`);
      } else {
        logger.debug(`Tool listing: ${tools.length} tools available (documentation only)`);
      }
      
      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        logger.debug(`Executing tool: ${name}`, { args });
        const result = await this.executeTool(name, args);
        logger.debug(`Tool ${name} executed successfully`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'tools_documentation':
        return this.getToolsDocumentation(args.topic, args.depth);
      case 'list_nodes':
        return this.listNodes(args);
      case 'get_node_info':
        return this.getNodeInfo(args.nodeType);
      case 'search_nodes':
        return this.searchNodes(args.query, args.limit);
      case 'list_ai_tools':
        return this.listAITools();
      case 'get_node_documentation':
        return this.getNodeDocumentation(args.nodeType);
      case 'get_database_statistics':
        return this.getDatabaseStatistics();
      case 'get_node_essentials':
        return this.getNodeEssentials(args.nodeType);
      case 'search_node_properties':
        return this.searchNodeProperties(args.nodeType, args.query, args.maxResults);
      case 'get_node_for_task':
        return this.getNodeForTask(args.task);
      case 'list_tasks':
        return this.listTasks(args.category);
      case 'validate_node_operation':
        return this.validateNodeConfig(args.nodeType, args.config, 'operation', args.profile);
      case 'validate_node_minimal':
        return this.validateNodeMinimal(args.nodeType, args.config);
      case 'get_property_dependencies':
        return this.getPropertyDependencies(args.nodeType, args.config);
      case 'get_node_as_tool_info':
        return this.getNodeAsToolInfo(args.nodeType);
      case 'list_node_templates':
        return this.listNodeTemplates(args.nodeTypes, args.limit);
      case 'get_template':
        return this.getTemplate(args.templateId);
      case 'search_templates':
        return this.searchTemplates(args.query, args.limit);
      case 'get_templates_for_task':
        return this.getTemplatesForTask(args.task);
      case 'validate_workflow':
        return this.validateWorkflow(args.workflow, args.options);
      case 'validate_workflow_connections':
        return this.validateWorkflowConnections(args.workflow);
      case 'validate_workflow_expressions':
        return this.validateWorkflowExpressions(args.workflow);
      
      // n8n Management Tools (if API is configured)
      case 'n8n_create_workflow':
        return n8nHandlers.handleCreateWorkflow(args);
      case 'n8n_get_workflow':
        return n8nHandlers.handleGetWorkflow(args);
      case 'n8n_get_workflow_details':
        return n8nHandlers.handleGetWorkflowDetails(args);
      case 'n8n_get_workflow_structure':
        return n8nHandlers.handleGetWorkflowStructure(args);
      case 'n8n_get_workflow_minimal':
        return n8nHandlers.handleGetWorkflowMinimal(args);
      case 'n8n_update_full_workflow':
        return n8nHandlers.handleUpdateWorkflow(args);
      case 'n8n_update_partial_workflow':
        return handleUpdatePartialWorkflow(args);
      case 'n8n_delete_workflow':
        return n8nHandlers.handleDeleteWorkflow(args);
      case 'n8n_list_workflows':
        return n8nHandlers.handleListWorkflows(args);
      case 'n8n_validate_workflow':
        await this.ensureInitialized();
        if (!this.repository) throw new Error('Repository not initialized');
        return n8nHandlers.handleValidateWorkflow(args, this.repository);
      case 'n8n_trigger_webhook_workflow':
        return n8nHandlers.handleTriggerWebhookWorkflow(args);
      case 'n8n_get_execution':
        return n8nHandlers.handleGetExecution(args);
      case 'n8n_list_executions':
        return n8nHandlers.handleListExecutions(args);
      case 'n8n_delete_execution':
        return n8nHandlers.handleDeleteExecution(args);
      case 'n8n_health_check':
        return n8nHandlers.handleHealthCheck();
      case 'n8n_list_available_tools':
        return n8nHandlers.handleListAvailableTools();
      case 'n8n_diagnostic':
        return n8nHandlers.handleDiagnostic({ params: { arguments: args } });
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async listNodes(filters: any = {}): Promise<any> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM nodes WHERE 1=1';
    const params: any[] = [];
    
    // console.log('DEBUG list_nodes:', { filters, query, params }); // Removed to prevent stdout interference

    if (filters.package) {
      // Handle both formats
      const packageVariants = [
        filters.package,
        `@n8n/${filters.package}`,
        filters.package.replace('@n8n/', '')
      ];
      query += ' AND package_name IN (' + packageVariants.map(() => '?').join(',') + ')';
      params.push(...packageVariants);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.developmentStyle) {
      query += ' AND development_style = ?';
      params.push(filters.developmentStyle);
    }

    if (filters.isAITool !== undefined) {
      query += ' AND is_ai_tool = ?';
      params.push(filters.isAITool ? 1 : 0);
    }

    query += ' ORDER BY display_name';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const nodes = this.db!.prepare(query).all(...params) as NodeRow[];
    
    return {
      nodes: nodes.map(node => ({
        nodeType: node.node_type,
        displayName: node.display_name,
        description: node.description,
        category: node.category,
        package: node.package_name,
        developmentStyle: node.development_style,
        isAITool: !!node.is_ai_tool,
        isTrigger: !!node.is_trigger,
        isVersioned: !!node.is_versioned,
      })),
      totalCount: nodes.length,
    };
  }

  private async getNodeInfo(nodeType: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Add AI tool capabilities information
    const aiToolCapabilities = {
      canBeUsedAsTool: true, // Any node can be used as a tool in n8n
      hasUsableAsToolProperty: node.isAITool,
      requiresEnvironmentVariable: !node.isAITool && node.package !== 'n8n-nodes-base',
      toolConnectionType: 'ai_tool',
      commonToolUseCases: this.getCommonAIToolUseCases(node.nodeType),
      environmentRequirement: node.package !== 'n8n-nodes-base' ? 
        'N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true' : 
        null
    };
    
    return {
      ...node,
      aiToolCapabilities
    };
  }

  private async searchNodes(query: string, limit: number = 20): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    // Handle exact phrase searches with quotes
    if (query.startsWith('"') && query.endsWith('"')) {
      const exactPhrase = query.slice(1, -1);
      const nodes = this.db!.prepare(`
        SELECT * FROM nodes 
        WHERE node_type LIKE ? OR display_name LIKE ? OR description LIKE ?
        ORDER BY display_name
        LIMIT ?
      `).all(`%${exactPhrase}%`, `%${exactPhrase}%`, `%${exactPhrase}%`, limit) as NodeRow[];
      
      return { 
        query, 
        results: nodes.map(node => ({
          nodeType: node.node_type,
          displayName: node.display_name,
          description: node.description,
          category: node.category,
          package: node.package_name
        })), 
        totalCount: nodes.length 
      };
    }
    
    // Split into words for normal search
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
      return { query, results: [], totalCount: 0 };
    }
    
    // Build conditions for each word
    const conditions = words.map(() => 
      '(node_type LIKE ? OR display_name LIKE ? OR description LIKE ?)'
    ).join(' OR ');
    
    const params: any[] = words.flatMap(w => [`%${w}%`, `%${w}%`, `%${w}%`]);
    params.push(limit);
    
    const nodes = this.db!.prepare(`
      SELECT DISTINCT * FROM nodes 
      WHERE ${conditions}
      ORDER BY display_name
      LIMIT ?
    `).all(...params) as NodeRow[];
    
    return {
      query,
      results: nodes.map(node => ({
        nodeType: node.node_type,
        displayName: node.display_name,
        description: node.description,
        category: node.category,
        package: node.package_name
      })),
      totalCount: nodes.length
    };
  }

  private calculateRelevance(node: NodeRow, query: string): string {
    const lowerQuery = query.toLowerCase();
    if (node.node_type.toLowerCase().includes(lowerQuery)) return 'high';
    if (node.display_name.toLowerCase().includes(lowerQuery)) return 'high';
    if (node.description?.toLowerCase().includes(lowerQuery)) return 'medium';
    return 'low';
  }

  private async listAITools(): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    const tools = this.repository.getAITools();
    
    // Debug: Check if is_ai_tool column is populated
    const aiCount = this.db!.prepare('SELECT COUNT(*) as ai_count FROM nodes WHERE is_ai_tool = 1').get() as any;
    // console.log('DEBUG list_ai_tools:', { 
    //   toolsLength: tools.length, 
    //   aiCountInDB: aiCount.ai_count,
    //   sampleTools: tools.slice(0, 3)
    // }); // Removed to prevent stdout interference
    
    return {
      tools,
      totalCount: tools.length,
      requirements: {
        environmentVariable: 'N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true',
        nodeProperty: 'usableAsTool: true',
      },
      usage: {
        description: 'These nodes have the usableAsTool property set to true, making them optimized for AI agent usage.',
        note: 'ANY node in n8n can be used as an AI tool by connecting it to the ai_tool port of an AI Agent node.',
        examples: [
          'Regular nodes like Slack, Google Sheets, or HTTP Request can be used as tools',
          'Connect any node to an AI Agent\'s tool port to make it available for AI-driven automation',
          'Community nodes require the environment variable to be set'
        ]
      }
    };
  }

  private async getNodeDocumentation(nodeType: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    const node = this.db!.prepare(`
      SELECT node_type, display_name, documentation, description 
      FROM nodes 
      WHERE node_type = ?
    `).get(nodeType) as NodeRow | undefined;
    
    if (!node) {
      throw new Error(`Node ${nodeType} not found`);
    }
    
    // If no documentation, generate fallback
    if (!node.documentation) {
      const essentials = await this.getNodeEssentials(nodeType);
      
      return {
        nodeType: node.node_type,
        displayName: node.display_name,
        documentation: `
# ${node.display_name}

${node.description || 'No description available.'}

## Common Properties

${essentials.commonProperties.map((p: any) => 
  `### ${p.displayName}\n${p.description || `Type: ${p.type}`}`
).join('\n\n')}

## Note
Full documentation is being prepared. For now, use get_node_essentials for configuration help.
`,
        hasDocumentation: false
      };
    }
    
    return {
      nodeType: node.node_type,
      displayName: node.display_name,
      documentation: node.documentation,
      hasDocumentation: true,
    };
  }

  private async getDatabaseStatistics(): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    const stats = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(is_ai_tool) as ai_tools,
        SUM(is_trigger) as triggers,
        SUM(is_versioned) as versioned,
        SUM(CASE WHEN documentation IS NOT NULL THEN 1 ELSE 0 END) as with_docs,
        COUNT(DISTINCT package_name) as packages,
        COUNT(DISTINCT category) as categories
      FROM nodes
    `).get() as any;
    
    const packages = this.db!.prepare(`
      SELECT package_name, COUNT(*) as count 
      FROM nodes 
      GROUP BY package_name
    `).all() as any[];
    
    return {
      totalNodes: stats.total,
      statistics: {
        aiTools: stats.ai_tools,
        triggers: stats.triggers,
        versionedNodes: stats.versioned,
        nodesWithDocumentation: stats.with_docs,
        documentationCoverage: Math.round((stats.with_docs / stats.total) * 100) + '%',
        uniquePackages: stats.packages,
        uniqueCategories: stats.categories,
      },
      packageBreakdown: packages.map(pkg => ({
        package: pkg.package_name,
        nodeCount: pkg.count,
      })),
    };
  }

  private async getNodeEssentials(nodeType: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Check cache first
    const cacheKey = `essentials:${nodeType}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Get the full node information
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Get properties (already parsed by repository)
    const allProperties = node.properties || [];
    
    // Get essential properties
    const essentials = PropertyFilter.getEssentials(allProperties, node.nodeType);
    
    // Generate examples
    const examples = ExampleGenerator.getExamples(node.nodeType, essentials);
    
    // Get operations (already parsed by repository)
    const operations = node.operations || [];
    
    const result = {
      nodeType: node.nodeType,
      displayName: node.displayName,
      description: node.description,
      category: node.category,
      version: node.version || '1',
      isVersioned: node.isVersioned || false,
      requiredProperties: essentials.required,
      commonProperties: essentials.common,
      operations: operations.map((op: any) => ({
        name: op.name || op.operation,
        description: op.description,
        action: op.action,
        resource: op.resource
      })),
      examples,
      metadata: {
        totalProperties: allProperties.length,
        isAITool: node.isAITool,
        isTrigger: node.isTrigger,
        isWebhook: node.isWebhook,
        hasCredentials: node.credentials ? true : false,
        package: node.package,
        developmentStyle: node.developmentStyle || 'programmatic'
      }
    };
    
    // Cache for 1 hour
    this.cache.set(cacheKey, result, 3600);
    
    return result;
  }

  private async searchNodeProperties(nodeType: string, query: string, maxResults: number = 20): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Get the node
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Get properties and search (already parsed by repository)
    const allProperties = node.properties || [];
    const matches = PropertyFilter.searchProperties(allProperties, query, maxResults);
    
    return {
      nodeType: node.nodeType,
      query,
      matches: matches.map((match: any) => ({
        name: match.name,
        displayName: match.displayName,
        type: match.type,
        description: match.description,
        path: match.path || match.name,
        required: match.required,
        default: match.default,
        options: match.options,
        showWhen: match.showWhen
      })),
      totalMatches: matches.length,
      searchedIn: allProperties.length + ' properties'
    };
  }

  private async getNodeForTask(task: string): Promise<any> {
    const template = TaskTemplates.getTaskTemplate(task);
    
    if (!template) {
      // Try to find similar tasks
      const similar = TaskTemplates.searchTasks(task);
      throw new Error(
        `Unknown task: ${task}. ` +
        (similar.length > 0 
          ? `Did you mean: ${similar.slice(0, 3).join(', ')}?`
          : `Use 'list_tasks' to see available tasks.`)
      );
    }
    
    return {
      task: template.task,
      description: template.description,
      nodeType: template.nodeType,
      configuration: template.configuration,
      userMustProvide: template.userMustProvide,
      optionalEnhancements: template.optionalEnhancements || [],
      notes: template.notes || [],
      example: {
        node: {
          type: template.nodeType,
          parameters: template.configuration
        },
        userInputsNeeded: template.userMustProvide.map(p => ({
          property: p.property,
          currentValue: this.getPropertyValue(template.configuration, p.property),
          description: p.description,
          example: p.example
        }))
      }
    };
  }
  
  private getPropertyValue(config: any, path: string): any {
    const parts = path.split('.');
    let value = config;
    
    for (const part of parts) {
      // Handle array notation like parameters[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        value = value?.[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        value = value?.[part];
      }
    }
    
    return value;
  }
  
  private async listTasks(category?: string): Promise<any> {
    if (category) {
      const categories = TaskTemplates.getTaskCategories();
      const tasks = categories[category];
      
      if (!tasks) {
        throw new Error(
          `Unknown category: ${category}. Available categories: ${Object.keys(categories).join(', ')}`
        );
      }
      
      return {
        category,
        tasks: tasks.map(task => {
          const template = TaskTemplates.getTaskTemplate(task);
          return {
            task,
            description: template?.description || '',
            nodeType: template?.nodeType || ''
          };
        })
      };
    }
    
    // Return all tasks grouped by category
    const categories = TaskTemplates.getTaskCategories();
    const result: any = {
      totalTasks: TaskTemplates.getAllTasks().length,
      categories: {}
    };
    
    for (const [cat, tasks] of Object.entries(categories)) {
      result.categories[cat] = tasks.map(task => {
        const template = TaskTemplates.getTaskTemplate(task);
        return {
          task,
          description: template?.description || '',
          nodeType: template?.nodeType || ''
        };
      });
    }
    
    return result;
  }
  
  private async validateNodeConfig(
    nodeType: string, 
    config: Record<string, any>, 
    mode: ValidationMode = 'operation',
    profile: ValidationProfile = 'ai-friendly'
  ): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Get node info to access properties
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Get properties
    const properties = node.properties || [];
    
    // Use enhanced validator with operation mode by default
    const validationResult = EnhancedConfigValidator.validateWithMode(
      node.nodeType, 
      config, 
      properties, 
      mode,
      profile
    );
    
    // Add node context to result
    return {
      nodeType: node.nodeType,
      displayName: node.displayName,
      ...validationResult,
      summary: {
        hasErrors: !validationResult.valid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        suggestionCount: validationResult.suggestions.length
      }
    };
  }
  
  private async getPropertyDependencies(nodeType: string, config?: Record<string, any>): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Get node info to access properties
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Get properties
    const properties = node.properties || [];
    
    // Analyze dependencies
    const analysis = PropertyDependencies.analyze(properties);
    
    // If config provided, check visibility impact
    let visibilityImpact = null;
    if (config) {
      visibilityImpact = PropertyDependencies.getVisibilityImpact(properties, config);
    }
    
    return {
      nodeType: node.nodeType,
      displayName: node.displayName,
      ...analysis,
      currentConfig: config ? {
        providedValues: config,
        visibilityImpact
      } : undefined
    };
  }
  
  private async getNodeAsToolInfo(nodeType: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Get node info
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Determine common AI tool use cases based on node type
    const commonUseCases = this.getCommonAIToolUseCases(node.nodeType);
    
    // Build AI tool capabilities info
    const aiToolCapabilities = {
      canBeUsedAsTool: true, // In n8n, ANY node can be used as a tool when connected to AI Agent
      hasUsableAsToolProperty: node.isAITool,
      requiresEnvironmentVariable: !node.isAITool && node.package !== 'n8n-nodes-base',
      connectionType: 'ai_tool',
      commonUseCases,
      requirements: {
        connection: 'Connect to the "ai_tool" port of an AI Agent node',
        environment: node.package !== 'n8n-nodes-base' ? 
          'Set N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true for community nodes' : 
          'No special environment variables needed for built-in nodes'
      },
      examples: this.getAIToolExamples(node.nodeType),
      tips: [
        'Give the tool a clear, descriptive name in the AI Agent settings',
        'Write a detailed tool description to help the AI understand when to use it',
        'Test the node independently before connecting it as a tool',
        node.isAITool ? 
          'This node is optimized for AI tool usage' : 
          'This is a regular node that can be used as an AI tool'
      ]
    };
    
    return {
      nodeType: node.nodeType,
      displayName: node.displayName,
      description: node.description,
      package: node.package,
      isMarkedAsAITool: node.isAITool,
      aiToolCapabilities
    };
  }
  
  private getCommonAIToolUseCases(nodeType: string): string[] {
    const useCaseMap: Record<string, string[]> = {
      'nodes-base.slack': [
        'Send notifications about task completion',
        'Post updates to channels',
        'Send direct messages',
        'Create alerts and reminders'
      ],
      'nodes-base.googleSheets': [
        'Read data for analysis',
        'Log results and outputs',
        'Update spreadsheet records',
        'Create reports'
      ],
      'nodes-base.gmail': [
        'Send email notifications',
        'Read and process emails',
        'Send reports and summaries',
        'Handle email-based workflows'
      ],
      'nodes-base.httpRequest': [
        'Call external APIs',
        'Fetch data from web services',
        'Send webhooks',
        'Integrate with any REST API'
      ],
      'nodes-base.postgres': [
        'Query database for information',
        'Store analysis results',
        'Update records based on AI decisions',
        'Generate reports from data'
      ],
      'nodes-base.webhook': [
        'Receive external triggers',
        'Create callback endpoints',
        'Handle incoming data',
        'Integrate with external systems'
      ]
    };
    
    // Check for partial matches
    for (const [key, useCases] of Object.entries(useCaseMap)) {
      if (nodeType.includes(key)) {
        return useCases;
      }
    }
    
    // Generic use cases for unknown nodes
    return [
      'Perform automated actions',
      'Integrate with external services',
      'Process and transform data',
      'Extend AI agent capabilities'
    ];
  }
  
  private getAIToolExamples(nodeType: string): any {
    const exampleMap: Record<string, any> = {
      'nodes-base.slack': {
        toolName: 'Send Slack Message',
        toolDescription: 'Sends a message to a specified Slack channel or user. Use this to notify team members about important events or results.',
        nodeConfig: {
          resource: 'message',
          operation: 'post',
          channel: '={{ $fromAI("channel", "The Slack channel to send to, e.g. #general") }}',
          text: '={{ $fromAI("message", "The message content to send") }}'
        }
      },
      'nodes-base.googleSheets': {
        toolName: 'Update Google Sheet',
        toolDescription: 'Reads or updates data in a Google Sheets spreadsheet. Use this to log information, retrieve data, or update records.',
        nodeConfig: {
          operation: 'append',
          sheetId: 'your-sheet-id',
          range: 'A:Z',
          dataMode: 'autoMap'
        }
      },
      'nodes-base.httpRequest': {
        toolName: 'Call API',
        toolDescription: 'Makes HTTP requests to external APIs. Use this to fetch data, trigger webhooks, or integrate with any web service.',
        nodeConfig: {
          method: '={{ $fromAI("method", "HTTP method: GET, POST, PUT, DELETE") }}',
          url: '={{ $fromAI("url", "The complete API endpoint URL") }}',
          sendBody: true,
          bodyContentType: 'json',
          jsonBody: '={{ $fromAI("body", "Request body as JSON object") }}'
        }
      }
    };
    
    // Check for exact match or partial match
    for (const [key, example] of Object.entries(exampleMap)) {
      if (nodeType.includes(key)) {
        return example;
      }
    }
    
    // Generic example
    return {
      toolName: 'Custom Tool',
      toolDescription: 'Performs specific operations. Describe what this tool does and when to use it.',
      nodeConfig: {
        note: 'Configure the node based on its specific requirements'
      }
    };
  }
  
  private async validateNodeMinimal(nodeType: string, config: Record<string, any>): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Get node info
    let node = this.repository.getNode(nodeType);
    
    if (!node) {
      // Try alternative formats
      const alternatives = [
        nodeType,
        nodeType.replace('n8n-nodes-base.', ''),
        `n8n-nodes-base.${nodeType}`,
        nodeType.toLowerCase()
      ];
      
      for (const alt of alternatives) {
        const found = this.repository!.getNode(alt);
        if (found) {
          node = found;
          break;
        }
      }
      
      if (!node) {
        throw new Error(`Node ${nodeType} not found`);
      }
    }
    
    // Get properties  
    const properties = node.properties || [];
    
    // Extract operation context
    const operationContext = {
      resource: config.resource,
      operation: config.operation,
      action: config.action,
      mode: config.mode
    };
    
    // Find missing required fields
    const missingFields: string[] = [];
    
    for (const prop of properties) {
      // Skip if not required
      if (!prop.required) continue;
      
      // Skip if not visible based on current config
      if (prop.displayOptions) {
        let isVisible = true;
        
        // Check show conditions
        if (prop.displayOptions.show) {
          for (const [key, values] of Object.entries(prop.displayOptions.show)) {
            const configValue = config[key];
            const expectedValues = Array.isArray(values) ? values : [values];
            
            if (!expectedValues.includes(configValue)) {
              isVisible = false;
              break;
            }
          }
        }
        
        // Check hide conditions
        if (isVisible && prop.displayOptions.hide) {
          for (const [key, values] of Object.entries(prop.displayOptions.hide)) {
            const configValue = config[key];
            const expectedValues = Array.isArray(values) ? values : [values];
            
            if (expectedValues.includes(configValue)) {
              isVisible = false;
              break;
            }
          }
        }
        
        if (!isVisible) continue;
      }
      
      // Check if field is missing
      if (!(prop.name in config)) {
        missingFields.push(prop.displayName || prop.name);
      }
    }
    
    return {
      nodeType: node.nodeType,
      displayName: node.displayName,
      valid: missingFields.length === 0,
      missingRequiredFields: missingFields
    };
  }

  // Method removed - replaced by getToolsDocumentation

  private async getToolsDocumentation(topic?: string, depth: 'essentials' | 'full' = 'essentials'): Promise<string> {
    if (!topic || topic === 'overview') {
      return getToolsOverview(depth);
    }
    
    return getToolDocumentation(topic, depth);
  }

  // Add connect method to accept any transport
  async connect(transport: any): Promise<void> {
    await this.ensureInitialized();
    await this.server.connect(transport);
    logger.info('MCP Server connected', { 
      transportType: transport.constructor.name 
    });
  }
  
  // Template-related methods
  private async listNodeTemplates(nodeTypes: string[], limit: number = 10): Promise<any> {
    await this.ensureInitialized();
    if (!this.templateService) throw new Error('Template service not initialized');
    
    const templates = await this.templateService.listNodeTemplates(nodeTypes, limit);
    
    if (templates.length === 0) {
      return {
        message: `No templates found using nodes: ${nodeTypes.join(', ')}`,
        tip: "Try searching with more common nodes or run 'npm run fetch:templates' to update template database",
        templates: []
      };
    }
    
    return {
      templates,
      count: templates.length,
      tip: `Use get_template(templateId) to get the full workflow JSON for any template`
    };
  }
  
  private async getTemplate(templateId: number): Promise<any> {
    await this.ensureInitialized();
    if (!this.templateService) throw new Error('Template service not initialized');
    
    const template = await this.templateService.getTemplate(templateId);
    
    if (!template) {
      return {
        error: `Template ${templateId} not found`,
        tip: "Use list_node_templates or search_templates to find available templates"
      };
    }
    
    return {
      template,
      usage: "Import this workflow JSON directly into n8n or use it as a reference for building workflows"
    };
  }
  
  private async searchTemplates(query: string, limit: number = 20): Promise<any> {
    await this.ensureInitialized();
    if (!this.templateService) throw new Error('Template service not initialized');
    
    const templates = await this.templateService.searchTemplates(query, limit);
    
    if (templates.length === 0) {
      return {
        message: `No templates found matching: "${query}"`,
        tip: "Try different keywords or run 'npm run fetch:templates' to update template database",
        templates: []
      };
    }
    
    return {
      templates,
      count: templates.length,
      query
    };
  }
  
  private async getTemplatesForTask(task: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.templateService) throw new Error('Template service not initialized');
    
    const templates = await this.templateService.getTemplatesForTask(task);
    const availableTasks = this.templateService.listAvailableTasks();
    
    if (templates.length === 0) {
      return {
        message: `No templates found for task: ${task}`,
        availableTasks,
        tip: "Try a different task or use search_templates for custom searches"
      };
    }
    
    return {
      task,
      templates,
      count: templates.length,
      description: this.getTaskDescription(task)
    };
  }
  
  private getTaskDescription(task: string): string {
    const descriptions: Record<string, string> = {
      'ai_automation': 'AI-powered workflows using OpenAI, LangChain, and other AI tools',
      'data_sync': 'Synchronize data between databases, spreadsheets, and APIs',
      'webhook_processing': 'Process incoming webhooks and trigger automated actions',
      'email_automation': 'Send, receive, and process emails automatically',
      'slack_integration': 'Integrate with Slack for notifications and bot interactions',
      'data_transformation': 'Transform, clean, and manipulate data',
      'file_processing': 'Handle file uploads, downloads, and transformations',
      'scheduling': 'Schedule recurring tasks and time-based automations',
      'api_integration': 'Connect to external APIs and web services',
      'database_operations': 'Query, insert, update, and manage database records'
    };
    
    return descriptions[task] || 'Workflow templates for this task';
  }

  private async validateWorkflow(workflow: any, options?: any): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Create workflow validator instance
    const validator = new WorkflowValidator(
      this.repository,
      EnhancedConfigValidator
    );
    
    try {
      const result = await validator.validateWorkflow(workflow, options);
      
      // Format the response for better readability
      const response: any = {
        valid: result.valid,
        summary: {
          totalNodes: result.statistics.totalNodes,
          enabledNodes: result.statistics.enabledNodes,
          triggerNodes: result.statistics.triggerNodes,
          validConnections: result.statistics.validConnections,
          invalidConnections: result.statistics.invalidConnections,
          expressionsValidated: result.statistics.expressionsValidated,
          errorCount: result.errors.length,
          warningCount: result.warnings.length
        }
      };
      
      if (result.errors.length > 0) {
        response.errors = result.errors.map(e => ({
          node: e.nodeName || 'workflow',
          message: e.message,
          details: e.details
        }));
      }
      
      if (result.warnings.length > 0) {
        response.warnings = result.warnings.map(w => ({
          node: w.nodeName || 'workflow',
          message: w.message,
          details: w.details
        }));
      }
      
      if (result.suggestions.length > 0) {
        response.suggestions = result.suggestions;
      }
      
      return response;
    } catch (error) {
      logger.error('Error validating workflow:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error validating workflow',
        tip: 'Ensure the workflow JSON includes nodes array and connections object'
      };
    }
  }

  private async validateWorkflowConnections(workflow: any): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Create workflow validator instance
    const validator = new WorkflowValidator(
      this.repository,
      EnhancedConfigValidator
    );
    
    try {
      // Validate only connections
      const result = await validator.validateWorkflow(workflow, {
        validateNodes: false,
        validateConnections: true,
        validateExpressions: false
      });
      
      const response: any = {
        valid: result.errors.length === 0,
        statistics: {
          totalNodes: result.statistics.totalNodes,
          triggerNodes: result.statistics.triggerNodes,
          validConnections: result.statistics.validConnections,
          invalidConnections: result.statistics.invalidConnections
        }
      };
      
      // Filter to only connection-related issues
      const connectionErrors = result.errors.filter(e => 
        e.message.includes('connection') || 
        e.message.includes('cycle') ||
        e.message.includes('orphaned')
      );
      
      const connectionWarnings = result.warnings.filter(w => 
        w.message.includes('connection') || 
        w.message.includes('orphaned') ||
        w.message.includes('trigger')
      );
      
      if (connectionErrors.length > 0) {
        response.errors = connectionErrors.map(e => ({
          node: e.nodeName || 'workflow',
          message: e.message
        }));
      }
      
      if (connectionWarnings.length > 0) {
        response.warnings = connectionWarnings.map(w => ({
          node: w.nodeName || 'workflow',
          message: w.message
        }));
      }
      
      return response;
    } catch (error) {
      logger.error('Error validating workflow connections:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error validating connections'
      };
    }
  }

  private async validateWorkflowExpressions(workflow: any): Promise<any> {
    await this.ensureInitialized();
    if (!this.repository) throw new Error('Repository not initialized');
    
    // Create workflow validator instance
    const validator = new WorkflowValidator(
      this.repository,
      EnhancedConfigValidator
    );
    
    try {
      // Validate only expressions
      const result = await validator.validateWorkflow(workflow, {
        validateNodes: false,
        validateConnections: false,
        validateExpressions: true
      });
      
      const response: any = {
        valid: result.errors.length === 0,
        statistics: {
          totalNodes: result.statistics.totalNodes,
          expressionsValidated: result.statistics.expressionsValidated
        }
      };
      
      // Filter to only expression-related issues
      const expressionErrors = result.errors.filter(e => 
        e.message.includes('Expression') || 
        e.message.includes('$') ||
        e.message.includes('{{')
      );
      
      const expressionWarnings = result.warnings.filter(w => 
        w.message.includes('Expression') || 
        w.message.includes('$') ||
        w.message.includes('{{')
      );
      
      if (expressionErrors.length > 0) {
        response.errors = expressionErrors.map(e => ({
          node: e.nodeName || 'workflow',
          message: e.message
        }));
      }
      
      if (expressionWarnings.length > 0) {
        response.warnings = expressionWarnings.map(w => ({
          node: w.nodeName || 'workflow',
          message: w.message
        }));
      }
      
      // Add tips for common expression issues
      if (expressionErrors.length > 0 || expressionWarnings.length > 0) {
        response.tips = [
          'Use {{ }} to wrap expressions',
          'Reference data with $json.propertyName',
          'Reference other nodes with $node["Node Name"].json',
          'Use $input.item for input data in loops'
        ];
      }
      
      return response;
    } catch (error) {
      logger.error('Error validating workflow expressions:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error validating expressions'
      };
    }
  }

  async run(): Promise<void> {
    // Ensure database is initialized before starting server
    await this.ensureInitialized();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Force flush stdout for Docker environments
    // Docker uses block buffering which can delay MCP responses
    if (!process.stdout.isTTY || process.env.IS_DOCKER) {
      // Override write to auto-flush
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = function(chunk: any, encoding?: any, callback?: any) {
        const result = originalWrite(chunk, encoding, callback);
        // Force immediate flush
        process.stdout.emit('drain');
        return result;
      };
    }
    
    logger.info('n8n Documentation MCP Server running on stdio transport');
    
    // Keep the process alive and listening
    process.stdin.resume();
  }
}