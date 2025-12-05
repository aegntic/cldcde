/**
 * Example test demonstrating test environment configuration usage
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  getTestConfig, 
  getTestTimeout, 
  isFeatureEnabled,
  isTestMode,
  loadTestEnvironment 
} from '@tests/setup/test-env';
import {
  withEnvOverrides,
  createTestDatabasePath,
  getMockApiUrl,
  measurePerformance,
  createTestLogger,
  waitForCondition
} from '@tests/helpers/env-helpers';

describe('Test Environment Configuration Example', () => {
  let config: ReturnType<typeof getTestConfig>;
  let logger: ReturnType<typeof createTestLogger>;
  
  beforeAll(() => {
    // Initialize config inside beforeAll to ensure environment is loaded
    config = getTestConfig();
    logger = createTestLogger('test-env-example');
    
    logger.info('Test suite starting with configuration:', {
      environment: config.nodeEnv,
      database: config.database.path,
      apiUrl: config.api.url
    });
  });
  
  afterAll(() => {
    logger.info('Test suite completed');
  });
  
  it('should be in test mode', () => {
    const testConfig = getTestConfig();
    expect(isTestMode()).toBe(true);
    expect(testConfig.nodeEnv).toBe('test');
    expect(testConfig.isTest).toBe(true);
  });
  
  it('should have proper database configuration', () => {
    const testConfig = getTestConfig();
    expect(testConfig.database.path).toBeDefined();
    expect(testConfig.database.rebuildOnStart).toBe(false);
    expect(testConfig.database.seedData).toBe(true);
  });
  
  it.skip('should have mock API configuration', () => {
    const testConfig = getTestConfig();
    // Add debug logging for CI
    if (process.env.CI) {
      console.log('CI Environment Debug:', {
        NODE_ENV: process.env.NODE_ENV,
        N8N_API_URL: process.env.N8N_API_URL,
        N8N_API_KEY: process.env.N8N_API_KEY,
        configUrl: testConfig.api.url,
        configKey: testConfig.api.key
      });
    }
    expect(testConfig.api.url).toMatch(/mock-api/);
    expect(testConfig.api.key).toBe('test-api-key-12345');
  });
  
  it('should respect test timeouts', { timeout: getTestTimeout('unit') }, async () => {
    const timeout = getTestTimeout('unit');
    expect(timeout).toBe(5000);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  it('should support environment overrides', () => {
    const testConfig = getTestConfig();
    const originalLogLevel = testConfig.logging.level;
    
    const result = withEnvOverrides({
      LOG_LEVEL: 'debug',
      DEBUG: 'true'
    }, () => {
      const newConfig = getTestConfig();
      expect(newConfig.logging.level).toBe('debug');
      expect(newConfig.logging.debug).toBe(true);
      return 'success';
    });
    
    expect(result).toBe('success');
    const configAfter = getTestConfig();
    expect(configAfter.logging.level).toBe(originalLogLevel);
  });
  
  it('should generate unique test database paths', () => {
    const path1 = createTestDatabasePath('feature1');
    const path2 = createTestDatabasePath('feature1');
    
    if (path1 !== ':memory:') {
      expect(path1).not.toBe(path2);
      expect(path1).toMatch(/test-feature1-\d+-\w+\.db$/);
    }
  });
  
  it('should construct mock API URLs', () => {
    const testConfig = getTestConfig();
    const baseUrl = getMockApiUrl();
    const endpointUrl = getMockApiUrl('/nodes');
    
    expect(baseUrl).toBe(testConfig.api.url);
    expect(endpointUrl).toBe(`${testConfig.api.url}/nodes`);
  });
  
  it.skipIf(!isFeatureEnabled('mockExternalApis'))('should check feature flags', () => {
    const testConfig = getTestConfig();
    expect(testConfig.features.mockExternalApis).toBe(true);
    expect(isFeatureEnabled('mockExternalApis')).toBe(true);
  });
  
  it('should measure performance', () => {
    const measure = measurePerformance('test-operation');
    
    // Test the performance measurement utility structure and behavior
    // rather than relying on timing precision which is unreliable in CI
    
    // Capture initial state
    const startTime = performance.now();
    
    // Add some marks
    measure.mark('start-processing');
    
    // Do some minimal synchronous work
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += i;
    }
    
    measure.mark('mid-processing');
    
    // Do a bit more work
    for (let i = 0; i < 10000; i++) {
      sum += i * 2;
    }
    
    const results = measure.end();
    const endTime = performance.now();
    
    // Test the utility's correctness rather than exact timing
    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('marks');
    expect(typeof results.total).toBe('number');
    expect(results.total).toBeGreaterThan(0);
    
    // Verify marks structure
    expect(results.marks).toHaveProperty('start-processing');
    expect(results.marks).toHaveProperty('mid-processing');
    expect(typeof results.marks['start-processing']).toBe('number');
    expect(typeof results.marks['mid-processing']).toBe('number');
    
    // Verify logical order of marks (this should always be true)
    expect(results.marks['start-processing']).toBeLessThan(results.marks['mid-processing']);
    expect(results.marks['start-processing']).toBeGreaterThanOrEqual(0);
    expect(results.marks['mid-processing']).toBeLessThan(results.total);
    
    // Verify the total time is reasonable (should be between manual measurements)
    const manualTotal = endTime - startTime;
    expect(results.total).toBeLessThanOrEqual(manualTotal + 1); // Allow 1ms tolerance
    
    // Verify work was actually done
    expect(sum).toBeGreaterThan(0);
  });
  
  it('should wait for conditions', async () => {
    let counter = 0;
    const incrementCounter = setInterval(() => counter++, 100);
    
    try {
      await waitForCondition(
        () => counter >= 3,
        { 
          timeout: 1000, 
          interval: 50,
          message: 'Counter did not reach 3'
        }
      );
      
      expect(counter).toBeGreaterThanOrEqual(3);
    } finally {
      clearInterval(incrementCounter);
    }
  });
  
  it('should have proper logging configuration', () => {
    const testConfig = getTestConfig();
    expect(testConfig.logging.level).toBe('error');
    expect(testConfig.logging.debug).toBe(false);
    expect(testConfig.logging.showStack).toBe(true);
    
    // Logger should respect configuration
    logger.debug('This should not appear in test output');
    logger.error('This should appear in test output');
  });
  
  it('should have performance thresholds', () => {
    const testConfig = getTestConfig();
    expect(testConfig.performance.thresholds.apiResponse).toBe(100);
    expect(testConfig.performance.thresholds.dbQuery).toBe(50);
    expect(testConfig.performance.thresholds.nodeParse).toBe(200);
  });
  
  it('should disable caching and rate limiting in tests', () => {
    const testConfig = getTestConfig();
    expect(testConfig.cache.enabled).toBe(false);
    expect(testConfig.cache.ttl).toBe(0);
    expect(testConfig.rateLimiting.max).toBe(0);
    expect(testConfig.rateLimiting.window).toBe(0);
  });
  
  it('should configure test paths', () => {
    const testConfig = getTestConfig();
    expect(testConfig.paths.fixtures).toBe('./tests/fixtures');
    expect(testConfig.paths.data).toBe('./tests/data');
    expect(testConfig.paths.snapshots).toBe('./tests/__snapshots__');
  });
  
  it('should support MSW configuration', () => {
    // Ensure test environment is loaded
    if (!process.env.MSW_ENABLED) {
      loadTestEnvironment();
    }
    
    const testConfig = getTestConfig();
    expect(testConfig.mocking.msw.enabled).toBe(true);
    expect(testConfig.mocking.msw.apiDelay).toBe(0);
  });
});