import { vi } from 'vitest';

export class MockDatabase {
  private data = new Map<string, any[]>();
  private prepared = new Map<string, any>();
  public inTransaction = false;
  
  constructor() {
    this.data.set('nodes', []);
    this.data.set('templates', []);
    this.data.set('tools_documentation', []);
  }
  
  prepare(sql: string) {
    const key = this.extractTableName(sql);
    const self = this;
    
    return {
      all: vi.fn(() => self.data.get(key) || []),
      get: vi.fn((id: string) => {
        const items = self.data.get(key) || [];
        return items.find(item => item.id === id);
      }),
      run: vi.fn((params: any) => {
        const items = self.data.get(key) || [];
        items.push(params);
        self.data.set(key, items);
        return { changes: 1, lastInsertRowid: items.length };
      }),
      iterate: vi.fn(function* () {
        const items = self.data.get(key) || [];
        for (const item of items) {
          yield item;
        }
      }),
      pluck: vi.fn(function(this: any) { return this; }),
      expand: vi.fn(function(this: any) { return this; }),
      raw: vi.fn(function(this: any) { return this; }),
      columns: vi.fn(() => []),
      bind: vi.fn(function(this: any) { return this; })
    };
  }
  
  exec(sql: string) {
    // Mock schema creation
    return true;
  }
  
  close() {
    // Mock close
    return true;
  }
  
  pragma(key: string, value?: any) {
    // Mock pragma
    if (key === 'journal_mode' && value === 'WAL') {
      return 'wal';
    }
    return null;
  }
  
  transaction<T>(fn: () => T): T {
    this.inTransaction = true;
    try {
      const result = fn();
      this.inTransaction = false;
      return result;
    } catch (error) {
      this.inTransaction = false;
      throw error;
    }
  }
  
  // Helper to extract table name from SQL
  private extractTableName(sql: string): string {
    const match = sql.match(/FROM\s+(\w+)|INTO\s+(\w+)|UPDATE\s+(\w+)/i);
    return match ? (match[1] || match[2] || match[3]) : 'nodes';
  }
  
  // Test helper to seed data
  _seedData(table: string, data: any[]) {
    this.data.set(table, data);
  }
}

export default vi.fn(() => new MockDatabase());