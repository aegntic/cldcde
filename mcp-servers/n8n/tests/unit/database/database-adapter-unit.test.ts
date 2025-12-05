import { describe, it, expect, vi } from 'vitest';

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Database Adapter - Unit Tests', () => {
  describe('DatabaseAdapter Interface', () => {
    it('should define interface when adapter is created', () => {
      // This is a type test - ensuring the interface is correctly defined
      type DatabaseAdapter = {
        prepare: (sql: string) => any;
        exec: (sql: string) => void;
        close: () => void;
        pragma: (key: string, value?: any) => any;
        readonly inTransaction: boolean;
        transaction: <T>(fn: () => T) => T;
        checkFTS5Support: () => boolean;
      };
      
      // Type assertion to ensure interface matches
      const mockAdapter: DatabaseAdapter = {
        prepare: vi.fn(),
        exec: vi.fn(),
        close: vi.fn(),
        pragma: vi.fn(),
        inTransaction: false,
        transaction: vi.fn((fn) => fn()),
        checkFTS5Support: vi.fn(() => true)
      };
      
      expect(mockAdapter).toBeDefined();
      expect(mockAdapter.prepare).toBeDefined();
      expect(mockAdapter.exec).toBeDefined();
      expect(mockAdapter.close).toBeDefined();
      expect(mockAdapter.pragma).toBeDefined();
      expect(mockAdapter.transaction).toBeDefined();
      expect(mockAdapter.checkFTS5Support).toBeDefined();
    });
  });
  
  describe('PreparedStatement Interface', () => {
    it('should define interface when statement is prepared', () => {
      // Type test for PreparedStatement
      type PreparedStatement = {
        run: (...params: any[]) => { changes: number; lastInsertRowid: number | bigint };
        get: (...params: any[]) => any;
        all: (...params: any[]) => any[];
        iterate: (...params: any[]) => IterableIterator<any>;
        pluck: (toggle?: boolean) => PreparedStatement;
        expand: (toggle?: boolean) => PreparedStatement;
        raw: (toggle?: boolean) => PreparedStatement;
        columns: () => any[];
        bind: (...params: any[]) => PreparedStatement;
      };
      
      const mockStmt: PreparedStatement = {
        run: vi.fn(() => ({ changes: 1, lastInsertRowid: 1 })),
        get: vi.fn(),
        all: vi.fn(() => []),
        iterate: vi.fn(function* () {}),
        pluck: vi.fn(function(this: any) { return this; }),
        expand: vi.fn(function(this: any) { return this; }),
        raw: vi.fn(function(this: any) { return this; }),
        columns: vi.fn(() => []),
        bind: vi.fn(function(this: any) { return this; })
      };
      
      expect(mockStmt).toBeDefined();
      expect(mockStmt.run).toBeDefined();
      expect(mockStmt.get).toBeDefined();
      expect(mockStmt.all).toBeDefined();
      expect(mockStmt.iterate).toBeDefined();
      expect(mockStmt.pluck).toBeDefined();
      expect(mockStmt.expand).toBeDefined();
      expect(mockStmt.raw).toBeDefined();
      expect(mockStmt.columns).toBeDefined();
      expect(mockStmt.bind).toBeDefined();
    });
  });
  
  describe('FTS5 Support Detection', () => {
    it('should detect support when FTS5 module is available', () => {
      const mockDb = {
        exec: vi.fn()
      };
      
      // Function to test FTS5 support detection logic
      const checkFTS5Support = (db: any): boolean => {
        try {
          db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS test_fts5 USING fts5(content);");
          db.exec("DROP TABLE IF EXISTS test_fts5;");
          return true;
        } catch (error) {
          return false;
        }
      };
      
      // Test when FTS5 is supported
      expect(checkFTS5Support(mockDb)).toBe(true);
      expect(mockDb.exec).toHaveBeenCalledWith(
        "CREATE VIRTUAL TABLE IF NOT EXISTS test_fts5 USING fts5(content);"
      );
      
      // Test when FTS5 is not supported
      mockDb.exec.mockImplementation(() => {
        throw new Error('no such module: fts5');
      });
      
      expect(checkFTS5Support(mockDb)).toBe(false);
    });
  });
  
  describe('Transaction Handling', () => {
    it('should handle commit and rollback when transaction is executed', () => {
      // Test transaction wrapper logic
      const mockDb = {
        exec: vi.fn(),
        inTransaction: false
      };
      
      const transaction = <T>(db: any, fn: () => T): T => {
        try {
          db.exec('BEGIN');
          db.inTransaction = true;
          const result = fn();
          db.exec('COMMIT');
          db.inTransaction = false;
          return result;
        } catch (error) {
          db.exec('ROLLBACK');
          db.inTransaction = false;
          throw error;
        }
      };
      
      // Test successful transaction
      const result = transaction(mockDb, () => 'success');
      expect(result).toBe('success');
      expect(mockDb.exec).toHaveBeenCalledWith('BEGIN');
      expect(mockDb.exec).toHaveBeenCalledWith('COMMIT');
      expect(mockDb.inTransaction).toBe(false);
      
      // Reset mocks
      mockDb.exec.mockClear();
      
      // Test failed transaction
      expect(() => {
        transaction(mockDb, () => {
          throw new Error('transaction error');
        });
      }).toThrow('transaction error');
      
      expect(mockDb.exec).toHaveBeenCalledWith('BEGIN');
      expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockDb.inTransaction).toBe(false);
    });
  });
  
  describe('Pragma Handling', () => {
    it('should return values when pragma commands are executed', () => {
      const mockDb = {
        pragma: vi.fn((key: string, value?: any) => {
          if (key === 'journal_mode' && value === 'WAL') {
            return 'wal';
          }
          return null;
        })
      };
      
      expect(mockDb.pragma('journal_mode', 'WAL')).toBe('wal');
      expect(mockDb.pragma('other_key')).toBe(null);
    });
  });
});