# Test Environment Configuration Documentation

This document describes the test environment configuration system for the n8n-mcp project.

## Overview

The test environment configuration system provides:
- Centralized environment variable management for tests
- Type-safe access to configuration values
- Automatic loading of test-specific settings
- Support for local overrides via `.env.test.local`
- Performance monitoring and feature flags

## Configuration Files

### `.env.test`
The main test environment configuration file. Contains all test-specific environment variables with sensible defaults. This file is committed to the repository.

### `.env.test.local` (optional)
Local overrides for sensitive values or developer-specific settings. This file should be added to `.gitignore` and never committed.

## Usage

### In Test Files

```typescript
import { getTestConfig, getTestTimeout, isFeatureEnabled } from '@tests/setup/test-env';

describe('My Test Suite', () => {
  const config = getTestConfig();
  
  it('should run with proper timeout', () => {
    // Test code here
  }, { timeout: getTestTimeout('integration') });
  
  it.skipIf(!isFeatureEnabled('mockExternalApis'))('should mock external APIs', () => {
    // This test only runs if FEATURE_MOCK_EXTERNAL_APIS=true
  });
});
```

### In Setup Files

```typescript
import { loadTestEnvironment } from './test-env';

// Load test environment at the start of your setup
loadTestEnvironment();
```

## Environment Variables

### Core Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `test` | Must be 'test' for test execution |
| `MCP_MODE` | string | `test` | MCP operation mode |
| `TEST_ENVIRONMENT` | boolean | `true` | Indicates test environment |

### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_DB_PATH` | string | `:memory:` | SQLite database path (use :memory: for in-memory) |
| `REBUILD_ON_START` | boolean | `false` | Rebuild database on startup |
| `TEST_SEED_DATABASE` | boolean | `true` | Seed database with test data |
| `TEST_SEED_TEMPLATES` | boolean | `true` | Seed templates in database |

### API Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `N8N_API_URL` | string | `http://localhost:3001/mock-api` | Mock API endpoint |
| `N8N_API_KEY` | string | `test-api-key` | API key for testing |
| `N8N_WEBHOOK_BASE_URL` | string | `http://localhost:3001/webhook` | Webhook base URL |
| `N8N_WEBHOOK_TEST_URL` | string | `http://localhost:3001/webhook-test` | Webhook test URL |

### Test Execution

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TEST_TIMEOUT_UNIT` | number | `5000` | Unit test timeout (ms) |
| `TEST_TIMEOUT_INTEGRATION` | number | `15000` | Integration test timeout (ms) |
| `TEST_TIMEOUT_E2E` | number | `30000` | E2E test timeout (ms) |
| `TEST_TIMEOUT_GLOBAL` | number | `60000` | Global test timeout (ms) |
| `TEST_RETRY_ATTEMPTS` | number | `2` | Number of retry attempts |
| `TEST_RETRY_DELAY` | number | `1000` | Delay between retries (ms) |
| `TEST_PARALLEL` | boolean | `true` | Run tests in parallel |
| `TEST_MAX_WORKERS` | number | `4` | Maximum parallel workers |

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `FEATURE_TEST_COVERAGE` | boolean | `true` | Enable code coverage |
| `FEATURE_TEST_SCREENSHOTS` | boolean | `false` | Capture screenshots on failure |
| `FEATURE_TEST_VIDEOS` | boolean | `false` | Record test videos |
| `FEATURE_TEST_TRACE` | boolean | `false` | Enable trace recording |
| `FEATURE_MOCK_EXTERNAL_APIS` | boolean | `true` | Mock external API calls |
| `FEATURE_USE_TEST_CONTAINERS` | boolean | `false` | Use test containers for services |

### Logging

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | string | `error` | Log level (debug, info, warn, error) |
| `DEBUG` | boolean | `false` | Enable debug logging |
| `TEST_LOG_VERBOSE` | boolean | `false` | Verbose test logging |
| `ERROR_SHOW_STACK` | boolean | `true` | Show error stack traces |
| `ERROR_SHOW_DETAILS` | boolean | `true` | Show detailed error info |

### Performance Thresholds

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PERF_THRESHOLD_API_RESPONSE` | number | `100` | API response time threshold (ms) |
| `PERF_THRESHOLD_DB_QUERY` | number | `50` | Database query threshold (ms) |
| `PERF_THRESHOLD_NODE_PARSE` | number | `200` | Node parsing threshold (ms) |

### Mock Services

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MSW_ENABLED` | boolean | `true` | Enable Mock Service Worker |
| `MSW_API_DELAY` | number | `0` | API response delay (ms) |
| `REDIS_MOCK_ENABLED` | boolean | `true` | Enable Redis mock |
| `REDIS_MOCK_PORT` | number | `6380` | Redis mock port |
| `ELASTICSEARCH_MOCK_ENABLED` | boolean | `false` | Enable Elasticsearch mock |
| `ELASTICSEARCH_MOCK_PORT` | number | `9201` | Elasticsearch mock port |

### Paths

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TEST_FIXTURES_PATH` | string | `./tests/fixtures` | Test fixtures directory |
| `TEST_DATA_PATH` | string | `./tests/data` | Test data directory |
| `TEST_SNAPSHOTS_PATH` | string | `./tests/__snapshots__` | Snapshots directory |

### Other Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CACHE_TTL` | number | `0` | Cache TTL (0 = disabled) |
| `CACHE_ENABLED` | boolean | `false` | Enable caching |
| `RATE_LIMIT_MAX` | number | `0` | Rate limit max requests (0 = disabled) |
| `RATE_LIMIT_WINDOW` | number | `0` | Rate limit window (ms) |
| `TEST_CLEANUP_ENABLED` | boolean | `true` | Auto cleanup after tests |
| `TEST_CLEANUP_ON_FAILURE` | boolean | `false` | Cleanup on test failure |
| `NETWORK_TIMEOUT` | number | `5000` | Network request timeout (ms) |
| `NETWORK_RETRY_COUNT` | number | `0` | Network retry attempts |
| `TEST_MEMORY_LIMIT` | number | `512` | Memory limit (MB) |

## Best Practices

1. **Never commit sensitive values**: Use `.env.test.local` for API keys, tokens, etc.

2. **Use type-safe config access**: Always use `getTestConfig()` instead of accessing `process.env` directly.

3. **Set appropriate timeouts**: Use `getTestTimeout()` with the correct test type.

4. **Check feature flags**: Use `isFeatureEnabled()` to conditionally run tests.

5. **Reset environment when needed**: Use `resetTestEnvironment()` for test isolation.

## Examples

### Running Tests with Custom Configuration

```bash
# Run with verbose logging
DEBUG=true npm test

# Run with longer timeouts
TEST_TIMEOUT_UNIT=10000 npm test

# Run without mocks
FEATURE_MOCK_EXTERNAL_APIS=false npm test

# Run with test containers
FEATURE_USE_TEST_CONTAINERS=true npm test
```

### Creating Test-Specific Configuration

```typescript
// tests/unit/my-test.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { getTestConfig } from '@tests/setup/test-env';

describe('My Feature', () => {
  const config = getTestConfig();
  
  beforeAll(() => {
    // Use test configuration
    if (config.features.mockExternalApis) {
      // Set up mocks
    }
  });
  
  it('should respect performance thresholds', async () => {
    const start = performance.now();
    
    // Your test code
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(config.performance.thresholds.apiResponse);
  });
});
```

## Troubleshooting

### Tests failing with "Missing required test environment variables"

Ensure `.env.test` exists and contains all required variables. Run:
```bash
cp .env.test.example .env.test
```

### Environment variables not loading

1. Check that `loadTestEnvironment()` is called in your setup
2. Verify file paths are correct
3. Ensure `.env.test` is in the project root

### Type errors with process.env

Make sure to include the type definitions:
```typescript
/// <reference types="../types/test-env" />
```

Or add to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["./types/test-env"]
  }
}
```