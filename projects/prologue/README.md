# 🚀 Prologue - The Brilliant MCP Auto Setup System

> **Begin Your AI Journey** - The Universal Model Context Protocol Auto-Discovery & Installation Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website: logue.pro](https://img.shields.io/badge/Website-logue.pro-blue.svg)](https://logue.pro)
[![Email: Contact](https://img.shields.io/badge/Email-mcp%40logue.pro-green.svg)](mailto:mcp@logue.pro)
[![Platforms: 10+ AI](https://img.shields.io/badge/Platforms-10%2B%20AI-purple.svg)](docs/platform-compatibility.md)

---

## 🎯 **Transform Your AI Development Workflow**

Prologue is the **world's most advanced MCP (Model Context Protocol) auto-discovery and installation system** that seamlessly works across all major AI platforms. Built during D3MO development, Prologue intelligently discovers, curates, and manages MCP servers to supercharge your AI development workflow.

### 🚀 **Why Prologue?**

- **🧠 Smart Auto-Discovery**: Intelligently selects MCP servers based on your use case
- **⚡ One-Command Installation**: Install top-quality servers instantly
- **🌐 Universal Platform Support**: Works with Claude Code, Auggie, Gemini, Codex, and more
- **📊 Real-Time Health Monitoring**: Track server performance and uptime
- **🔗 Workflow Optimization**: Create optimized server chains and workflows
- **✨ Quality Gated**: Curated 33+ servers across 17 functional categories

---

## 🌟 **Platform Compatibility**

### ✅ **Fully Supported Platforms**
| Platform | Command Prefix | Rich UI | Interactive | Background | Status |
|----------|----------------|---------|-------------|-------------|---------|
| **Claude Code** | `/prologue` | ✅ | ✅ | ✅ | 🎯 Primary |
| **OpenCode** | `/prologue` | ✅ | ✅ | ✅ | ✅ Full |
| **Cursor** | `/prologue` | ⚠️ | ✅ | ⚠️ | ✅ Compatible |
| **Continue** | `/prologue` | ❌ | ⚠️ | ⚠️ | ✅ Compatible |

### 🔧 **AI Platform Support**
| Platform | Command Prefix | Features |
|----------|----------------|----------|
| **Auggie AI** | `!prologue` | Plain text + Limited interaction |
| **Gemini AI** | `/prologue` | Command-line + Auto-discovery |
| **OpenAI Codex** | `/prologue` | Interactive + Server management |
| **TunaCode** | `@prologue` | Quick install + Status checks |
| **GitHub Copilot** | `/prologue` | Integration + Basic formatting |

---

## 🚀 **Quick Start**

### **Installation**

```bash
# Clone Prologue
git clone https://logue.pro/prologue.git
cd prologue/cli

# Install dependencies and setup
python3 prologue_universal.py --install-deps

# Create global command
ln -sf $(pwd)/prologue_universal.py ~/.local/bin/prologue
```

### **Claude Code Setup**

```bash
# Install slash command
cp commands/prologue.md ~/.claude/commands/
```

### **Basic Usage**

```bash
# Launch interactive menu
prologue

# Quick install top servers
prologue install

# Smart auto-discovery
prologue smart

# Check installation status
prologue status

# Start health monitoring
prologue monitor
```

---

## 📋 **Interactive Menu Features**

### 🎯 **Core Functions**
1. **🚀 Launch TUI** - Full interactive terminal interface
2. **⚡ Quick Install** - Auto-install top 8 quality servers
3. **🧠 Smart Discovery** - Intelligent server selection based on use case
4. **🔥 Power User Setup** - Install all high-agentic potential servers
5. **📂 Category Install** - Browse and install by functional category

### 🔧 **Advanced Features**
6. **🔗 Workflow Builder** - Create optimized server chains and workflows
7. **💊 Health Monitor** - Real-time server performance monitoring
8. **📊 Installation Status** - View current installation statistics
9. **📚 Browse All Servers** - Explore the complete MCP database
10. **⚙️ Configuration Manager** - Manage MCP settings and preferences
11. **📈 Installation Reports** - Generate detailed installation analytics
12. **ℹ️ System Information** - Show version and database info

---

## 🏗️ **Architecture**

### **📁 Project Structure**
```
prologue/
├── cli/                          # Command-line interface
│   ├── prologue_universal.py     # Universal platform wrapper
│   ├── mcp-unified-interface.py  # Main interactive interface
│   ├── mcp-tui-manager.py        # Terminal UI manager
│   ├── platform_adapter.py       # Multi-platform compatibility
│   ├── comprehensive-mcp-database.py # Server database
│   └── platform_commands.md      # Platform-specific commands
├── src/                          # Web frontend (logue.pro)
├── dist/                         # Built web assets
├── docs/                         # Documentation
└── package.json                  # Web project config
```

### **🔧 Technical Components**
- **Platform Adapter**: Auto-detects AI platform and adapts interface
- **Universal Wrapper**: Single entry point for all platforms
- **Quality Scoring Algorithm**: `agentic_potential * 0.4 + stars/1000 * 0.3 + quality * 0.2 + category_relevance * 0.1`
- **Real-time Monitoring**: Threading-based server health tracking
- **Workflow Optimization**: Dependency analysis and chain completion scoring

---

## 📊 **MCP Server Database**

### **📈 Server Categories (17 Total)**
- **Development Tools**: Code completion, debugging, testing
- **Data Processing**: ETL, analytics, visualization
- **Communication**: Email, messaging, notifications
- **File Management**: Storage, synchronization, conversion
- **Web Development**: APIs, frameworks, deployment
- **Security**: Authentication, encryption, monitoring
- **AI/ML**: Model training, inference, data preprocessing
- **Productivity**: Task management, automation, scheduling
- **Creative**: Content generation, design, media processing
- **System Administration**: Infrastructure, monitoring, automation
- **Database**: Query optimization, migrations, replication
- **DevOps**: CI/CD, containerization, orchestration
- **Business Intelligence**: Reporting, dashboards, analytics
- **Documentation**: Generation, maintenance, search
- **Testing**: Unit, integration, E2E testing
- **Project Management**: Planning, tracking, collaboration
- **Research**: Academic papers, data analysis, literature review

### **🌟 Quality Metrics**
- **Agentic Potential**: AI agent capability score (0-1)
- **GitHub Stars**: Community validation
- **Quality Score**: Code quality and maintenance
- **Category Relevance**: Domain-specific importance

---

## 🛠️ **Development**

### **🔧 Requirements**
- Python 3.8+
- Rich library (auto-installed)
- MCP-compatible AI platform

### **🚀 Local Development**
```bash
# Clone repository
git clone https://logue.pro/prologue.git
cd prologue

# Install CLI dependencies
cd cli
python3 -m pip install --user rich psutil

# Run development mode
python3 prologue_universal.py --platform

# Test with different platforms
export FORCE_PLATFORM=auggie
python3 prologue_universal.py
```

### **🧪 Testing**
```bash
# Test platform detection
python3 prologue_universal.py --compatibility

# Test installation
python3 prologue_universal.py install

# Test monitoring (background)
python3 prologue_universal.py monitor &
```

### **📝 Code Style**
- PEP 8 compliant
- Type hints throughout
- Comprehensive documentation
- 100% test coverage goal

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **🚀 Quick Contributing Steps**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **📋 Contribution Areas**
- 🆕 New MCP server integrations
- 🔧 Platform compatibility improvements
- 📊 Enhanced analytics and reporting
- 🎨 UI/UX improvements
- 📚 Documentation enhancements
- 🧪 Test coverage expansion

---

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **D3MO Development Team** - Original concept and development
- **ae.ltd** - Powering the technology
- **MCP Community** - Server contributions and feedback
- **AI Platform Developers** - Compatibility support

---

## 📞 **Contact & Support**

- **📧 Email**: [mcp@logue.pro](mailto:mcp@logue.pro)
- **🌐 Website**: [logue.pro](https://logue.pro)
- **📖 Documentation**: [docs.logue.pro](https://docs.logue.pro)
- **🐛 Issues**: [GitHub Issues](https://github.com/prologue/mcp-manager/issues)

---

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=prologue/mcp-manager&type=Date)](https://star-history.com/#prologue/mcp-manager&Date)

---

<div align="center">

**Built with ❤️ by ae.ltd • Not built with demo**

*Begin Your AI Journey with Prologue*

</div>