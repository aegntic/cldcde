import { DatabaseAdapter } from './database-adapter';
import { ParsedNode } from '../parsers/node-parser';
import { SQLiteStorageService } from '../services/sqlite-storage-service';

export class NodeRepository {
  private db: DatabaseAdapter;
  
  constructor(dbOrService: DatabaseAdapter | SQLiteStorageService) {
    if ('db' in dbOrService) {
      this.db = dbOrService.db;
    } else {
      this.db = dbOrService;
    }
  }
  
  /**
   * Save node with proper JSON serialization
   */
  saveNode(node: ParsedNode): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO nodes (
        node_type, package_name, display_name, description,
        category, development_style, is_ai_tool, is_trigger,
        is_webhook, is_versioned, version, documentation,
        properties_schema, operations, credentials_required,
        outputs, output_names
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      node.nodeType,
      node.packageName,
      node.displayName,
      node.description,
      node.category,
      node.style,
      node.isAITool ? 1 : 0,
      node.isTrigger ? 1 : 0,
      node.isWebhook ? 1 : 0,
      node.isVersioned ? 1 : 0,
      node.version,
      node.documentation || null,
      JSON.stringify(node.properties, null, 2),
      JSON.stringify(node.operations, null, 2),
      JSON.stringify(node.credentials, null, 2),
      node.outputs ? JSON.stringify(node.outputs, null, 2) : null,
      node.outputNames ? JSON.stringify(node.outputNames, null, 2) : null
    );
  }
  
  /**
   * Get node with proper JSON deserialization
   */
  getNode(nodeType: string): any {
    const row = this.db.prepare(`
      SELECT * FROM nodes WHERE node_type = ?
    `).get(nodeType) as any;
    
    if (!row) return null;
    
    return {
      nodeType: row.node_type,
      displayName: row.display_name,
      description: row.description,
      category: row.category,
      developmentStyle: row.development_style,
      package: row.package_name,
      isAITool: Number(row.is_ai_tool) === 1,
      isTrigger: Number(row.is_trigger) === 1,
      isWebhook: Number(row.is_webhook) === 1,
      isVersioned: Number(row.is_versioned) === 1,
      version: row.version,
      properties: this.safeJsonParse(row.properties_schema, []),
      operations: this.safeJsonParse(row.operations, []),
      credentials: this.safeJsonParse(row.credentials_required, []),
      hasDocumentation: !!row.documentation,
      outputs: row.outputs ? this.safeJsonParse(row.outputs, null) : null,
      outputNames: row.output_names ? this.safeJsonParse(row.output_names, null) : null
    };
  }
  
  /**
   * Get AI tools with proper filtering
   */
  getAITools(): any[] {
    const rows = this.db.prepare(`
      SELECT node_type, display_name, description, package_name
      FROM nodes 
      WHERE is_ai_tool = 1
      ORDER BY display_name
    `).all() as any[];
    
    return rows.map(row => ({
      nodeType: row.node_type,
      displayName: row.display_name,
      description: row.description,
      package: row.package_name
    }));
  }
  
  private safeJsonParse(json: string, defaultValue: any): any {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }

  // Additional methods for benchmarks
  upsertNode(node: ParsedNode): void {
    this.saveNode(node);
  }

  getNodeByType(nodeType: string): any {
    return this.getNode(nodeType);
  }

  getNodesByCategory(category: string): any[] {
    const rows = this.db.prepare(`
      SELECT * FROM nodes WHERE category = ?
      ORDER BY display_name
    `).all(category) as any[];
    
    return rows.map(row => this.parseNodeRow(row));
  }

  searchNodes(query: string, mode: 'OR' | 'AND' | 'FUZZY' = 'OR', limit: number = 20): any[] {
    let sql = '';
    const params: any[] = [];
    
    if (mode === 'FUZZY') {
      // Simple fuzzy search
      sql = `
        SELECT * FROM nodes 
        WHERE node_type LIKE ? OR display_name LIKE ? OR description LIKE ?
        ORDER BY display_name
        LIMIT ?
      `;
      const fuzzyQuery = `%${query}%`;
      params.push(fuzzyQuery, fuzzyQuery, fuzzyQuery, limit);
    } else {
      // OR/AND mode
      const words = query.split(/\s+/).filter(w => w.length > 0);
      const conditions = words.map(() => 
        '(node_type LIKE ? OR display_name LIKE ? OR description LIKE ?)'
      );
      const operator = mode === 'AND' ? ' AND ' : ' OR ';
      
      sql = `
        SELECT * FROM nodes 
        WHERE ${conditions.join(operator)}
        ORDER BY display_name
        LIMIT ?
      `;
      
      for (const word of words) {
        const searchTerm = `%${word}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      params.push(limit);
    }
    
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(row => this.parseNodeRow(row));
  }

  getAllNodes(limit?: number): any[] {
    let sql = 'SELECT * FROM nodes ORDER BY display_name';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    const rows = this.db.prepare(sql).all() as any[];
    return rows.map(row => this.parseNodeRow(row));
  }

  getNodeCount(): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM nodes').get() as any;
    return result.count;
  }

  getAIToolNodes(): any[] {
    return this.getAITools();
  }

  getNodesByPackage(packageName: string): any[] {
    const rows = this.db.prepare(`
      SELECT * FROM nodes WHERE package_name = ?
      ORDER BY display_name
    `).all(packageName) as any[];
    
    return rows.map(row => this.parseNodeRow(row));
  }

  searchNodeProperties(nodeType: string, query: string, maxResults: number = 20): any[] {
    const node = this.getNode(nodeType);
    if (!node || !node.properties) return [];
    
    const results: any[] = [];
    const searchLower = query.toLowerCase();
    
    function searchProperties(properties: any[], path: string[] = []) {
      for (const prop of properties) {
        if (results.length >= maxResults) break;
        
        const currentPath = [...path, prop.name || prop.displayName];
        const pathString = currentPath.join('.');
        
        if (prop.name?.toLowerCase().includes(searchLower) ||
            prop.displayName?.toLowerCase().includes(searchLower) ||
            prop.description?.toLowerCase().includes(searchLower)) {
          results.push({
            path: pathString,
            property: prop,
            description: prop.description
          });
        }
        
        // Search nested properties
        if (prop.options) {
          searchProperties(prop.options, currentPath);
        }
      }
    }
    
    searchProperties(node.properties);
    return results;
  }

  private parseNodeRow(row: any): any {
    return {
      nodeType: row.node_type,
      displayName: row.display_name,
      description: row.description,
      category: row.category,
      developmentStyle: row.development_style,
      package: row.package_name,
      isAITool: Number(row.is_ai_tool) === 1,
      isTrigger: Number(row.is_trigger) === 1,
      isWebhook: Number(row.is_webhook) === 1,
      isVersioned: Number(row.is_versioned) === 1,
      version: row.version,
      properties: this.safeJsonParse(row.properties_schema, []),
      operations: this.safeJsonParse(row.operations, []),
      credentials: this.safeJsonParse(row.credentials_required, []),
      hasDocumentation: !!row.documentation,
      outputs: row.outputs ? this.safeJsonParse(row.outputs, null) : null,
      outputNames: row.output_names ? this.safeJsonParse(row.output_names, null) : null
    };
  }
}