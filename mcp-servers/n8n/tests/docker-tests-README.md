# Docker Config File Support Tests

This directory contains comprehensive tests for the Docker config file support feature added to n8n-mcp.

## Test Structure

### Unit Tests (`tests/unit/docker/`)

1. **parse-config.test.ts** - Tests for the JSON config parser
   - Basic JSON parsing functionality
   - Environment variable precedence
   - Shell escaping and quoting
   - Nested object flattening
   - Error handling for invalid JSON

2. **serve-command.test.ts** - Tests for "n8n-mcp serve" command
   - Command transformation logic
   - Argument preservation
   - Integration with config loading
   - Backwards compatibility

3. **config-security.test.ts** - Security-focused tests
   - Command injection prevention
   - Shell metacharacter handling
   - Path traversal protection
   - Polyglot payload defense
   - Real-world attack scenarios

4. **edge-cases.test.ts** - Edge case and stress tests
   - JavaScript number edge cases
   - Unicode handling
   - Deep nesting performance
   - Large config files
   - Invalid data types

### Integration Tests (`tests/integration/docker/`)

1. **docker-config.test.ts** - Full Docker container tests with config files
   - Config file loading and parsing
   - Environment variable precedence
   - Security in container context
   - Complex configuration scenarios

2. **docker-entrypoint.test.ts** - Docker entrypoint script tests
   - MCP mode handling
   - Database initialization
   - Permission management
   - Signal handling
   - Authentication validation

## Running the Tests

### Prerequisites
- Node.js and npm installed
- Docker installed (for integration tests)
- Build the project first: `npm run build`

### Commands

```bash
# Run all Docker config tests
npm run test:docker

# Run only unit tests (no Docker required)
npm run test:docker:unit

# Run only integration tests (requires Docker)
npm run test:docker:integration

# Run security-focused tests
npm run test:docker:security

# Run with coverage
./scripts/test-docker-config.sh coverage
```

### Individual test files
```bash
# Run a specific test file
npm test -- tests/unit/docker/parse-config.test.ts

# Run with watch mode
npm run test:watch -- tests/unit/docker/

# Run with coverage
npm run test:coverage -- tests/unit/docker/config-security.test.ts
```

## Test Coverage

The tests cover:

1. **Functionality**
   - JSON parsing and environment variable conversion
   - Nested object flattening with underscore separation
   - Environment variable precedence (env vars override config)
   - "n8n-mcp serve" command auto-enables HTTP mode

2. **Security**
   - Command injection prevention through proper shell escaping
   - Protection against malicious config values
   - Safe handling of special characters and Unicode
   - Prevention of path traversal attacks

3. **Edge Cases**
   - Invalid JSON handling
   - Missing config files
   - Permission errors
   - Very large config files
   - Deep nesting performance

4. **Integration**
   - Full Docker container behavior
   - Database initialization with file locking
   - Permission handling (root vs nodejs user)
   - Signal propagation and process management

## CI/CD Considerations

Integration tests are skipped by default unless:
- Running in CI (CI=true environment variable)
- Explicitly enabled (RUN_DOCKER_TESTS=true)

This prevents test failures on developer machines without Docker.

## Security Notes

The config parser implements defense in depth:
1. All values are wrapped in single quotes for shell safety
2. Single quotes within values are escaped as '"'"'
3. No variable expansion occurs within single quotes
4. Arrays and null values are ignored (not exported)
5. The parser exits silently on any error to prevent container startup issues

## Troubleshooting

If tests fail:
1. Ensure Docker is running (for integration tests)
2. Check that the project is built (`npm run build`)
3. Verify no containers are left running: `docker ps -a | grep n8n-mcp-test`
4. Clean up test containers: `docker rm $(docker ps -aq -f name=n8n-mcp-test)`