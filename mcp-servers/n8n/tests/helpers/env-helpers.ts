/**
 * Test Environment Helper Utilities
 * 
 * Common utilities for working with test environment configuration
 */

import { getTestConfig, TestConfig } from '../setup/test-env';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Create a test database path with unique suffix
 */
export function createTestDatabasePath(suffix?: string): string {
  const config = getTestConfig();
  if (config.database.path === ':memory:') {
    return ':memory:';
  }
  
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const dbName = suffix 
    ? `test-${suffix}-${timestamp}-${randomSuffix}.db`
    : `test-${timestamp}-${randomSuffix}.db`;
    
  return path.join(config.paths.data, dbName);
}

/**
 * Clean up test databases
 */
export async function cleanupTestDatabases(pattern?: RegExp): Promise<void> {
  const config = getTestConfig();
  const dataPath = path.resolve(config.paths.data);
  
  if (!fs.existsSync(dataPath)) {
    return;
  }
  
  const files = fs.readdirSync(dataPath);
  const testDbPattern = pattern || /^test-.*\.db$/;
  
  for (const file of files) {
    if (testDbPattern.test(file)) {
      try {
        fs.unlinkSync(path.join(dataPath, file));
      } catch (error) {
        console.error(`Failed to delete test database: ${file}`, error);
      }
    }
  }
}

/**
 * Override environment variables temporarily
 */
export function withEnvOverrides<T>(
  overrides: Partial<NodeJS.ProcessEnv>,
  fn: () => T
): T {
  const originalValues: Partial<NodeJS.ProcessEnv> = {};
  
  // Save original values and apply overrides
  for (const [key, value] of Object.entries(overrides)) {
    originalValues[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  
  try {
    return fn();
  } finally {
    // Restore original values
    for (const [key, value] of Object.entries(originalValues)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Async version of withEnvOverrides
 */
export async function withEnvOverridesAsync<T>(
  overrides: Partial<NodeJS.ProcessEnv>,
  fn: () => Promise<T>
): Promise<T> {
  const originalValues: Partial<NodeJS.ProcessEnv> = {};
  
  // Save original values and apply overrides
  for (const [key, value] of Object.entries(overrides)) {
    originalValues[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  
  try {
    return await fn();
  } finally {
    // Restore original values
    for (const [key, value] of Object.entries(originalValues)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Create a mock API server URL
 */
export function getMockApiUrl(endpoint?: string): string {
  const config = getTestConfig();
  const baseUrl = config.api.url;
  return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
}

/**
 * Get test fixture path
 */
export function getFixturePath(fixtureName: string): string {
  const config = getTestConfig();
  return path.resolve(config.paths.fixtures, fixtureName);
}

/**
 * Load test fixture data
 */
export function loadFixture<T = any>(fixtureName: string): T {
  const fixturePath = getFixturePath(fixtureName);
  
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }
  
  const content = fs.readFileSync(fixturePath, 'utf-8');
  
  if (fixturePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  
  return content as any;
}

/**
 * Save test snapshot
 */
export function saveSnapshot(name: string, data: any): void {
  const config = getTestConfig();
  const snapshotDir = path.resolve(config.paths.snapshots);
  
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  
  const snapshotPath = path.join(snapshotDir, `${name}.snap`);
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  
  fs.writeFileSync(snapshotPath, content);
}

/**
 * Performance measurement helper
 */
export class PerformanceMeasure {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {
    this.startTime = performance.now();
  }
  
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }
  
  end(): { total: number; marks: Record<string, number> } {
    const endTime = performance.now();
    const total = endTime - this.startTime;
    
    const markTimes: Record<string, number> = {};
    for (const [label, time] of this.marks) {
      markTimes[label] = time - this.startTime;
    }
    
    return { total, marks: markTimes };
  }
  
  assertThreshold(threshold: keyof TestConfig['performance']['thresholds']): void {
    const config = getTestConfig();
    const { total } = this.end();
    const maxTime = config.performance.thresholds[threshold];
    
    if (total > maxTime) {
      throw new Error(
        `Performance threshold exceeded for ${this.name}: ` +
        `${total.toFixed(2)}ms > ${maxTime}ms`
      );
    }
  }
}

/**
 * Create a performance measure
 */
export function measurePerformance(name: string): PerformanceMeasure {
  return new PerformanceMeasure(name);
}

/**
 * Wait for a condition with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    message = 'Condition not met'
  } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`${message} (timeout: ${timeout}ms)`);
}

/**
 * Create a test logger that respects configuration
 */
export function createTestLogger(namespace: string) {
  const config = getTestConfig();
  
  return {
    debug: (...args: any[]) => {
      if (config.logging.debug || config.logging.verbose) {
        console.debug(`[${namespace}]`, ...args);
      }
    },
    info: (...args: any[]) => {
      if (config.logging.level !== 'error') {
        console.info(`[${namespace}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (config.logging.level !== 'error') {
        console.warn(`[${namespace}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      console.error(`[${namespace}]`, ...args);
    }
  };
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || 
         process.env.CONTINUOUS_INTEGRATION === 'true' ||
         process.env.GITHUB_ACTIONS === 'true' ||
         process.env.GITLAB_CI === 'true' ||
         process.env.CIRCLECI === 'true';
}

/**
 * Get appropriate test timeout based on environment
 */
export function getAdaptiveTimeout(baseTimeout: number): number {
  const multiplier = isCI() ? 2 : 1; // Double timeouts in CI
  return baseTimeout * multiplier;
}