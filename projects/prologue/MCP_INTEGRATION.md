# 🔌 Prologue MCP Integration

> **Auto-Detection & Installation of Model Context Protocol Servers**

## Overview

Prologue now includes a sophisticated MCP (Model Context Protocol) auto-detection and installation system as a core feature. This system automatically discovers, evaluates, and installs AI tools and servers that enhance your development workflow.

## ✨ Key Features

### 🤖 Auto-Detection
- **Project Analysis**: Automatically analyzes your project structure and dependencies
- **Smart Recommendations**: Suggests MCP servers based on your tech stack
- **Confidence Scoring**: Only installs servers that meet quality and security thresholds
- **Zero Configuration**: Works out of the box with sensible defaults

### 🔍 Registry Discovery
- **Multiple Registries**: Searches official MCP registry, GitHub, and NPM
- **Real-time Search**: Live search across multiple sources
- **Quality Filtering**: Automatically filters for verified and well-maintained servers
- **Caching**: Intelligent caching for fast repeated searches

### 📦 Smart Installation
- **Multiple Methods**: Supports npm, npx, Docker, Python, and binary installations
- **Dependency Management**: Automatically handles dependencies
- **Configuration**: Generates and manages server configurations
- **Health Checks**: Verifies installations and monitors server health

### 🛡️ Security & Safety
- **Verification**: Prioritizes verified servers and authors
- **Security Scanning**: Analyzes packages for suspicious patterns
- **Sandboxed Installation**: Isolates installations from your main project
- **Rollback**: Easy uninstallation of unwanted servers

## 🚀 Quick Start

### Installation
```bash
# Install Prologue with MCP support
npm install -g @prologue/cli

# Or clone and build from source
git clone https://github.com/aegntic/prologue.git
cd prologue
npm install
npm run build
npm link
```

### Basic Usage

#### 1. Auto-Detect Required Servers
```bash
# Automatically detect and install servers for your current project
prologue mcp --auto-detect
```

#### 2. Search for Servers
```bash
# Interactive search
prologue mcp

# Direct search
prologue mcp --search "database tools"
prologue mcp --search "ai assistants"
```

#### 3. Manage Installed Servers
```bash
# List installed servers
prologue mcp --list

# Check server health
prologue mcp --health-check

# Install specific server
prologue mcp --install "mcp-server-name"

# Manage servers interactively
prologue mcp
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `prologue mcp` | Interactive MCP management menu |
| `--search <query>` | Search for MCP servers |
| `--install <server-id>` | Install a specific server |
| `--list` | List installed servers |
| `--uninstall <server-id>` | Uninstall a server |
| `--auto-detect` | Auto-detect and install required servers |
| `--enable <server-id>` | Enable an installed server |
| `--disable <server-id>` | Disable an installed server |
| `--health-check` | Check health of all servers |

## 🎯 Auto-Detection Logic

The system analyzes your project to determine which MCP servers would be most useful:

### Web Development Projects
- **React/Vue/Angular**: UI testing servers, component analysis tools
- **Express/Fastify**: API testing, documentation generation
- **CSS/Styling**: Design system analysis, accessibility tools

### Data Science Projects
- **Python/Pandas**: Data analysis servers, visualization tools
- **Jupyter**: Notebook enhancement, code analysis
- **ML/AI**: Model training assistants, data preprocessing

### Full-Stack Applications
- **Database Tools**: Schema analysis, query optimization
- **DevOps**: Deployment automation, monitoring tools
- **Testing**: Test generation, coverage analysis

### Example Auto-Detection Output
```
🤖 Analyzing your project to detect required MCP servers...

✅ Auto-detection completed! Installed 3 new servers:
📦 mcp-database-analyzer - Database schema and query optimization
📦 mcp-react-testing - React component testing and analysis
📦 mcp-api-documentation - Automatic API documentation generation
```

## 🔧 Configuration

### Global Settings
Configuration is stored in `~/.prologue/mcp.json`:

```json
{
  "servers": {},
  "globalSettings": {
    "defaultTransport": "stdio",
    "timeout": 30000,
    "retryAttempts": 3,
    "logLevel": "info",
    "securityMode": "balanced",
    "autoUpdate": true,
    "telemetryEnabled": false
  },
  "registrySettings": {
    "enabledRegistries": ["official", "github", "npm"],
    "syncInterval": 3600000,
    "autoSync": true,
    "cacheTimeout": 900000
  },
  "autoInstall": {
    "enabled": true,
    "confidenceThreshold": 0.8,
    "autoConfirm": false,
    "requireVerification": true,
    "allowedCategories": ["development", "productivity", "data-analysis"],
    "blockedServers": []
  }
}
```

### Project-Level Configuration
Create `.prologue/mcp.json` in your project root for project-specific settings:

```json
{
  "autoInstall": {
    "enabled": true,
    "allowedCategories": ["development", "testing", "documentation"]
  },
  "servers": {
    "mcp-custom-server": {
      "enabled": true,
      "configuration": {
        "API_KEY": "${CUSTOM_API_KEY}",
        "TIMEOUT": 5000
      }
    }
  }
}
```

## 🏗️ Architecture

### Core Components

1. **MCPRegistryScanner**
   - Discovers servers from multiple registries
   - Handles rate limiting and caching
   - Validates server metadata

2. **MCPInstaller**
   - Manages server installation
   - Handles multiple installation methods
   - Performs security checks

3. **MCPManager**
   - Orchestrates the entire system
   - Manages configuration and state
   - Provides the main API

### Registry Support

| Registry | Type | Features |
|----------|------|----------|
| **Official MCP Registry** | Official | Verified servers, full metadata |
| **GitHub** | Community | Wide variety, real-time updates |
| **NPM** | Community | Package-based servers, download stats |

### Installation Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **npm** | Install from npm registry | JavaScript/TypeScript servers |
| **npx** | Run without installation | Temporary usage, testing |
| **Docker** | Containerized deployment | Isolated environments |
| **Python** | pip-based installation | Python-based servers |
| **Binary** | Direct executable | System-wide tools |

## 🛡️ Security Features

### Verification System
- **Verified Servers**: Prioritizes servers from trusted sources
- **Author Verification**: Checks maintainer reputation
- **Community Signals**: Uses stars, downloads, and activity metrics

### Code Analysis
- **Pattern Detection**: Scans for suspicious code patterns
- **Dependency Analysis**: Checks for vulnerable dependencies
- **Permission Review**: Evaluates required permissions

### Installation Safety
- **Sandboxed Install**: Isolates from main project
- **Rollback Support**: Easy uninstallation
- **Configuration Validation**: Validates server configurations

## 📊 Usage Analytics

### Server Usage Tracking
```bash
# View usage statistics
prologue mcp --usage-stats

# Example output:
📊 Server Usage Statistics:
┌─────────────────────┬─────────────┬─────────────┬─────────────┐
│ Server              │ Usage Count │ Avg Time    │ Success Rate│
├─────────────────────┼─────────────┼─────────────┼─────────────┤
│ mcp-database-analyzer│ 25          │ 150ms       │ 96%         │
│ mcp-react-testing   │ 18          │ 89ms        │ 100%        │
│ mcp-api-docs        │ 12          │ 200ms       │ 92%         │
└─────────────────────┴─────────────┴─────────────┴─────────────┘
```

### Health Monitoring
- **Automatic Health Checks**: Monitors server status every 5 minutes
- **Performance Metrics**: Tracks response times and error rates
- **Alert System**: Notifies of server issues

## 🔌 Server Examples

### Popular MCP Servers

#### Database Tools
```bash
# Install database analysis server
prologue mcp --install "mcp-database-analyzer"

# Features:
- Schema analysis and optimization suggestions
- Query performance analysis
- Index recommendations
```

#### Development Tools
```bash
# Install React testing server
prologue mcp --install "mcp-react-testing"

# Features:
- Component testing automation
- Accessibility analysis
- Performance profiling
```

#### AI Assistants
```bash
# Install AI coding assistant
prologue mcp --install "mcp-ai-coder"

# Features:
- Code completion and suggestions
- Bug detection and fixes
- Refactoring recommendations
```

## 🧪 Testing

### Running Tests
```bash
# Run all MCP tests
npm test -- mcp

# Run specific test files
npm test mcp/__tests__/mcp-manager.test.ts
npm test mcp/__tests__/mcp-registry-scanner.test.ts

# Run with coverage
npm test -- --coverage mcp
```

### Test Coverage
- **Registry Scanner**: Discovery and search functionality
- **Installer**: Installation and configuration logic
- **Manager**: Overall orchestration and state management
- **CLI Integration**: Command-line interface and user interactions

## 🤝 Contributing

### Adding New Registries
1. Create a registry configuration in `MCPRegistryScanner`
2. Implement search and detail fetching
3. Add transformation logic for server data
4. Write tests for the new registry

### Adding Installation Methods
1. Extend `InstallationMethod` type in `types/mcp.ts`
2. Implement installation logic in `MCPInstaller`
3. Add system requirement checks
4. Write comprehensive tests

### Improving Auto-Detection
1. Enhance project analysis in `analyzeProject()`
2. Add new pattern recognition rules
3. Improve confidence scoring algorithm
4. Test with diverse project types

## 📚 API Reference

### MCPManager
```typescript
class MCPManager extends EventEmitter {
  // Search for servers
  async searchServers(request: MCPSearchRequest): Promise<MCPSearchResult[]>

  // Install a server
  async installServer(server: MCPServer, config?: any): Promise<MCPInstallationResult>

  // Auto-detect and install servers
  async detectAndInstall(projectContext?: any): Promise<MCPInstallationResult[]>

  // Get installed servers
  getInstalledServers(): MCPServerInstance[]

  // Check server health
  async performHealthCheck(serverId: string): Promise<MCPHealthCheck>
}
```

### Event System
```typescript
// Search events
manager.on('searchStarted', (data) => console.log('Searching...'));
manager.on('searchCompleted', (data) => console.log('Search complete'));

// Installation events
manager.on('installationStarted', (data) => console.log('Installing...'));
manager.on('installationCompleted', (data) => console.log('Installed!'));

// Health events
manager.on('serverUnhealthy', (data) => console.log('Server issue'));
```

## 🔮 Future Roadmap

### Upcoming Features
- **Visual Server Browser**: Web-based server discovery interface
- **Server Marketplace**: Community-driven server sharing
- **Advanced Analytics**: Detailed usage and performance insights
- **Team Collaboration**: Shared server configurations across teams
- **Custom Registry Support**: Add your own server registries
- **Server Templates**: Pre-configured server bundles for specific use cases

### Integration Plans
- **IDE Extensions**: VS Code, JetBrains, and other editor integrations
- **CI/CD Integration**: GitHub Actions, GitLab CI workflows
- **Cloud Platform Support**: AWS, Google Cloud, Azure deployments
- **Kubernetes Integration**: Container orchestration support

## 🆘 Troubleshooting

### Common Issues

#### Server Installation Fails
```bash
# Check system requirements
prologue mcp --health-check

# Check logs
cat ~/.prologue/mcp-servers/logs/install.log

# Retry with verbose output
prologue mcp --install server-name --verbose
```

#### Server Not Responding
```bash
# Check server status
prologue mcp --health-check

# Restart server
prologue mcp --restart server-name

# Check configuration
prologue mcp --config server-name
```

#### Search Returns No Results
```bash
# Check registry connectivity
prologue mcp --sync-registries

# Clear cache and retry
prologue mcp --clear-cache
prologue mcp --search "query"
```

### Getting Help
- **Documentation**: [Full documentation](https://logue.pro/docs/mcp)
- **Community**: [Discord server](https://discord.gg/prologue)
- **Issues**: [GitHub issues](https://github.com/aegntic/prologue/issues)
- **Email**: support@logue.pro

---

## 📄 License

This MCP integration is part of Prologue and is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**🎭 Begin Your Story with Prologue + MCP**

The integration of MCP auto-detection and installation into Prologue represents a significant step toward truly intelligent development environments. By automatically discovering and installing the right tools for your project, Prologue helps you focus on what matters most: building amazing things.

*We don't just manage servers. We create intelligent development ecosystems that learn and adapt to your needs.*