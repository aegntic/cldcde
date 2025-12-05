import { DatabaseAdapter } from '../database/database-adapter';
import { TemplateWorkflow, TemplateDetail } from './template-fetcher';
import { logger } from '../utils/logger';
import { TemplateSanitizer } from '../utils/template-sanitizer';

export interface StoredTemplate {
  id: number;
  workflow_id: number;
  name: string;
  description: string;
  author_name: string;
  author_username: string;
  author_verified: number;
  nodes_used: string; // JSON string
  workflow_json: string; // JSON string
  categories: string; // JSON string
  views: number;
  created_at: string;
  updated_at: string;
  url: string;
  scraped_at: string;
}

export class TemplateRepository {
  private sanitizer: TemplateSanitizer;
  private hasFTS5Support: boolean = false;
  
  constructor(private db: DatabaseAdapter) {
    this.sanitizer = new TemplateSanitizer();
    this.initializeFTS5();
  }
  
  /**
   * Initialize FTS5 tables if supported
   */
  private initializeFTS5(): void {
    this.hasFTS5Support = this.db.checkFTS5Support();
    
    if (this.hasFTS5Support) {
      try {
        // Check if FTS5 table already exists
        const ftsExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='templates_fts'
        `).get() as { name: string } | undefined;
        
        if (ftsExists) {
          logger.info('FTS5 table already exists for templates');
          
          // Verify FTS5 is working by doing a test query
          try {
            const testCount = this.db.prepare('SELECT COUNT(*) as count FROM templates_fts').get() as { count: number };
            logger.info(`FTS5 enabled with ${testCount.count} indexed entries`);
          } catch (testError) {
            logger.warn('FTS5 table exists but query failed:', testError);
            this.hasFTS5Support = false;
            return;
          }
        } else {
          // Create FTS5 virtual table
          logger.info('Creating FTS5 virtual table for templates...');
          this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
              name, description, content=templates
            );
          `);
          
          // Create triggers to keep FTS5 in sync
          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_ai AFTER INSERT ON templates BEGIN
              INSERT INTO templates_fts(rowid, name, description)
              VALUES (new.id, new.name, new.description);
            END;
          `);
          
          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_au AFTER UPDATE ON templates BEGIN
              UPDATE templates_fts SET name = new.name, description = new.description
              WHERE rowid = new.id;
            END;
          `);
          
          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_ad AFTER DELETE ON templates BEGIN
              DELETE FROM templates_fts WHERE rowid = old.id;
            END;
          `);
          
          logger.info('FTS5 support enabled for template search');
        }
      } catch (error: any) {
        logger.warn('Failed to initialize FTS5 for templates:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        this.hasFTS5Support = false;
      }
    } else {
      logger.info('FTS5 not available, using LIKE search for templates');
    }
  }
  
  /**
   * Save a template to the database
   */
  saveTemplate(workflow: TemplateWorkflow, detail: TemplateDetail, categories: string[] = []): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, workflow_id, name, description, author_name, author_username,
        author_verified, nodes_used, workflow_json, categories, views,
        created_at, updated_at, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Extract node types from workflow detail
    const nodeTypes = detail.workflow.nodes.map(n => n.type);
    
    // Build URL
    const url = `https://n8n.io/workflows/${workflow.id}`;
    
    // Sanitize the workflow to remove API tokens
    const { sanitized: sanitizedWorkflow, wasModified } = this.sanitizer.sanitizeWorkflow(detail.workflow);
    
    // Log if we sanitized any tokens
    if (wasModified) {
      const detectedTokens = this.sanitizer.detectTokens(detail.workflow);
      logger.warn(`Sanitized API tokens in template ${workflow.id}: ${workflow.name}`, {
        templateId: workflow.id,
        templateName: workflow.name,
        tokensFound: detectedTokens.length,
        tokenPreviews: detectedTokens.map(t => t.substring(0, 20) + '...')
      });
    }
    
    stmt.run(
      workflow.id,
      workflow.id,
      workflow.name,
      workflow.description || '',
      workflow.user.name,
      workflow.user.username,
      workflow.user.verified ? 1 : 0,
      JSON.stringify(nodeTypes),
      JSON.stringify(sanitizedWorkflow),
      JSON.stringify(categories),
      workflow.totalViews || 0,
      workflow.createdAt,
      workflow.createdAt, // Using createdAt as updatedAt since API doesn't provide updatedAt
      url
    );
  }
  
  /**
   * Get templates that use specific node types
   */
  getTemplatesByNodes(nodeTypes: string[], limit: number = 10): StoredTemplate[] {
    // Build query for multiple node types
    const conditions = nodeTypes.map(() => "nodes_used LIKE ?").join(" OR ");
    const query = `
      SELECT * FROM templates 
      WHERE ${conditions}
      ORDER BY views DESC, created_at DESC
      LIMIT ?
    `;
    
    const params = [...nodeTypes.map(n => `%"${n}"%`), limit];
    return this.db.prepare(query).all(...params) as StoredTemplate[];
  }
  
  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: number): StoredTemplate | null {
    const row = this.db.prepare(`
      SELECT * FROM templates WHERE id = ?
    `).get(templateId) as StoredTemplate | undefined;
    
    return row || null;
  }
  
  /**
   * Search templates by name or description
   */
  searchTemplates(query: string, limit: number = 20): StoredTemplate[] {
    logger.debug(`Searching templates for: "${query}" (FTS5: ${this.hasFTS5Support})`);
    
    // If FTS5 is not supported, go straight to LIKE search
    if (!this.hasFTS5Support) {
      logger.debug('Using LIKE search (FTS5 not available)');
      return this.searchTemplatesLIKE(query, limit);
    }
    
    try {
      // Use FTS for search - escape quotes in terms
      const ftsQuery = query.split(' ').map(term => {
        // Escape double quotes by replacing with two double quotes
        const escaped = term.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(' OR ');
      logger.debug(`FTS5 query: ${ftsQuery}`);
      
      const results = this.db.prepare(`
        SELECT t.* FROM templates t
        JOIN templates_fts ON t.id = templates_fts.rowid
        WHERE templates_fts MATCH ?
        ORDER BY rank, t.views DESC
        LIMIT ?
      `).all(ftsQuery, limit) as StoredTemplate[];
      
      logger.debug(`FTS5 search returned ${results.length} results`);
      return results;
    } catch (error: any) {
      // If FTS5 query fails, fallback to LIKE search
      logger.warn('FTS5 template search failed, using LIKE fallback:', {
        message: error.message,
        query: query,
        ftsQuery: query.split(' ').map(term => `"${term}"`).join(' OR ')
      });
      return this.searchTemplatesLIKE(query, limit);
    }
  }
  
  /**
   * Fallback search using LIKE when FTS5 is not available
   */
  private searchTemplatesLIKE(query: string, limit: number = 20): StoredTemplate[] {
    const likeQuery = `%${query}%`;
    logger.debug(`Using LIKE search with pattern: ${likeQuery}`);
    
    const results = this.db.prepare(`
      SELECT * FROM templates 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY views DESC, created_at DESC
      LIMIT ?
    `).all(likeQuery, likeQuery, limit) as StoredTemplate[];
    
    logger.debug(`LIKE search returned ${results.length} results`);
    return results;
  }
  
  /**
   * Get templates for a specific task/use case
   */
  getTemplatesForTask(task: string): StoredTemplate[] {
    // Map tasks to relevant node combinations
    const taskNodeMap: Record<string, string[]> = {
      'ai_automation': ['@n8n/n8n-nodes-langchain.openAi', '@n8n/n8n-nodes-langchain.agent', 'n8n-nodes-base.openAi'],
      'data_sync': ['n8n-nodes-base.googleSheets', 'n8n-nodes-base.postgres', 'n8n-nodes-base.mysql'],
      'webhook_processing': ['n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest'],
      'email_automation': ['n8n-nodes-base.gmail', 'n8n-nodes-base.emailSend', 'n8n-nodes-base.emailReadImap'],
      'slack_integration': ['n8n-nodes-base.slack', 'n8n-nodes-base.slackTrigger'],
      'data_transformation': ['n8n-nodes-base.code', 'n8n-nodes-base.set', 'n8n-nodes-base.merge'],
      'file_processing': ['n8n-nodes-base.readBinaryFile', 'n8n-nodes-base.writeBinaryFile', 'n8n-nodes-base.googleDrive'],
      'scheduling': ['n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.cron'],
      'api_integration': ['n8n-nodes-base.httpRequest', 'n8n-nodes-base.graphql'],
      'database_operations': ['n8n-nodes-base.postgres', 'n8n-nodes-base.mysql', 'n8n-nodes-base.mongodb']
    };
    
    const nodes = taskNodeMap[task];
    if (!nodes) {
      return [];
    }
    
    return this.getTemplatesByNodes(nodes, 10);
  }
  
  /**
   * Get all templates with limit
   */
  getAllTemplates(limit: number = 10): StoredTemplate[] {
    return this.db.prepare(`
      SELECT * FROM templates 
      ORDER BY views DESC, created_at DESC
      LIMIT ?
    `).all(limit) as StoredTemplate[];
  }
  
  /**
   * Get total template count
   */
  getTemplateCount(): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number };
    return result.count;
  }
  
  /**
   * Get template statistics
   */
  getTemplateStats(): Record<string, any> {
    const count = this.getTemplateCount();
    const avgViews = this.db.prepare('SELECT AVG(views) as avg FROM templates').get() as { avg: number };
    const topNodes = this.db.prepare(`
      SELECT nodes_used FROM templates 
      ORDER BY views DESC 
      LIMIT 100
    `).all() as { nodes_used: string }[];
    
    // Count node usage
    const nodeCount: Record<string, number> = {};
    topNodes.forEach(t => {
      const nodes = JSON.parse(t.nodes_used);
      nodes.forEach((n: string) => {
        nodeCount[n] = (nodeCount[n] || 0) + 1;
      });
    });
    
    // Get top 10 most used nodes
    const topUsedNodes = Object.entries(nodeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([node, count]) => ({ node, count }));
    
    return {
      totalTemplates: count,
      averageViews: Math.round(avgViews.avg || 0),
      topUsedNodes
    };
  }
  
  /**
   * Clear all templates (for testing or refresh)
   */
  clearTemplates(): void {
    this.db.exec('DELETE FROM templates');
    logger.info('Cleared all templates from database');
  }
  
  /**
   * Rebuild the FTS5 index for all templates
   * This is needed when templates are bulk imported or when FTS5 gets out of sync
   */
  rebuildTemplateFTS(): void {
    // Skip if FTS5 is not supported
    if (!this.hasFTS5Support) {
      return;
    }
    
    try {
      // Clear existing FTS data
      this.db.exec('DELETE FROM templates_fts');
      
      // Repopulate from templates table
      this.db.exec(`
        INSERT INTO templates_fts(rowid, name, description)
        SELECT id, name, description FROM templates
      `);
      
      const count = this.getTemplateCount();
      logger.info(`Rebuilt FTS5 index for ${count} templates`);
    } catch (error) {
      logger.warn('Failed to rebuild template FTS5 index:', error);
      // Non-critical error - search will fallback to LIKE
    }
  }
}