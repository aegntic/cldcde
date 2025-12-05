import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsoleManager, consoleManager } from '../../../src/utils/console-manager';

describe('ConsoleManager', () => {
  let manager: ConsoleManager;
  let originalEnv: string | undefined;
  
  beforeEach(() => {
    manager = new ConsoleManager();
    originalEnv = process.env.MCP_MODE;
    // Reset console methods to originals before each test
    manager.restore();
  });
  
  afterEach(() => {
    // Clean up after each test
    manager.restore();
    if (originalEnv !== undefined) {
      process.env.MCP_MODE = originalEnv as "test" | "http" | "stdio" | undefined;
    } else {
      delete process.env.MCP_MODE;
    }
    delete process.env.MCP_REQUEST_ACTIVE;
  });

  describe('silence method', () => {
    test('should silence console methods when in HTTP mode', () => {
      process.env.MCP_MODE = 'http';
      
      const originalLog = console.log;
      const originalError = console.error;
      
      manager.silence();
      
      expect(console.log).not.toBe(originalLog);
      expect(console.error).not.toBe(originalError);
      expect(manager.isActive).toBe(true);
      expect(process.env.MCP_REQUEST_ACTIVE).toBe('true');
    });

    test('should not silence when not in HTTP mode', () => {
      process.env.MCP_MODE = 'stdio';
      
      const originalLog = console.log;
      
      manager.silence();
      
      expect(console.log).toBe(originalLog);
      expect(manager.isActive).toBe(false);
    });

    test('should not silence if already silenced', () => {
      process.env.MCP_MODE = 'http';
      
      manager.silence();
      const firstSilencedLog = console.log;
      
      manager.silence(); // Call again
      
      expect(console.log).toBe(firstSilencedLog);
      expect(manager.isActive).toBe(true);
    });

    test('should silence all console methods', () => {
      process.env.MCP_MODE = 'http';
      
      const originalMethods = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        trace: console.trace
      };
      
      manager.silence();
      
      Object.values(originalMethods).forEach(originalMethod => {
        const currentMethod = Object.values(console).find(method => method === originalMethod);
        expect(currentMethod).toBeUndefined();
      });
    });
  });

  describe('restore method', () => {
    test('should restore console methods after silencing', () => {
      process.env.MCP_MODE = 'http';
      
      const originalLog = console.log;
      const originalError = console.error;
      
      manager.silence();
      expect(console.log).not.toBe(originalLog);
      
      manager.restore();
      expect(console.log).toBe(originalLog);
      expect(console.error).toBe(originalError);
      expect(manager.isActive).toBe(false);
      expect(process.env.MCP_REQUEST_ACTIVE).toBe('false');
    });

    test('should not restore if not silenced', () => {
      const originalLog = console.log;
      
      manager.restore(); // Call without silencing first
      
      expect(console.log).toBe(originalLog);
      expect(manager.isActive).toBe(false);
    });

    test('should restore all console methods', () => {
      process.env.MCP_MODE = 'http';
      
      const originalMethods = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        trace: console.trace
      };
      
      manager.silence();
      manager.restore();
      
      expect(console.log).toBe(originalMethods.log);
      expect(console.error).toBe(originalMethods.error);
      expect(console.warn).toBe(originalMethods.warn);
      expect(console.info).toBe(originalMethods.info);
      expect(console.debug).toBe(originalMethods.debug);
      expect(console.trace).toBe(originalMethods.trace);
    });
  });

  describe('wrapOperation method', () => {
    test('should wrap synchronous operations', async () => {
      process.env.MCP_MODE = 'http';
      
      const testValue = 'test-result';
      const operation = vi.fn(() => testValue);
      
      const result = await manager.wrapOperation(operation);
      
      expect(result).toBe(testValue);
      expect(operation).toHaveBeenCalledOnce();
      expect(manager.isActive).toBe(false); // Should be restored after operation
    });

    test('should wrap asynchronous operations', async () => {
      process.env.MCP_MODE = 'http';
      
      const testValue = 'async-result';
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return testValue;
      });
      
      const result = await manager.wrapOperation(operation);
      
      expect(result).toBe(testValue);
      expect(operation).toHaveBeenCalledOnce();
      expect(manager.isActive).toBe(false); // Should be restored after operation
    });

    test('should restore console even if synchronous operation throws', async () => {
      process.env.MCP_MODE = 'http';
      
      const error = new Error('test error');
      const operation = vi.fn(() => {
        throw error;
      });
      
      await expect(manager.wrapOperation(operation)).rejects.toThrow('test error');
      expect(manager.isActive).toBe(false); // Should be restored even after error
    });

    test('should restore console even if async operation throws', async () => {
      process.env.MCP_MODE = 'http';
      
      const error = new Error('async test error');
      const operation = vi.fn(async () => {
        throw error;
      });
      
      await expect(manager.wrapOperation(operation)).rejects.toThrow('async test error');
      expect(manager.isActive).toBe(false); // Should be restored even after error
    });

    test('should handle promise rejection properly', async () => {
      process.env.MCP_MODE = 'http';
      
      const error = new Error('promise rejection');
      const operation = vi.fn(() => Promise.reject(error));
      
      await expect(manager.wrapOperation(operation)).rejects.toThrow('promise rejection');
      expect(manager.isActive).toBe(false); // Should be restored even after rejection
    });
  });

  describe('isActive getter', () => {
    test('should return false initially', () => {
      expect(manager.isActive).toBe(false);
    });

    test('should return true when silenced', () => {
      process.env.MCP_MODE = 'http';
      
      manager.silence();
      expect(manager.isActive).toBe(true);
    });

    test('should return false after restore', () => {
      process.env.MCP_MODE = 'http';
      
      manager.silence();
      manager.restore();
      expect(manager.isActive).toBe(false);
    });
  });

  describe('Singleton instance', () => {
    test('should export a singleton instance', () => {
      expect(consoleManager).toBeInstanceOf(ConsoleManager);
    });

    test('should work with singleton instance', () => {
      process.env.MCP_MODE = 'http';
      
      const originalLog = console.log;
      
      consoleManager.silence();
      expect(console.log).not.toBe(originalLog);
      expect(consoleManager.isActive).toBe(true);
      
      consoleManager.restore();
      expect(console.log).toBe(originalLog);
      expect(consoleManager.isActive).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined MCP_MODE', () => {
      delete process.env.MCP_MODE;
      
      const originalLog = console.log;
      
      manager.silence();
      expect(console.log).toBe(originalLog);
      expect(manager.isActive).toBe(false);
    });

    test('should handle empty MCP_MODE', () => {
      process.env.MCP_MODE = '' as any;
      
      const originalLog = console.log;
      
      manager.silence();
      expect(console.log).toBe(originalLog);
      expect(manager.isActive).toBe(false);
    });

    test('should silence and restore multiple times', () => {
      process.env.MCP_MODE = 'http';
      
      const originalLog = console.log;
      
      // First cycle
      manager.silence();
      expect(manager.isActive).toBe(true);
      manager.restore();
      expect(manager.isActive).toBe(false);
      expect(console.log).toBe(originalLog);
      
      // Second cycle
      manager.silence();
      expect(manager.isActive).toBe(true);
      manager.restore();
      expect(manager.isActive).toBe(false);
      expect(console.log).toBe(originalLog);
    });
  });
});