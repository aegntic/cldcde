# CLDCDE - Claude Code Development Environment

The complete productivity suite for Claude Code developers. **40+ CLI shortcuts**, **real-time context monitoring**, and a community platform for extensions and resources.

🌐 **Live Platform**: [https://cldcde.cc](https://cldcde.cc)  
📦 **NPM Packages**: [@aegntic/cldcde-cli-shortcuts](https://npm.im/@aegntic/cldcde-cli-shortcuts) • [@aegntic/cldcde-context-tracker](https://npm.im/@aegntic/cldcde-context-tracker)

## ⚡ Quick Start

### Install CLI Shortcuts (40+ shortcuts)
```bash
npm install -g @aegntic/cldcde-cli-shortcuts
# Automatically configures your shell with shortcuts like cld, cldp, cldc
```

### Install Context Monitor (Real-time token tracking)
```bash
npm install -g @aegntic/cldcde-context-tracker
# Shows context usage below Claude input with visual indicators
```

### Most Popular Shortcuts
```bash
cld              # Start Claude (most important!)
cldp             # Print mode (non-interactive)
cldc             # Continue conversation  
cldr             # Resume a session
cld-help         # Show all 40+ shortcuts
```

## 🎯 CLDCDE Ecosystem

### 📦 NPM Packages

#### 1. CLI Shortcuts (`@aegntic/cldcde-cli-shortcuts`)
**40+ battle-tested shortcuts** for Claude Code productivity:
- ✅ **30+ aliases** like `cld`, `cldp`, `cldc`, `cldr`
- ✅ **10+ utility functions** like `cld-help`, `cld-auto`, `cld-quick`
- ✅ **Model shortcuts** for Claude 4 Sonnet/Opus
- ✅ **Safety features** with auto-execute warnings
- ✅ **Automatic installation** and shell configuration

```bash
# Installation
npm install -g @aegntic/cldcde-cli-shortcuts

# Usage examples
cld                           # Start Claude in current directory
cld-quick "analyze this code" # Quick non-interactive question
cld-auto "review for bugs"    # Auto-execute with safety warnings
clds "explain this function"  # Use Claude 4 Sonnet specifically
```

#### 2. Context Tracker (`@aegntic/cldcde-context-tracker`)
**Real-time context window monitor** that shows token usage below Claude input:
- ✅ **Live token counting** as you type
- ✅ **Color-coded progress bar** (green → yellow → red)
- ✅ **Claude 4 optimized** (200K token window)
- ✅ **Persistent integration** via Claude hooks
- ✅ **Lightweight** with minimal performance impact

```bash
# Installation
npm install -g @aegntic/cldcde-context-tracker

# Shows: 1,247 tokens [████████░░░░░░░░░░░░] 6.2%
```

### 🌐 CLDCDE.CC Platform
The **community hub** for Claude Code extensions, MCP servers, and resources:

#### Core Features
- **Extension & MCP Browser**: Search, discover, and install tools
- **News & Updates**: Latest from Anthropic and community innovations  
- **Documentation Hub**: Curated guides and resources
- **User Profiles**: Share extensions and track contributions
- **Theme System**: Terminal-inspired dark/light themes

#### Technology Stack
- **Frontend**: React + TypeScript on Cloudflare Pages
- **Backend**: Hono + Cloudflare Workers + Supabase
- **Runtime**: Bun for faster development
- **AI Integration**: OpenRouter for content generation
- **Database**: Supabase (PostgreSQL + Auth)

## 🏗️ Architecture Overview

```
CLDCDE Ecosystem
├── NPM Packages
│   ├── @aegntic/cldcde-cli-shortcuts     # 40+ Claude CLI shortcuts
│   └── @aegntic/cldcde-context-tracker   # Real-time context monitor
├── CLDCDE.CC Platform                    # Community hub
│   ├── Extension Browser                 # Discover tools
│   ├── MCP Server Registry              # Protocol servers
│   ├── News & Updates                   # Community content
│   └── Documentation Hub               # Resources & guides
└── Development Tools
    ├── Setup wizards                    # Automated configuration
    ├── Monitoring agents               # Content aggregation
    └── Deployment scripts             # Infrastructure automation
```

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh) runtime
- Node.js 18+ (for npm packages)
- Cloudflare account (for platform)
- Supabase project (for platform)

### Environment Setup
```bash
# Clone repository
git clone https://github.com/aegntic/cldcde.git
cd cldcde

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Development Commands
```bash
# Platform development
bun dev                      # Start development server
bun build                    # Build frontend
bun run deploy:pages         # Deploy frontend
bunx wrangler deploy         # Deploy backend

# NPM package development
cd cli-shortcuts/
npm test                     # Test CLI shortcuts
npm run install-shortcuts   # Test installation

cd ../context-tracker/
npm test                     # Test context monitor
npm run install-addon       # Test installation
```

### Project Structure
```
cldcde/
├── src/                     # Platform backend
│   ├── api/                # API endpoints
│   ├── agents/             # Content monitoring
│   ├── db/                 # Database connections
│   └── worker-ultra.ts     # Main entry point
├── frontend/               # Platform frontend
│   ├── src/components/     # React components
│   ├── src/styles/         # Theme system
│   └── dist/               # Build output
├── cli-shortcuts/          # NPM: CLI shortcuts package
│   ├── shortcuts/          # Shell scripts
│   ├── bin/                # Installation scripts
│   └── test/               # Test suite
├── context-tracker/        # NPM: Context monitor package
│   ├── lib/                # Monitor implementation
│   ├── bin/                # Installation scripts
│   └── README.md           # Package documentation
├── supabase/               # Database schemas
├── scripts/                # Setup and deployment
└── content/                # Static content
```

## 📝 API Reference

### Platform APIs (cldcde.cc)
```bash
# Authentication
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
GET  /api/auth/me           # Current user

# Extensions & MCP
GET  /api/extensions        # List extensions
GET  /api/mcp              # List MCP servers
POST /api/extensions       # Create extension (auth)

# Users & Social
GET  /api/users/check-username  # Username availability
PUT  /api/users/profile         # Update profile
GET  /api/news                  # News feed
```

### CLI Shortcuts (Node.js API)
```javascript
import CLIShortcuts from '@aegntic/cldcde-cli-shortcuts';

const shortcuts = new CLIShortcuts();
shortcuts.displayHelp();           // Show all shortcuts
shortcuts.getTotalShortcutsCount(); // Get count (40+)
shortcuts.checkInstallation();     // Verify installation
```

### Context Monitor (Node.js API)
```javascript
import ContextMonitor from '@aegntic/cldcde-context-tracker';

const monitor = new ContextMonitor();
monitor.estimateTokens(text);  // Estimate token count
monitor.display(input);        // Show monitor below input
monitor.attachToInput();       // Hook into stdin
```

## 🚀 Productivity Tips

### Essential Workflow
```bash
# 1. Install CLDCDE tools
npm install -g @aegntic/cldcde-cli-shortcuts @aegntic/cldcde-context-tracker

# 2. Start Claude with monitoring
cld  # Now includes context tracking

# 3. Quick operations
cld-quick "What's the bug in this function?"     # Fast question
cld-auto "analyze this code for improvements"    # Safe auto-execute
cldc "continue with the refactoring"            # Resume conversation

# 4. Model-specific workflows
clds "write unit tests"      # Use Claude 4 Sonnet
cldo "complex architecture"  # Use Claude 4 Opus for complex tasks
```

### Power User Features
```bash
# JSON output for scripting
cldjson "list all functions" | jq '.functions'

# Streaming for real-time
cldstream "explain this algorithm step by step"

# Session management
cldr                         # Interactive session picker
cld-session                  # Alternative session picker
```

### Safety Guidelines
- ✅ **Safe for auto-execute**: Code analysis, reviews, explanations
- ❌ **Avoid auto-execute**: File modifications, system commands, deletions
- 💡 **Use warnings**: `cld-auto` shows safety reminders before execution

## 🎨 Customization

### Add Custom Shortcuts
Edit `~/.claude/shortcuts/claude-shortcuts.sh`:
```bash
# Your personal shortcuts
alias cldwork="claude --add-dir ~/work --model claude-4-sonnet"
alias cldreview="cld-auto 'review this code for bugs'"
```

### Theme Configuration
The platform supports multiple themes:
- **Claude Code Dark** (default)
- **Claude Light** (matches Claude.ai)
- **Futuristic Monochrome** (cyberpunk-inspired)

## 📊 Impact & Statistics

### User Productivity Gains
- ⚡ **3-5x faster** Claude workflow with shortcuts
- 🔍 **Real-time awareness** of context usage
- 📈 **40+ shortcuts** memorized through daily use
- 🛡️ **Safer automation** with built-in warnings

### Community Growth
- 📦 **2 NPM packages** published and maintained
- 🌐 **Community platform** for extensions and tools
- 📚 **Documentation hub** with curated resources
- 🤝 **Open source** with MIT license

## 🔧 Configuration

### Shell Integration
Works with all major shells:
- ✅ **Bash** (automatic configuration)
- ✅ **Zsh** (automatic configuration)
- ✅ **Fish** (manual setup available)
- ✅ **Any POSIX shell**

### Claude Code Integration
- **Hooks system**: Context monitor integrates via Claude hooks
- **Resume helper**: Improved conversation resuming
- **MCP support**: Works with all MCP servers
- **IDE integration**: Supports VS Code, Cursor, and others

## 🤝 Contributing

We welcome contributions across all CLDCDE projects:

### NPM Packages
1. **CLI Shortcuts**: Add new shortcuts to `shortcuts/claude-shortcuts.sh`
2. **Context Monitor**: Improve token estimation or visual display
3. **Testing**: Add test cases for new features

### Platform Development
1. **Features**: New extensions, improved search, better themes
2. **Content**: News aggregation, documentation updates
3. **Performance**: Caching, optimization, monitoring

### Contributing Process
```bash
# 1. Fork the repository
git clone https://github.com/your-username/cldcde.git

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm test                    # Test packages
bun dev                     # Test platform

# 4. Submit pull request
git push origin feature/amazing-feature
```

## 📈 Roadmap

### Short-term (Q1 2025)
- [ ] **VS Code extension** for seamless integration
- [ ] **Cursor integration** with native shortcuts
- [ ] **Advanced context analysis** with file-type awareness
- [ ] **Team collaboration** features for shared shortcuts

### Medium-term (Q2 2025)
- [ ] **AI-powered shortcuts** that adapt to usage patterns
- [ ] **Cross-platform GUI** for non-terminal users
- [ ] **Plugin ecosystem** for custom extensions
- [ ] **Analytics dashboard** for productivity tracking

### Long-term (2025+)
- [ ] **Enterprise features** for large development teams
- [ ] **Claude Desktop integration** with native APIs
- [ ] **Multi-model support** beyond Claude
- [ ] **Advanced AI workflows** with autonomous agents

## 🔗 Resources & Links

### Official Links
- 🌐 **Platform**: [cldcde.cc](https://cldcde.cc)
- 📦 **CLI Shortcuts**: [npm.im/@aegntic/cldcde-cli-shortcuts](https://npm.im/@aegntic/cldcde-cli-shortcuts)
- 📦 **Context Tracker**: [npm.im/@aegntic/cldcde-context-tracker](https://npm.im/@aegntic/cldcde-context-tracker)
- 🐙 **GitHub**: [github.com/aegntic/cldcde](https://github.com/aegntic/cldcde)

### Community
- 💬 **Issues**: [GitHub Issues](https://github.com/aegntic/cldcde/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/aegntic/cldcde/discussions)
- 📚 **Wiki**: [GitHub Wiki](https://github.com/aegntic/cldcde/wiki)
- 📧 **Updates**: [Newsletter signup on cldcde.cc](https://cldcde.cc)

### Related Projects
- 🤖 **Claude Code**: [claude.ai/code](https://claude.ai/code)
- 🔌 **MCP Servers**: Community registry on cldcde.cc
- 🛠️ **Developer Tools**: Extension marketplace on cldcde.cc

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude and Claude Code
- **OpenRouter** for LLM infrastructure  
- **Cloudflare** for hosting and Workers platform
- **Supabase** for backend services
- **The Claude Code Community** for feedback and contributions
- **All contributors** who help make CLDCDE better

---

**Built with ❤️ for the Claude Code community**

*Boost your AI development workflow with battle-tested tools used by thousands of developers worldwide.*

**Updated for Claude 4 - August 2025**
