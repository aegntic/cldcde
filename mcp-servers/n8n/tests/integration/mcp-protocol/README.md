# MCP Protocol Integration Tests

This directory contains comprehensive integration tests for the Model Context Protocol (MCP) implementation in n8n-mcp.

## Test Structure

### Core Tests
- **basic-connection.test.ts** - Tests basic MCP server functionality and tool execution
- **protocol-compliance.test.ts** - Tests JSON-RPC 2.0 compliance and protocol specifications
- **tool-invocation.test.ts** - Tests all MCP tool categories and their invocation
- **session-management.test.ts** - Tests session lifecycle, multiple sessions, and recovery
- **error-handling.test.ts** - Tests error handling, edge cases, and invalid inputs
- **performance.test.ts** - Performance benchmarks and stress tests

### Helper Files
- **test-helpers.ts** - TestableN8NMCPServer wrapper for testing with custom transports

## Running Tests

```bash
# Run all MCP protocol tests
npm test -- tests/integration/mcp-protocol/

# Run specific test file
npm test -- tests/integration/mcp-protocol/basic-connection.test.ts

# Run with coverage
npm test -- tests/integration/mcp-protocol/ --coverage
```

## Test Coverage

These tests ensure:
- ✅ JSON-RPC 2.0 protocol compliance
- ✅ Proper request/response handling
- ✅ All tool categories are tested
- ✅ Error handling and edge cases
- ✅ Session management and lifecycle
- ✅ Performance and scalability

## Known Issues

1. The InMemoryTransport from MCP SDK has some limitations with connection lifecycle
2. Tests use the actual database, so they require `data/nodes.db` to exist
3. Some tests are currently skipped due to transport issues (being worked on)

## Future Improvements

1. Mock the database for true unit testing
2. Add WebSocket transport tests
3. Add authentication/authorization tests
4. Add rate limiting tests
5. Add more performance benchmarks