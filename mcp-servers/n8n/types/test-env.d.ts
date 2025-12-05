/**
 * Type definitions for test environment variables
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Core Environment
      NODE_ENV: 'test' | 'development' | 'production';
      MCP_MODE?: 'test' | 'http' | 'stdio';
      TEST_ENVIRONMENT?: string;

      // Database Configuration
      NODE_DB_PATH?: string;
      REBUILD_ON_START?: string;
      TEST_SEED_DATABASE?: string;
      TEST_SEED_TEMPLATES?: string;

      // API Configuration
      N8N_API_URL?: string;
      N8N_API_KEY?: string;
      N8N_WEBHOOK_BASE_URL?: string;
      N8N_WEBHOOK_TEST_URL?: string;

      // Server Configuration
      PORT?: string;
      HOST?: string;
      CORS_ORIGIN?: string;

      // Authentication
      AUTH_TOKEN?: string;
      MCP_AUTH_TOKEN?: string;

      // Logging
      LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
      DEBUG?: string;
      TEST_LOG_VERBOSE?: string;
      ERROR_SHOW_STACK?: string;
      ERROR_SHOW_DETAILS?: string;

      // Test Timeouts
      TEST_TIMEOUT_UNIT?: string;
      TEST_TIMEOUT_INTEGRATION?: string;
      TEST_TIMEOUT_E2E?: string;
      TEST_TIMEOUT_GLOBAL?: string;

      // Test Execution
      TEST_RETRY_ATTEMPTS?: string;
      TEST_RETRY_DELAY?: string;
      TEST_PARALLEL?: string;
      TEST_MAX_WORKERS?: string;

      // Feature Flags
      FEATURE_TEST_COVERAGE?: string;
      FEATURE_TEST_SCREENSHOTS?: string;
      FEATURE_TEST_VIDEOS?: string;
      FEATURE_TEST_TRACE?: string;
      FEATURE_MOCK_EXTERNAL_APIS?: string;
      FEATURE_USE_TEST_CONTAINERS?: string;

      // Mock Services
      MSW_ENABLED?: string;
      MSW_API_DELAY?: string;
      REDIS_MOCK_ENABLED?: string;
      REDIS_MOCK_PORT?: string;
      ELASTICSEARCH_MOCK_ENABLED?: string;
      ELASTICSEARCH_MOCK_PORT?: string;

      // Test Paths
      TEST_FIXTURES_PATH?: string;
      TEST_DATA_PATH?: string;
      TEST_SNAPSHOTS_PATH?: string;

      // Performance Thresholds
      PERF_THRESHOLD_API_RESPONSE?: string;
      PERF_THRESHOLD_DB_QUERY?: string;
      PERF_THRESHOLD_NODE_PARSE?: string;

      // Rate Limiting
      RATE_LIMIT_MAX?: string;
      RATE_LIMIT_WINDOW?: string;

      // Caching
      CACHE_TTL?: string;
      CACHE_ENABLED?: string;

      // Cleanup
      TEST_CLEANUP_ENABLED?: string;
      TEST_CLEANUP_ON_FAILURE?: string;

      // Network
      NETWORK_TIMEOUT?: string;
      NETWORK_RETRY_COUNT?: string;

      // Memory
      TEST_MEMORY_LIMIT?: string;

      // Coverage
      COVERAGE_DIR?: string;
      COVERAGE_REPORTER?: string;
    }
  }
}

// Export empty object to make this a module
export {};