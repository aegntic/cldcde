# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.10.8] - 2025-09-04

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.107.4 → 1.109.2
  - @n8n/n8n-nodes-langchain: 1.106.2 → 1.109.1
  - n8n-nodes-base: 1.106.3 → 1.108.0 (via dependencies)
- **Node Database**: Rebuilt with 535 nodes from updated n8n packages
- **Node.js Compatibility**: Optimized for Node.js v22.17.0 LTS
  - Enhanced better-sqlite3 native binary compatibility
  - Fixed SQL.js fallback mode for environments without native binaries
- **CI/CD Improvements**: Fixed Rollup native module compatibility for GitHub Actions
  - Added explicit platform-specific rollup binaries for cross-platform builds
  - Resolved npm ci failures in Linux CI environment
  - Fixed package-lock.json synchronization issues
- **Platform Support**: Enhanced cross-platform deployment compatibility
  - macOS ARM64 and Linux x64 platform binaries included
  - Improved npm package distribution with proper dependency resolution
- All 1,728+ tests passing with updated dependencies

### Fixed
- **CI/CD Pipeline**: Resolved test failures in GitHub Actions
  - Fixed pyodide version conflicts between langchain dependencies
  - Regenerated package-lock.json with proper dependency resolution
  - Fixed Rollup native module loading in Linux CI environment
- **Database Compatibility**: Enhanced SQL.js fallback reliability
  - Improved parameter binding and state management
  - Fixed statement cleanup to prevent memory leaks
- **Deployment Reliability**: Better handling of platform-specific dependencies
  - npm ci now works consistently across development and CI environments

## [2.10.5] - 2025-08-20

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.106.3 → 1.107.4
  - n8n-core: 1.105.3 → 1.106.2
  - n8n-workflow: 1.103.3 → 1.104.1
  - @n8n/n8n-nodes-langchain: 1.105.3 → 1.106.2
- **Node Database**: Rebuilt with 535 nodes from updated n8n packages
- All tests passing with updated dependencies

## [2.10.4] - 2025-08-12

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.105.2 → 1.106.3
  - n8n-core: 1.104.1 → 1.105.3
  - n8n-workflow: 1.102.1 → 1.103.3
  - @n8n/n8n-nodes-langchain: 1.104.1 → 1.105.3
- **Node Database**: Rebuilt with 535 nodes from updated n8n packages
- All 1,728 tests passing with updated dependencies

## [2.10.3] - 2025-08-07

### Fixed
- **Validation System Robustness**: Fixed multiple critical validation issues affecting AI agents and workflow validation (fixes #58, #68, #70, #73)
  - **Issue #73**: Fixed `validate_node_minimal` crash when config is undefined
    - Added safe property access with optional chaining (`config?.resource`)
    - Tool now handles undefined, null, and malformed configs gracefully
  - **Issue #58**: Fixed `validate_node_operation` crash on invalid nodeType
    - Added type checking before calling string methods
    - Prevents "Cannot read properties of undefined (reading 'replace')" error
  - **Issue #70**: Fixed validation profile settings being ignored
    - Extended profile parameter to all validation phases (nodes, connections, expressions)
    - Added Sticky Notes filtering to reduce false positives
    - Enhanced cycle detection to allow legitimate loops (SplitInBatches)
  - **Issue #68**: Added error recovery suggestions for AI agents
    - New `addErrorRecoverySuggestions()` method provides actionable recovery steps
    - Categorizes errors and suggests specific fixes for each type
    - Helps AI agents self-correct when validation fails

### Added
- **Input Validation System**: Comprehensive validation for all MCP tool inputs
  - Created `validation-schemas.ts` with custom validation utilities
  - No external dependencies - pure TypeScript implementation
  - Tool-specific validation schemas for all MCP tools
  - Clear error messages with field-level details
- **Enhanced Cycle Detection**: Improved detection of legitimate loops vs actual cycles
  - Recognizes SplitInBatches loop patterns as valid
  - Reduces false positive cycle warnings
- **Comprehensive Test Suite**: Added 16 tests covering all validation fixes
  - Tests for crash prevention with malformed inputs
  - Tests for profile behavior across validation phases
  - Tests for error recovery suggestions
  - Tests for legitimate loop patterns

### Enhanced
- **Validation Profiles**: Now consistently applied across all validation phases
  - `minimal`: Reduces warnings for basic validation
  - `runtime`: Standard validation for production workflows
  - `ai-friendly`: Optimized for AI agent workflow creation
  - `strict`: Maximum validation for critical workflows
- **Error Messages**: More helpful and actionable for both humans and AI agents
  - Specific recovery suggestions for common errors
  - Clear guidance on fixing validation issues
  - Examples of correct configurations

## [2.10.2] - 2025-08-05

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.104.1 → 1.105.2
  - n8n-core: 1.103.1 → 1.104.1
  - n8n-workflow: 1.101.0 → 1.102.1
  - @n8n/n8n-nodes-langchain: 1.103.1 → 1.104.1
- **Node Database**: Rebuilt with 534 nodes from updated n8n packages
- **Template Library**: Fetched 499 workflow templates from the last 12 months
  - Templates are filtered to include only those created or updated within the past year
  - This ensures the template library contains fresh and actively maintained workflows
- All 1,620 tests passing with updated dependencies

## [2.10.1] - 2025-08-02

### Fixed
- **Memory Leak in SimpleCache**: Fixed critical memory leak causing MCP server connection loss after several hours (fixes #118)
  - Added proper timer cleanup in `SimpleCache.destroy()` method
  - Updated MCP server shutdown to clean up cache timers
  - Enhanced HTTP server error handling with transport error handlers
  - Fixed event listener cleanup to prevent accumulation
  - Added comprehensive test coverage for memory leak prevention

## [2.10.0] - 2025-08-02

### Added
- **Automated Release System**: Complete CI/CD pipeline for automated releases on version bump
  - GitHub Actions workflow (`.github/workflows/release.yml`) with 7 coordinated jobs
  - Automatic version detection and changelog extraction
  - Multi-artifact publishing: GitHub releases, NPM package, Docker images
  - Interactive release preparation tool (`npm run prepare:release`)
  - Comprehensive release testing tool (`npm run test:release-automation`)
  - Full documentation in `docs/AUTOMATED_RELEASES.md`
  - Zero-touch releases: version bump → automatic everything

### Security
- **CI/CD Security Enhancements**:
  - Replaced deprecated `actions/create-release@v1` with secure `gh` CLI
  - Fixed git checkout vulnerability using safe `git show` commands
  - Fixed command injection risk using proper argument arrays
  - Added concurrency control to prevent simultaneous releases
  - Added disk space checks before resource-intensive operations
  - Implemented confirmation gates for destructive operations

### Changed
- **Dockerfile Consolidation**: Removed redundant `Dockerfile.n8n` in favor of single optimized `Dockerfile`
  - n8n packages are not required at runtime for N8N_MODE functionality
  - Standard image works perfectly with `N8N_MODE=true` environment variable
  - Reduces build complexity and maintenance overhead
  - Image size reduced by 500MB+ (no unnecessary n8n packages)
  - Build time improved from 8+ minutes to 1-2 minutes

### Added (CI/CD Features)
- **Developer Tools**:
  - `scripts/prepare-release.js`: Interactive guided release tool
  - `scripts/test-release-automation.js`: Validates entire release setup
  - `scripts/extract-changelog.js`: Modular changelog extraction
- **Release Automation Features**:
  - NPM publishing with 3-retry mechanism for network resilience
  - Multi-platform Docker builds (amd64, arm64)
  - Semantic version validation and prerelease detection
  - Automatic documentation badge updates
  - Runtime-optimized NPM package (8 deps vs 50+, ~50MB vs 1GB+)

### Fixed
- Fixed missing `axios` dependency in `package.runtime.json` causing Docker build failures

## [2.9.1] - 2025-08-02

### Fixed
- **Fixed Collection Validation**: Fixed critical issue where AI agents created invalid fixedCollection structures causing "propertyValues[itemName] is not iterable" error (fixes #90)
  - Created generic `FixedCollectionValidator` utility class that handles 12 different node types
  - Validates and auto-fixes common AI-generated patterns for Switch, If, Filter nodes
  - Extended support to Summarize, Compare Datasets, Sort, Aggregate, Set, HTML, HTTP Request, and Airtable nodes
  - Added comprehensive test coverage with 19 tests for all affected node types
  - Provides clear error messages and automatic structure corrections
- **TypeScript Type Safety**: Improved type safety in fixed collection validator
  - Replaced all `any` types with proper TypeScript types (`NodeConfig`, `NodeConfigValue`)
  - Added type guards for safe property access
  - Fixed potential memory leak in `getAllPatterns` by creating deep copies
  - Added circular reference protection using `WeakSet` in structure traversal
- **Node Type Normalization**: Fixed inconsistent node type casing
  - Normalized `compareDatasets` to `comparedatasets` and `httpRequest` to `httprequest`
  - Ensures consistent node type handling across all validation tools
  - Maintains backward compatibility with existing workflows

### Enhanced
- **Code Review Improvements**: Addressed all code review feedback
  - Made output keys deterministic by removing `Math.random()` usage
  - Improved error handling with comprehensive null/undefined/array checks
  - Enhanced memory safety with proper object cloning
  - Added protection against circular references in configuration objects

### Testing
- **Comprehensive Test Coverage**: Added extensive tests for fixedCollection validation
  - 19 tests covering all 12 affected node types
  - Tests for edge cases including empty configs, non-object values, and circular references
  - Real-world AI agent pattern tests based on actual ChatGPT/Claude generated configs
  - Version compatibility tests across all validation profiles
  - TypeScript compilation tests ensuring type safety

## [2.9.0] - 2025-08-01

### Added
- **n8n Integration with MCP Client Tool Support**: Complete n8n integration enabling n8n-mcp to run as MCP server within n8n workflows
  - Full compatibility with n8n's MCP Client Tool node
  - Dedicated n8n mode (`N8N_MODE=true`) for optimized operation
  - Workflow examples and n8n-friendly tool descriptions
  - Quick deployment script (`deploy/quick-deploy-n8n.sh`) for easy setup
  - Docker configuration specifically for n8n deployment (`Dockerfile.n8n`, `docker-compose.n8n.yml`)
  - Test scripts for n8n integration (`test-n8n-integration.sh`, `test-n8n-mode.sh`)
- **n8n Deployment Documentation**: Comprehensive guide for deploying n8n-MCP with n8n (`docs/N8N_DEPLOYMENT.md`)
  - Local testing instructions using `/scripts/test-n8n-mode.sh`
  - Production deployment with Docker Compose
  - Cloud deployment guide for Hetzner, AWS, and other providers
  - n8n MCP Client Tool setup and configuration
  - Troubleshooting section with common issues and solutions
- **Protocol Version Negotiation**: Intelligent client detection for n8n compatibility
  - Automatically detects n8n clients and uses protocol version 2024-11-05
  - Standard MCP clients get the latest version (2025-03-26)
  - Improves compatibility with n8n's MCP Client Tool node
  - Comprehensive protocol negotiation test suite
- **Comprehensive Parameter Validation**: Enhanced validation for all MCP tools
  - Clear, user-friendly error messages for invalid parameters
  - Numeric parameter conversion and edge case handling
  - 52 new parameter validation tests
  - Consistent error format across all tools
- **Session Management**: Improved session handling with comprehensive test coverage
  - Fixed memory leak potential with async cleanup
  - Better connection close handling
  - Enhanced session management tests
- **Dynamic README Version Badge**: Made version badge update automatically from package.json
  - Added `update-readme-version.js` script
  - Enhanced `sync-runtime-version.js` to update README badges
  - Version badge now stays in sync during publish workflow

### Fixed
- **Docker Build Optimization**: Fixed Dockerfile.n8n using wrong dependencies
  - Now uses `package.runtime.json` instead of full `package.json`
  - Reduces build time from 13+ minutes to 1-2 minutes
  - Fixes ARM64 build failures due to network timeouts
  - Reduces image size from ~1.5GB to ~280MB
- **CI Test Failures**: Resolved Docker entrypoint permission issues
  - Updated tests to accept dynamic UID range (10000-59999)
  - Enhanced lock file creation with better error recovery
  - Fixed TypeScript lint errors in test files
  - Fixed flaky performance tests with deterministic versions
- **Schema Validation Issues**: Fixed n8n nested output format compatibility
  - Added validation for n8n's nested output workaround
  - Fixed schema validation errors with n8n MCP Client Tool
  - Enhanced error sanitization for production environments

### Changed
- **Memory Management**: Improved session cleanup to prevent memory leaks
- **Error Handling**: Enhanced error sanitization for production environments
- **Docker Security**: Using unpredictable UIDs/GIDs (10000-59999 range) for better security
- **CI/CD Configuration**: Made codecov patch coverage informational to prevent CI failures on infrastructure code
- **Test Scripts**: Enhanced with Docker auto-installation and better user experience
  - Added colored output and progress indicators
  - Automatic Docker installation for multiple operating systems
  - n8n API key flow for management tools

### Security
- **Enhanced Docker Security**: Dynamic UID/GID generation for containers
- **Error Sanitization**: Improved error messages to prevent information leakage
- **Permission Handling**: Better permission management for mounted volumes
- **Input Validation**: Comprehensive parameter validation prevents injection attacks

## [2.8.3] - 2025-07-31

### Fixed
- **Docker User Switching**: Fixed critical issue where user switching was completely broken in Alpine Linux containers
  - Added `su-exec` package for proper privilege dropping in Alpine containers
  - Fixed broken shell command in entrypoint that used invalid `exec $*` syntax
  - Fixed non-existent `printf %q` command in Alpine's BusyBox shell
  - Rewrote user switching logic to properly exec processes with nodejs user
  - Fixed race condition in database initialization by ensuring lock directory exists
- **Docker Integration Tests**: Fixed failing tests due to Alpine Linux ps command behavior
  - Alpine's BusyBox ps shows numeric UIDs instead of usernames for non-system users
  - Tests now accept multiple possible values: "nodejs", "1001", or "1" (truncated)
  - Added proper process user verification instead of relying on docker exec output
  - Added demonstration test showing docker exec vs main process user context

### Security
- **Command Injection Prevention**: Added comprehensive input validation in n8n-mcp wrapper
  - Whitelist-based argument validation to prevent command injection
  - Only allows safe arguments: --port, --host, --verbose, --quiet, --help, --version
  - Rejects any arguments containing shell metacharacters or suspicious content
- **Database Initialization**: Added proper file locking to prevent race conditions
  - Uses flock for exclusive database initialization
  - Prevents multiple containers from corrupting database during simultaneous startup

### Testing
- **Docker Test Reliability**: Comprehensive fixes for CI environment compatibility
  - Added Docker image build step in test setup
  - Fixed environment variable visibility tests to check actual process environment
  - Fixed user switching tests to check real process user instead of docker exec context
  - All 18 Docker integration tests now pass reliably in CI

### Changed
- **Docker Base Image**: Updated su-exec installation in Dockerfile for proper user switching
- **Error Handling**: Improved error messages and logging in Docker entrypoint script

## [2.8.2] - 2025-07-31

### Added
- **Docker Configuration File Support**: Full support for JSON config files in Docker containers (fixes #105)
  - Parse JSON configuration files and safely export as environment variables
  - Support for `/app/config.json` mounting in Docker containers
  - Secure shell quoting to prevent command injection vulnerabilities
  - Dangerous environment variable blocking (PATH, LD_PRELOAD, etc.)
  - Key sanitization for invalid environment variable names
  - Support for all JSON data types with proper edge case handling

### Fixed
- **Docker Server Mode**: Fixed Docker image failing to start in server mode
  - Added `n8n-mcp serve` command support in Docker entrypoint
  - Properly set HTTP mode when `serve` command is used
  - Fixed missing n8n-mcp binary in Docker image

### Security
- **Command Injection Prevention**: Comprehensive security hardening for config parsing
  - Implemented POSIX-compliant shell quoting without using eval
  - Blocked dangerous environment variables that could affect system security
  - Added protection against shell metacharacters in configuration values
  - Sanitized configuration keys to prevent invalid shell variable names

### Testing
- **Docker Configuration Tests**: Added 53 comprehensive tests for Docker config support
  - Unit tests for config parsing, security, and edge cases
  - Integration tests for Docker entrypoint behavior
  - Tests for serve command transformation
  - Security-focused tests for injection prevention

### Documentation
- Updated Docker documentation with config file mounting examples
- Added troubleshooting guide for Docker configuration issues

## [2.8.0] - 2025-07-30

### Added
- **Enhanced Test Suite**: Expanded test coverage from 1,182 to 1,356 tests
  - **Unit Tests**: Increased from 933 to 1,107 tests across 44 files (was 30)
  - Added comprehensive edge case testing for all validators
  - Split large test files for better organization and maintainability
  - Added test documentation for common patterns and edge cases
  - Improved test factory patterns for better test data generation

### Fixed
- **All Test Failures**: Achieved 100% test pass rate (was 99.5%)
  - Fixed logger tests by properly setting DEBUG environment variable
  - Fixed MSW configuration tests with proper environment restoration
  - Fixed workflow validator tests by adding proper connections between nodes
  - Fixed TypeScript compilation errors with explicit type annotations
  - Fixed ValidationResult mocks to include all required properties
  - Fixed environment variable handling in tests for better isolation

### Enhanced
- **Test Organization**: Restructured test files for better maintainability
  - Split config-validator tests into 4 focused files: basic, edge-cases, node-specific, security
  - Added dedicated edge case test files for all validators
  - Improved test naming convention to "should X when Y" pattern
  - Better test isolation with proper setup/teardown

### Documentation
- **Test Documentation**: Added comprehensive test guides
  - Created test documentation files for common patterns
  - Updated test counts in README.md to reflect new test suite
  - Added edge case testing guidelines

### CI/CD
- **GitHub Actions**: Fixed permission issues
  - Added proper permissions for test, benchmark-pr, and publish workflows
  - Fixed status write permissions for benchmark comparisons
  - Note: Full permissions will take effect after merge to main branch

## [2.7.23] - 2025-07-30

### Added
- **Comprehensive Testing Infrastructure**: Implemented complete test suite with 1,182 tests
  - **933 Unit Tests** across 30 files covering all services, parsers, database, and MCP layers
  - **249 Integration Tests** across 14 files for MCP protocol, database operations, and error handling
  - **Test Framework**: Vitest with TypeScript, coverage reporting, parallel execution
  - **Mock Strategy**: MSW for API mocking, database mocks, MCP SDK test utilities
  - **CI/CD**: GitHub Actions workflow with automated testing on all PRs
  - **Test Coverage**: Infrastructure in place with lcov, html, and Codecov integration
  - **Performance Testing**: Environment-aware thresholds (CI vs local)
  - **Database Isolation**: Each test gets its own database for parallel execution

### Fixed
- **CI Test Failures**: Resolved all 115 initially failing integration tests
  - Fixed MCP response structure: `response.content[0].text` not `response[0].text`
  - Fixed `process.exit(0)` in test setup causing Vitest failures
  - Fixed database isolation issues for parallel test execution
  - Fixed environment-aware performance thresholds
  - Fixed MSW setup isolation preventing interference with unit tests
  - Fixed empty database handling in CI environment
  - Fixed TypeScript lint errors and strict mode compliance

### Enhanced
- **Test Architecture**: Complete rewrite for production readiness
  - Proper test isolation with no shared state
  - Comprehensive custom assertions for MCP responses
  - Test data generators and builders for complex scenarios
  - Environment configuration for test modes
  - VSCode integration for debugging
  - Meaningful test organization with AAA pattern

### Documentation
- **Testing Documentation**: Complete overhaul to reflect actual implementation
  - `docs/testing-architecture.md`: Comprehensive testing guide with real examples
  - Documented all 1,182 tests with distribution by component
  - Added lessons learned and common issues/solutions
  - Updated README with accurate test statistics and badges

### Maintenance
- **Cleanup**: Removed 53 development artifacts and test coordination files
  - Deleted temporary agent briefings and coordination documents
  - Updated .gitignore to prevent future accumulation
  - Cleaned up all `FIX_*.md` and `AGENT_*.md` files

## [2.7.22] - 2025-07-28

### Security
- **Docker base images**: Updated from Node.js 20 Alpine to Node.js 22 LTS Alpine
  - Addresses known vulnerabilities in older Alpine images
  - Provides better long-term support with Node.js 22 LTS (supported until April 2027)
  - All Dockerfiles updated: `Dockerfile`, `Dockerfile.railway`, `Dockerfile.test`
  - Docker Compose extractor service updated to use Node.js 22
  - Documentation updated to reflect new base image version

### Compatibility
- Tested and verified compatibility with Node.js 22 LTS
- All dependencies work correctly with the new Node.js version
- Docker builds complete successfully with improved security posture

## [2.7.21] - 2025-07-23

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.102.4 → 1.103.2
  - n8n-core: 1.101.2 → 1.102.1
  - n8n-workflow: 1.99.1 → 1.100.0
  - @n8n/n8n-nodes-langchain: 1.101.2 → 1.102.1
- **Node Database**: Rebuilt with 532 nodes from updated n8n packages
- All validation tests passing with updated dependencies

## [2.7.20] - 2025-07-18

### Fixed
- **Docker container cleanup on session end** (Issue #66)
  - Fixed containers not responding to termination signals when Claude Desktop sessions end
  - Added proper SIGTERM/SIGINT signal handlers to stdio-wrapper.ts
  - Removed problematic trap commands from docker-entrypoint.sh
  - Added STOPSIGNAL directive to Dockerfile for explicit signal handling
  - Implemented graceful shutdown in MCP server with database cleanup
  - Added stdin close detection for proper cleanup when Claude Desktop closes the pipe
  - Containers now properly exit with the `--rm` flag, preventing accumulation
  - Recommended using `--init` flag in Docker run command for best signal handling

### Documentation
- Updated README with container lifecycle management best practices
- Added `--init` flag to all Docker configuration examples
- Added troubleshooting section for container accumulation issues

## [2.7.19] - 2025-07-18

### Fixed
- **Enhanced node type format normalization** (Issue #74)
  - Fixed issue where `n8n-nodes-langchain.chattrigger` (incorrect format) was not being normalized
  - Added support for `n8n-nodes-langchain.*` → `nodes-langchain.*` normalization (without @n8n/ prefix)
  - Implemented case-insensitive node name matching (e.g., `chattrigger` → `chatTrigger`)
  - Added smart camelCase detection for common patterns (trigger, request, sheets, etc.)
  - Fixed `get_node_documentation` tool to use same normalization logic as other tools
  - All MCP tools now consistently handle various format variations:
    - `nodes-langchain.chatTrigger` (correct format)
    - `n8n-nodes-langchain.chatTrigger` (package format)
    - `n8n-nodes-langchain.chattrigger` (package + wrong case)
    - `nodes-langchain.chattrigger` (wrong case only)
    - `@n8n/n8n-nodes-langchain.chatTrigger` (full npm format)
  - Updated all 7 node lookup locations to use normalized types for alternatives generation
  - Enhanced `getNodeTypeAlternatives()` to normalize all generated alternatives

## [2.7.18] - 2025-07-18

### Fixed
- **Node type prefix normalization for AI agents** (Issue #71)
  - AI agents can now use node types directly from n8n workflow exports without manual conversion
  - Added automatic normalization: `n8n-nodes-base.httpRequest` → `nodes-base.httpRequest`
  - Added automatic normalization: `@n8n/n8n-nodes-langchain.agent` → `nodes-langchain.agent`
  - Fixed 9 MCP tools that were failing with full package names:
    - `get_node_info`, `get_node_essentials`, `get_node_as_tool_info`
    - `search_node_properties`, `validate_node_minimal`, `validate_node_config`
    - `get_property_dependencies`, `search_nodes`, `get_node_documentation`
  - Maintains backward compatibility - existing short prefixes continue to work
  - Created centralized `normalizeNodeType` utility for consistent handling across all tools
- **Health check endpoint** - Fixed incorrect `/health` endpoint usage
  - Now correctly uses `/healthz` endpoint which is available on all n8n instances
  - Improved error handling with proper fallback to workflow list endpoint
  - Fixed axios import for healthz endpoint access
- **n8n_list_workflows pagination clarity** (Issue #54)
  - Changed misleading `total` field to `returned` to clarify it's the count of items in current page
  - Added `hasMore` boolean flag for clear pagination indication
  - Added `_note` field with guidance when more data is available ("More workflows available. Use cursor to get next page.")
  - Applied same improvements to `n8n_list_executions` for consistency
  - AI agents now correctly understand they need to use pagination instead of assuming limited total workflows

### Added
- **Node type utilities** in `src/utils/node-utils.ts`
  - `normalizeNodeType()` - Converts full package names to database format
  - `getNodeTypeAlternatives()` - Provides fallback options for edge cases
  - `getWorkflowNodeType()` - Constructs proper n8n workflow format from database values
- **workflowNodeType field** in all MCP tool responses that return node information
  - AI agents now receive both `nodeType` (internal format) and `workflowNodeType` (n8n format)
  - Example: `nodeType: "nodes-base.webhook"`, `workflowNodeType: "n8n-nodes-base.webhook"`
  - Prevents confusion where AI agents would search nodes and use wrong format in workflows
  - Added to: `search_nodes`, `get_node_info`, `get_node_essentials`, `get_node_as_tool_info`, `validate_node_operation`
- **Version information in health check**
  - `n8n_health_check` now returns MCP version and supported n8n version
  - Added `mcpVersion`, `supportedN8nVersion`, and `versionNote` fields
  - Includes instructions for AI agents to inform users about version compatibility
  - Note: n8n API currently doesn't expose instance version, so manual verification is required

### Performance
- **n8n_list_workflows response size optimization**
  - Tool now returns only minimal metadata (id, name, active, dates, tags, nodeCount) instead of full workflow structure
  - Reduced response size by ~95% - from potentially thousands of tokens per workflow to ~10 tokens
  - Eliminated token limit errors when listing workflows with many nodes
  - Updated tool description to clarify it returns "minimal metadata only"
  - Users should use `n8n_get_workflow` to fetch full workflow details when needed

## [2.7.17] - 2025-07-17

### Fixed
- **Removed faulty auto-generated examples from MCP tools** (Issue #60)
  - Removed examples from `get_node_essentials` responses that were misleading AI agents
  - Removed examples from `validate_node_operation` when validation errors occur
  - Examples were showing incorrect configurations (e.g., Slack showing "channel" property instead of required "select" property)
  - Tools now focus on validation errors and fix suggestions instead of potentially incorrect examples
  - Preserved helpful format hints in `get_node_for_task` (these show input formats like "#general" or URL examples, not node configurations)
  - This change reduces confusion and helps AI agents build correct workflows on the first attempt

### Changed
- Updated tool documentation to reflect removal of auto-generated examples
- `get_node_essentials` now points users to `validate_node_operation` for working configurations
- Enhanced validation error messages to be more helpful without relying on examples

## [2.7.16] - 2025-07-17

### Added
- **Comprehensive MCP tools documentation** (Issue #60)
  - Documented 30 previously undocumented MCP tools
  - Added complete parameter descriptions, examples, and best practices
  - Implemented modular documentation system with per-tool files
  - Documentation optimized for AI agent consumption (utilitarian approach)
  - Added documentation for all n8n management tools (n8n_*)
  - Added documentation for workflow validation tools
  - Added documentation for template management tools
  - Improved `tools_documentation()` to serve as central documentation hub

### Enhanced
- **Tool documentation system** completely rewritten for AI optimization
  - Each tool now has its own documentation module
  - Consistent structure: description, parameters, examples, tips, common errors
  - AI-friendly formatting with clear sections and examples
  - Reduced redundancy while maintaining completeness

## [2.7.15] - 2025-07-15

### Fixed
- **HTTP Server URL Handling**: Fixed hardcoded localhost URLs in HTTP server output (Issue #41, #42)
  - Added intelligent URL detection that considers BASE_URL, PUBLIC_URL, and proxy headers
  - Server now displays correct public URLs when deployed behind reverse proxies
  - Added support for X-Forwarded-Proto and X-Forwarded-Host headers when TRUST_PROXY is enabled
  - Fixed port display logic to hide standard ports (80/443) in URLs
  - Added new GET endpoints (/, /mcp) for better API discovery

### Security
- **Host Header Injection Prevention**: Added hostname validation to prevent malicious proxy headers
  - Only accepts valid hostnames (alphanumeric, dots, hyphens, optional port)
  - Rejects hostnames with paths, usernames, or special characters
  - Falls back to safe defaults when invalid headers are detected
- **URL Scheme Validation**: Restricted URL schemes to http/https only
  - Blocks dangerous schemes like javascript:, file://, data:
  - Validates all configured URLs (BASE_URL, PUBLIC_URL)
- **Information Disclosure**: Removed sensitive environment data from API responses
  - Root endpoint no longer exposes internal configuration
  - Only shows essential API information

### Added
- **URL Detection Utility**: New `url-detector.ts` module for intelligent URL detection
  - Prioritizes explicit configuration (BASE_URL/PUBLIC_URL)
  - Falls back to proxy headers when TRUST_PROXY is enabled
  - Uses host/port configuration as final fallback
  - Includes comprehensive security validations
- **Test Scripts**: Added test scripts for URL configuration and security validation
  - `test-url-configuration.ts`: Tests various URL detection scenarios
  - `test-security.ts`: Validates security fixes for malicious headers

### Changed
- **Consistent Versioning**: Fixed version inconsistency between server implementations
  - Both http-server.ts and http-server-single-session.ts now use PROJECT_VERSION
  - Removed hardcoded version strings
- **HTTP Bridge**: Updated to use HOST/PORT environment variables for default URL construction
- **Documentation**: Updated HTTP deployment guide with URL configuration section

## [2.7.14] - 2025-07-15

### Fixed
- **Partial Update Tool**: Fixed validation/execution discrepancy that caused "settings must NOT have additional properties" error (Issue #45)
  - Removed logic in `cleanWorkflowForUpdate` that was incorrectly adding default settings to workflows
  - The function now only removes read-only fields without adding any new properties
  - This fixes the issue where partial updates would pass validation but fail during execution
  - Added comprehensive test coverage in `test-issue-45-fix.ts`

## [2.7.13] - 2025-07-11

### Fixed
- **npx Execution**: Fixed WASM file resolution for sql.js when running via `npx n8n-mcp` (Issue #31)
  - Enhanced WASM file locator to try multiple path resolution strategies
  - Added `require.resolve()` for reliable package location in npm environments
  - Made better-sqlite3 an optional dependency to prevent installation failures
  - Improved error messages when sql.js fails to load
  - The package now works correctly with `npx` without any manual configuration

### Changed
- **Database Adapter**: Improved path resolution for both local development and npm package contexts
  - Supports various npm installation scenarios (global, local, npx cache)
  - Better fallback handling for sql.js WebAssembly file loading

## [2.7.12] - 2025-07-10

### Updated
- **n8n Dependencies**: Updated to latest versions for compatibility and new features
  - n8n: 1.100.1 → 1.101.1
  - n8n-core: 1.99.0 → 1.100.0
  - n8n-workflow: 1.97.0 → 1.98.0
  - @n8n/n8n-nodes-langchain: 1.99.0 → 1.100.1
- **Node Database**: Rebuilt with 528 nodes from updated n8n packages
- All validation tests passing with updated dependencies

## [2.7.11] - 2025-07-10

### Enhanced
- **Token Efficiency**: Significantly reduced MCP tool description lengths for better AI agent performance
  - Documentation tools: Average 129 chars (down from ~250-450)
  - Management tools: Average 93 chars (down from ~200-400)
  - Overall token reduction: ~65-70%
  - Moved detailed documentation to `tools_documentation()` system
  - Only 2 tools exceed 200 chars (list_nodes: 204, n8n_update_partial_workflow: 284)
  - Preserved all essential information while removing redundancy

### Fixed
- **search_nodes Tool**: Major improvements to search functionality for AI agents
  - Primary nodes (webhook, httpRequest) now appear first in search results instead of being buried
  - Fixed issue where searching "webhook" returned specialized triggers instead of the main Webhook node
  - Fixed issue where searching "http call" didn't prioritize HTTP Request node
  - Fixed FUZZY mode returning no results for typos like "slak" (lowered threshold from 300 to 200)
  - Removed unnecessary searchInfo messages that appeared on every search
  - Fixed HTTP node type comparison case sensitivity issue
  - Implemented relevance-based ranking with special boosting for primary nodes
- **search_templates FTS5 Error**: Fixed "no such module: fts5" error in environments without FTS5 support (fixes Claude Desktop issue)
  - Made FTS5 completely optional - detects support at runtime
  - Removed FTS5 from required schema to prevent initialization failures
  - Automatically falls back to LIKE search when FTS5 is unavailable
  - FTS5 tables and triggers created conditionally only if supported
  - Template search now works in ALL SQLite environments

### Added
- **FTS5 Full-Text Search**: Added SQLite FTS5 support for faster and more intelligent node searching
  - Automatic fallback to LIKE queries if FTS5 is unavailable
  - Supports advanced search modes: OR (default), AND (all terms required), FUZZY (typo-tolerant)
  - Significantly improves search performance for large databases
  - FUZZY mode now uses edit distance (Levenshtein) for better typo tolerance
- **FTS5 Detection**: Added runtime detection of FTS5 support
  - `checkFTS5Support()` method in database adapters
  - Conditional initialization of FTS5 features
  - Graceful degradation when FTS5 not available

## [Unreleased]

### Fixed
- **Code Node Documentation**: Corrected information about `$helpers` object and `getWorkflowStaticData` function
  - `$getWorkflowStaticData()` is a standalone function, NOT `$helpers.getWorkflowStaticData()`
  - Updated Code node guide to clarify which functions are standalone vs methods on $helpers
  - Added validation warning when using incorrect `$helpers.getWorkflowStaticData` syntax
  - Based on n8n community feedback and GitHub issues showing this is a common confusion point

### Added
- **Expression vs Code Node Clarification**: Added comprehensive documentation about differences between expression and Code node contexts
  - New section "IMPORTANT: Code Node vs Expression Context" explaining key differences
  - Lists expression-only functions not available in Code nodes ($now(), $today(), Tournament template functions)
  - Clarifies different syntax: $('Node Name') vs $node['Node Name']
  - Documents reversed JMESPath parameter order between contexts
  - Added "Expression Functions NOT in Code Nodes" section with alternatives
- **Enhanced Code Node Validation**: Added new validation checks for common expression/Code node confusion
  - Detects expression syntax {{...}} in Code nodes with clear error message
  - Warns about using $node[] syntax instead of $() in Code nodes
  - Identifies expression-only functions with helpful alternatives
  - Checks for wrong JMESPath parameter order
  - Test script `test-expression-code-validation.ts` to verify validation works correctly

## [2.7.11] - 2025-07-09

### Fixed
- **Issue #26**: Fixed critical issue where AI agents were placing error handling properties inside `parameters` instead of at node level
  - Root cause: AI agents were confused by examples showing `parameters.path` updates and assumed all properties followed the same pattern
  - Error handling properties (`onError`, `retryOnFail`, `maxTries`, `waitBetweenTries`, `alwaysOutputData`) must be placed at the NODE level
  - Other node-level properties (`executeOnce`, `disabled`, `notes`, `notesInFlow`, `credentials`) were previously undocumented for AI agents
  - Updated `n8n_create_workflow` and `n8n_update_partial_workflow` documentation with explicit examples and warnings
  - Verified fix with workflows tGyHrsBNWtaK0inQ, usVP2XRXhI35m3Ts, and swuogdCCmNY7jj71

### Added
- **Comprehensive Node-Level Properties Reference** in tools documentation (`tools_documentation()`)
  - Documents ALL available node-level properties with explanations
  - Shows correct placement and usage for each property
  - Provides complete example node configuration
  - Accessible via `tools_documentation({depth: "full"})` for AI agents
- **Enhanced Workflow Validation** for additional node-level properties
  - Now validates `executeOnce`, `disabled`, `notes`, `notesInFlow` types
  - Checks for misplacement of ALL node-level properties (expanded from 6 to 11)
  - Provides clear error messages with correct examples when properties are misplaced
  - Shows specific fix with example node structure
- **Test Script** `test-node-level-properties.ts` demonstrating correct usage
  - Shows all node-level properties in proper configuration
  - Demonstrates common mistakes to avoid
  - Validates workflow configurations
- **Comprehensive Code Node Documentation** in tools_documentation
  - New `code_node_guide` topic with complete reference for JavaScript and Python
  - Covers all built-in variables: $input, $json, $node, $workflow, $execution, $prevNode
  - Documents helper functions: DateTime (Luxon), JMESPath, $helpers methods
  - Includes return format requirements with correct/incorrect examples
  - Security considerations and banned operations
  - Common patterns: data transformation, filtering, aggregation, error handling
  - Code node as AI tool examples
  - Performance best practices and debugging tips
- **Enhanced Code Node Validation** with n8n-specific patterns
  - Validates return statement presence and format
  - Checks for array of objects with json property
  - Detects common mistakes (returning primitives, missing array wrapper)
  - Validates n8n variable usage ($input, items, $json context)
  - Security checks (eval, exec, require, file system access)
  - Language-specific validation for JavaScript and Python
  - Mode-specific warnings ($json in wrong mode)
  - Async/await pattern validation
  - External library detection with helpful alternatives
- **Expanded Code Node Examples** in ExampleGenerator
  - Data transformation, aggregation, and filtering examples
  - API integration with error handling
  - Python data processing example
  - Code node as AI tool pattern
  - CSV to JSON transformation
  - All examples include proper return format
- **New Code Node Task Templates**
  - `custom_ai_tool`: Create custom tools for AI agents
  - `aggregate_data`: Summary statistics from multiple items
  - `batch_process_with_api`: Process items in batches with rate limiting
  - `error_safe_transform`: Robust data transformation with validation
  - `async_data_processing`: Concurrent processing with limits
  - `python_data_analysis`: Statistical analysis using Python
  - All templates include comprehensive error handling
- **Fixed Misleading Documentation** based on real-world testing:
  - **Crypto Module**: Clarified that `require('crypto')` IS available despite editor warnings
  - **Helper Functions**: Fixed documentation showing `$getWorkflowStaticData()` is standalone, not on $helpers
  - **JMESPath**: Corrected syntax from `jmespath.search()` to `$jmespath()`
  - **Node Access**: Fixed from `$node['Node Name']` to `$('Node Name')`
  - **Python**: Documented `item.json.to_py()` for JsProxy conversion
  - Added comprehensive "Available Functions and Libraries" section
  - Created security examples showing proper crypto usage
  - **JMESPath Numeric Literals**: Added critical documentation about n8n-specific requirement for backticks around numbers in filters
    - Example: `[?age >= \`18\`]` not `[?age >= 18]`
    - Added validation to detect and warn about missing backticks
    - Based on Claude Desktop feedback from workflow testing
  - **Webhook Data Structure**: Fixed common webhook data access gotcha
    - Webhook payload is at `items[0].json.body`, NOT `items[0].json` 
    - Added dedicated "Webhook Data Access" section in Code node documentation
    - Created webhook processing example showing correct data access
    - Added validation to detect incorrect webhook data access patterns
    - New task template `process_webhook_data` with complete example

### Enhanced
- **MCP Tool Documentation** significantly improved:
  - `n8n_create_workflow` now includes complete node example with all properties
  - `n8n_update_partial_workflow` shows difference between node-level vs parameter updates
  - Added "CRITICAL" warnings about property placement
  - Updated best practices and common pitfalls sections
- **Workflow Validator** improvements:
  - Expanded property checking from 6 to 11 node-level properties
  - Better error messages showing complete correct structure
  - Type validation for all node-level boolean and string properties
- **Code Node Validation** enhanced with new checks:
  - Detects incorrect `$helpers.getWorkflowStaticData()` usage
  - Warns about `$helpers` usage without availability check
  - Validates crypto usage with proper require statement
  - All based on common errors found in production workflows
- **Type Definitions** updated:
  - Added `notesInFlow` to WorkflowNode interface in workflow-validator.ts
  - Fixed credentials type from `Record<string, string>` to `Record<string, unknown>` in n8n-api.ts
- **NodeSpecificValidators** now includes comprehensive Code node validation
  - Language-specific syntax checks
  - Return format validation with detailed error messages
  - n8n variable usage validation
  - Security pattern detection
  - Error handling recommendations
  - Mode-specific suggestions
- **Config Validator** improved Code node validation
  - Better return statement detection
  - Enhanced syntax checking for both JavaScript and Python
  - More helpful error messages with examples
  - Detection of common n8n Code node mistakes
- **Fixed Documentation Inaccuracies** based on user testing and n8n official docs:
  - JMESPath: Corrected syntax to `$jmespath()` instead of `jmespath.search()`
  - Node Access: Fixed to show `$('Node Name')` syntax, not `$node`
  - Python: Documented `_input.all()` and `item.json.to_py()` for JsProxy conversion
  - Python: Added underscore prefix documentation for all built-in variables
  - Validation: Skip property visibility warnings for Code nodes to reduce false positives

## [2.7.10] - 2025-07-09

### Documentation Update
- Added comprehensive documentation on how to update error handling properties using `n8n_update_partial_workflow`
- Error handling properties can be updated at the node level using the workflow diff engine:
  - `continueOnFail`: boolean - Whether to continue workflow on node failure
  - `onError`: 'continueRegularOutput' | 'continueErrorOutput' | 'stopWorkflow' - Error handling strategy
  - `retryOnFail`: boolean - Whether to retry on failure
  - `maxTries`: number - Maximum retry attempts
  - `waitBetweenTries`: number - Milliseconds to wait between retries
  - `alwaysOutputData`: boolean - Always output data even on error
- Added test script demonstrating error handling property updates
- Updated WorkflowNode type to include `onError` property in n8n-api types
- Workflow diff engine now properly handles all error handling properties

## [2.7.10] - 2025-07-07

### Added
- Enhanced authentication logging for better debugging of client authentication issues
- Specific error reasons for authentication failures: `no_auth_header`, `invalid_auth_format`, `invalid_token`
- AUTH_TOKEN_FILE support in single-session HTTP server for consistency
- Empty token validation to prevent security issues
- Whitespace trimming for authentication tokens

### Fixed
- Issue #22: Improved authentication failure diagnostics for mcp-remote client debugging
- Issue #16: Fixed AUTH_TOKEN_FILE validation for HTTP mode in Docker production stacks - Docker entrypoint now properly validates and supports AUTH_TOKEN_FILE environment variable
- Security: Removed token length from logs to prevent information disclosure

### Security
- Authentication tokens are now trimmed to handle whitespace edge cases
- Empty tokens are explicitly rejected with clear error messages
- Removed sensitive information (token lengths) from authentication logs

## [2.7.8] - 2025-07-06

### Added
- npx support for zero-installation usage - users can now run `npx n8n-mcp` without installing
- npm package distribution with runtime-only dependencies (8 deps vs 50+ dev deps)
- Dedicated publish script for npm releases with OTP support
- Database path resolution supporting npx, global, and local installations

### Fixed
- Issue #15: Added npx execution support as requested
- Removed development dependencies from npm package (reduced from 1GB+ to ~50MB)
- Node.js version conflicts by excluding n8n dependencies from runtime package

### Changed
- npm package now uses package.runtime.json for publishing (no n8n dependencies)
- Enhanced .gitignore to exclude npm publishing artifacts
- README now highlights npx as the primary installation method

## [2.7.5] - 2025-07-06

### Added
- AUTH_TOKEN_FILE support for reading authentication tokens from files (Docker secrets compatible) - partial implementation
- Known Issues section in README documenting Claude Desktop container duplication bug
- Enhanced authentication documentation in Docker README

### Fixed
- Issue #16: AUTH_TOKEN_FILE was documented but not implemented (partially fixed - see v2.7.10 for complete fix)
- HTTP server now properly supports both AUTH_TOKEN and AUTH_TOKEN_FILE environment variables

### Changed
- Authentication logic now checks AUTH_TOKEN first, then falls back to AUTH_TOKEN_FILE
- Updated Docker documentation to clarify authentication options

## [2.7.4] - 2025-07-03

### Changed
- Renamed `start_here_workflow_guide` tool to `tools_documentation` for better clarity
- Converted tool output from JSON to LLM-friendly plain text format
- Made documentation concise by default with "essentials" depth

### Added
- `depth` parameter to control documentation detail level ("essentials" or "full")
- Per-tool documentation - get help for any specific MCP tool
- Two-tier documentation system:
  - Essentials: Brief description, key parameters, example, performance, tips
  - Full: Complete documentation with all details, examples, best practices
- Quick reference mode when called without parameters
- Documentation for 8 commonly used tools
- Test script for tools documentation (`test:tools-documentation`)

### Removed
- Removed duplicate `tools_documentation` tool definition
- Removed unused `getWorkflowGuide` method (380+ lines)
- Removed old `handlers-documentation.ts` file

## [2.7.3] - 2025-07-02

### Added
- MCP Tools Documentation system (initial implementation)
- `tools_documentation` tool for comprehensive MCP tool documentation
- Documentation includes parameters, examples, best practices, and pitfalls
- Search tools by keyword functionality
- Browse tools by category
- Quick reference guide with workflow patterns

### Fixed
- Cleaned up redundant tool definitions

## [2.7.2] - 2025-07-01

### Fixed
- HTTP deployment documentation improvements
- Docker configuration updates with n8n API options

### Changed
- Updated version handling in multiple configuration files

## [2.7.1] - 2025-06-30

### Fixed
- Workflow diff engine edge cases
- Transactional update processing improvements

### Added
- Additional test coverage for diff operations
- Debug scripts for update operations

## [2.7.0] - 2025-06-29

### Added
- New `n8n_update_partial_workflow` tool for efficient diff-based workflow editing with transactional updates
- WorkflowDiffEngine for applying targeted edits without sending full workflow JSON (80-90% token savings)
- 13 diff operations: addNode, removeNode, updateNode, moveNode, enableNode, disableNode, addConnection, removeConnection, updateConnection, updateSettings, updateName, addTag, removeTag
- Smart node references supporting both node ID and name
- Transaction safety with validation before applying changes
- Validation-only mode for testing diff operations
- Comprehensive test coverage for all diff operations
- Example guide in `docs/workflow-diff-examples.md`
- Two-pass processing allowing operations in any order
- Operation limit of 5 operations per request for reliability
- `n8n_diagnostic` tool to troubleshoot management tools visibility issues
- Version utility (`src/utils/version.ts`) for centralized version management
- Script to sync package.runtime.json version

### Changed
- Renamed `n8n_update_workflow` to `n8n_update_full_workflow` to clarify it replaces entire workflow
- Renamed core MCP files for clarity:
  - `tools-update.ts` → `tools.ts`
  - `server-update.ts` → `server.ts`
  - `http-server-fixed.ts` → `http-server.ts`
- Updated imports across 21+ files to use new file names

### Fixed
- Version mismatch issue where version was hardcoded instead of reading from package.json (GitHub issue #5)
- MCP validation error by simplifying schema to allow additional properties
- n8n API validation by removing all read-only fields in cleanWorkflowForUpdate
- Claude Desktop compatibility by adding additionalProperties: true
- Removed DEBUG console.log statements from MCP server

### Removed
- Legacy HTTP server implementation (`src/http-server.ts`)
- Unused legacy API client (`src/utils/n8n-client.ts`)
- Unnecessary file name suffixes (-update, -fixed)

## [2.6.3] - 2025-06-26

### Added
- `n8n_validate_workflow` tool to validate workflows directly from n8n instance by ID
- Fetches workflow from n8n API and runs comprehensive validation
- Supports all validation profiles and options
- Part of complete lifecycle: discover → build → validate → deploy → execute

## [2.6.2] - 2025-06-26

### Added
- Node type validation to verify node types exist in n8n
- Smart suggestions for common mistakes (e.g., `webhook` → `n8n-nodes-base.webhook`)
- Minimum viable workflow validation preventing single-node workflows (except webhooks)
- Empty connection detection for multi-node workflows
- Helper functions: `getWorkflowStructureExample()` and `getWorkflowFixSuggestions()`

### Fixed
- nodes-base prefix detection now catches errors before database lookup
- Enhanced error messages with clear guidance on proper workflow structure

## [2.6.1] - 2025-06-26

### Added
- typeVersion validation in workflow validator
- Enforces typeVersion on all versioned nodes
- Warns on outdated node versions
- Prevents invalid version numbers

### Fixed
- Missing typeVersion errors with correct version suggestions
- Invalid version detection exceeding maximum supported

## [2.6.0] - 2025-06-26

### Added
- 14 n8n management tools for complete workflow lifecycle management:
  - `n8n_create_workflow` - Create workflows programmatically
  - `n8n_update_workflow` - Update existing workflows
  - `n8n_trigger_webhook_workflow` - Execute workflows via webhooks
  - `n8n_list_executions` - Monitor workflow executions
  - `n8n_health_check` - Check n8n instance connectivity
  - And 9 more workflow and execution management tools
- Integration with n8n-manager-for-ai-agents functionality
- Conditional tool registration based on N8N_API_URL and N8N_API_KEY configuration
- Smart error handling for API limitations

## [2.5.1] - 2025-06-24

### Added
- `get_node_as_tool_info` tool for specific information about using ANY node as an AI tool
- Enhanced AI tool support with usage guidance
- Improved start_here_workflow_guide with Claude Project setup

### Changed
- Enhanced AI tool detection and documentation
- Updated documentation to match current state

## [2.5.0] - 2025-06-24

### Added
- Comprehensive workflow validation system:
  - `validate_workflow` - Validate entire workflows before deployment
  - `validate_workflow_connections` - Check workflow structure and connections
  - `validate_workflow_expressions` - Validate all n8n expressions
- Expression validator for n8n syntax validation
- AI tool connection validation
- Phase 2 validation improvements

## [2.4.2] - 2025-06-24

### Added
- Enhanced operation-aware validation system
- `validate_node_operation` - Verify node configuration with operation awareness
- `validate_node_minimal` - Quick validation for required fields only
- Node-specific validation logic
- Validation profiles support

### Fixed
- Validation improvements based on AI agent feedback

## [2.4.1] - 2025-06-20

### Added
- n8n workflow templates integration:
  - `list_node_templates` - Find workflow templates using specific nodes
  - `get_template` - Get complete workflow JSON for import
  - `search_templates` - Search templates by keywords
  - `get_templates_for_task` - Get curated templates for common tasks
- Template fetching from n8n.io API
- Robust template fetching with retries
- Expanded template window from 6 months to 1 year

### Fixed
- Made templates available in Docker by removing axios from runtime
- Template service made optional in Docker environment
- Non-deterministic CHECK constraint removed from templates table

## [2.4.0] - 2025-06-18

### Added
- AI-optimized tools with 95% size reduction:
  - `get_node_essentials` - Returns only essential properties (10-20) with examples
  - `search_node_properties` - Find specific properties without downloading everything
  - `get_node_for_task` - Get pre-configured node settings for common tasks
  - `list_tasks` - List all available task templates
  - `get_property_dependencies` - Analyze property dependencies and visibility conditions
- Property filter service with curated essential properties
- Example generator for common use cases
- Task templates with pre-configured settings
- Docker build optimization (82% smaller images, 10x faster builds)

### Changed
- Switched to MIT license for wider adoption
- Optimized Docker builds to exclude n8n dependencies at runtime
- Improved tool descriptions and added workflow guide tool

### Fixed
- Docker build failures in GitHub Actions
- Claude Desktop stdio communication issues
- Version array handling in node parser

### Removed
- Legacy MCP implementation files
- n8n dependencies from Docker runtime image

## [2.3.3] - 2025-06-16

### Added
- Smart dependency update system for n8n packages
- GitHub Actions workflow for automated n8n updates
- Alternative Renovate configuration

### Fixed
- n8n package interdependent version requirements
- Node type references in validation script

## [2.3.2] - 2025-06-14

### Added
- Single-session HTTP server architecture
- Direct JSON-RPC implementation for HTTP mode
- Console output isolation for clean JSON-RPC responses

### Fixed
- "stream is not readable" error in HTTP server
- "Server not initialized" error with StreamableHTTPServerTransport
- MCP HTTP server stream errors

## [2.3.1] - 2025-06-13

### Added
- HTTP server mode for remote deployment with token authentication
- MCP-compatible HTTP endpoints
- Security features: CORS, rate limiting, request size limits
- Comprehensive HTTP testing scripts

## [2.3.0] - 2025-06-12

### Added
- Universal Node.js compatibility with automatic database adapter fallback
- Database adapter pattern with BetterSQLiteAdapter and SQLJSAdapter
- Automatic adapter selection based on environment
- sql.js persistence layer with debounced saves

### Changed
- Database operations now use unified adapter interface
- Transparent adapter switching for different Node.js versions

## [2.2.0] - 2025-06-12

### Added
- Enhanced node parser with versioned node support
- Dedicated property extractor for complex node structures
- Full support for @n8n/n8n-nodes-langchain package
- AI tool detection (35 tools with usableAsTool property)

### Changed
- Major refactor based on IMPLEMENTATION_PLAN.md v2.2
- Improved property/operation extraction (452/458 nodes have properties)
- Enhanced documentation mapping

### Fixed
- VersionedNodeType handling
- Documentation mapping issues
- Property extraction for 98.7% of nodes

## [2.1.0] - 2025-06-09

### Added
- Node extraction scripts for n8n modules
- Docker setup for n8n module processing
- Enhanced documentation fetcher
- Node source extractor utility

## [2.0.0] - 2025-06-08

### Added
- Complete overhaul to enhanced documentation-only MCP server
- SQLite database with FTS5 for fast searching
- Comprehensive MCP tools for querying n8n nodes
- Node documentation service as core component

### Changed
- Architecture redesign focusing on documentation serving
- Removed workflow execution capabilities
- Simplified to documentation and knowledge serving

## [1.0.0] - 2025-06-08

### Added
- Initial release
- Basic n8n and MCP integration
- Core workflow automation features

[2.10.4]: https://github.com/czlonkowski/n8n-mcp/compare/v2.10.3...v2.10.4
[2.10.3]: https://github.com/czlonkowski/n8n-mcp/compare/v2.10.2...v2.10.3
[2.10.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.9.1...v2.10.0
[2.9.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.8.3...v2.9.0
[2.8.3]: https://github.com/czlonkowski/n8n-mcp/compare/v2.8.2...v2.8.3
[2.8.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.8.0...v2.8.2
[2.8.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.23...v2.8.0
[2.7.23]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.22...v2.7.23
[2.7.22]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.21...v2.7.22
[2.7.21]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.20...v2.7.21
[2.7.20]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.19...v2.7.20
[2.7.19]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.18...v2.7.19
[2.7.18]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.17...v2.7.18
[2.7.17]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.16...v2.7.17
[2.7.16]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.15...v2.7.16
[2.7.15]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.13...v2.7.15
[2.7.13]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.12...v2.7.13
[2.7.12]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.11...v2.7.12
[2.7.11]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.10...v2.7.11
[2.7.10]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.8...v2.7.10
[2.7.8]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.5...v2.7.8
[2.7.5]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.4...v2.7.5
[2.7.4]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.3...v2.7.4
[2.7.3]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.2...v2.7.3
[2.7.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.1...v2.7.2
[2.7.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.6.3...v2.7.0
[2.6.3]: https://github.com/czlonkowski/n8n-mcp/compare/v2.6.2...v2.6.3
[2.6.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.5.1...v2.6.0
[2.5.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.4.2...v2.5.0
[2.4.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.4.1...v2.4.2
[2.4.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.3.3...v2.4.0
[2.3.3]: https://github.com/czlonkowski/n8n-mcp/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/czlonkowski/n8n-mcp/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/czlonkowski/n8n-mcp/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/czlonkowski/n8n-mcp/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/czlonkowski/n8n-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/czlonkowski/n8n-mcp/releases/tag/v1.0.0