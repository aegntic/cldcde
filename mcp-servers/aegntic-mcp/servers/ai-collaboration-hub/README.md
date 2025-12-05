# AI Collaboration Hub

**Supervised bidirectional AI communication between Claude Code and Gemini using OpenRouter's free tier**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![MCP](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-integrated-orange.svg)](https://openrouter.ai)
[![License: Dual](https://img.shields.io/badge/License-Dual%20License-blue.svg)](LICENSE)

## ✨ Features

- 🤝 **Bidirectional AI Communication** - Claude Code ↔ Gemini collaboration
- 👀 **User Approval Gates** - Control every AI exchange with explicit approval
- 🧠 **1M Token Context Window** - Leverage Gemini's massive context capability
- 🆓 **Free via OpenRouter** - Uses OpenRouter's free credits ($5 for new users)
- 📝 **Complete Conversation Logging** - Full transcript with timestamps
- ⚡ **Fast Setup with uv** - Modern Python package management
- 🔒 **Session Management** - Configurable limits and safety controls
- 🎯 **Context-Rich Analysis** - Send entire codebases for comprehensive review

## 🚀 Quick Start

```bash
# 1. Install with uv (fastest)
git clone https://github.com/aegntic/MCP.git
cd MCP/ai-collaboration-hub
uv sync

# 2. Get free OpenRouter API key
# Visit: https://openrouter.ai (get $5 free credits)
export OPENROUTER_API_KEY=your_key_here

# 3. Test installation
uv run python -m ai_collaboration_hub.server
```

**Claude Code Integration:**
```json
{
  "mcpServers": {
    "ai-collaboration-hub": {
      "command": "uv",
      "args": ["run", "python", "-m", "ai_collaboration_hub.server"],
      "cwd": "/path/to/MCP/ai-collaboration-hub",
      "env": {
        "OPENROUTER_API_KEY": "your_key_here"
      }
    }
  }
}
```

## 🛠️ Usage

### Basic Workflow
```python
# 1. Start collaboration session
session_id = start_collaboration({
    "max_exchanges": 20,
    "require_approval": True
})

# 2. Send message to Gemini with context
response = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Analyze this React app for performance issues",
    "context": "[entire codebase context...]"
})

# 3. View conversation history
conversation = view_conversation({"session_id": session_id})

# 4. End session
end_collaboration({"session_id": session_id})
```

### Real-World Example
```python
# Code review with 1M token context
session_id = start_collaboration({"max_exchanges": 15})

review = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Review this entire React application for security, performance, and maintainability issues. Provide specific recommendations with code examples.",
    "context": """
    Full project structure with all files:
    - src/ directory with 45 components
    - package.json with 156 dependencies  
    - API services and utilities
    - Test suites and configurations
    - [Include complete file contents...]
    """
})
# Gemini analyzes the ENTIRE codebase and provides comprehensive feedback
```

## 🏗️ Architecture

```
Claude Code → MCP Server → OpenRouter → Gemini (1M context)
     ↑                                      ↓
     ← User Approval Gate ← Response ←------
```

**User Oversight:** Every exchange requires your explicit approval, ensuring complete control over AI-to-AI collaboration.

## 📚 Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- **[Tools Reference](docs/TOOLS.md)** - Complete tool documentation  
- **[Prompts & Use Cases](docs/PROMPTS.md)** - Effective collaboration patterns
- **[Resources & Configuration](docs/RESOURCES.md)** - Advanced configuration options
- **[Examples](docs/EXAMPLES.md)** - Real-world usage examples

## 🔧 Tools Available

| Tool | Description | Key Features |
|------|-------------|--------------|
| `start_collaboration` | Create new AI session | Configurable limits, approval settings |
| `collaborate_with_gemini` | Send message to Gemini | 1M token context, user approval gates |
| `view_conversation` | View session history | Complete logs with timestamps |
| `end_collaboration` | End active session | Clean session termination |

## 💡 Use Cases

### Code Analysis & Review
- **Performance Optimization:** Analyze entire applications for bottlenecks
- **Security Audits:** Comprehensive security review with context
- **Architecture Planning:** Design scalable systems collaboratively
- **Technical Debt Assessment:** Identify and prioritize improvements

### AI Pair Programming  
- **Feature Development:** Collaborative implementation planning
- **Debugging:** Multi-perspective problem solving
- **Refactoring:** Safe code modernization strategies
- **Testing:** Comprehensive test suite generation

### Knowledge Transfer
- **Code Documentation:** Generate comprehensive documentation
- **Onboarding:** Explain complex systems to new team members  
- **Best Practices:** Learn domain-specific patterns
- **Troubleshooting:** Step-by-step problem resolution

## 🆓 Cost-Free Operation

**OpenRouter Free Tier:**
- $5 free credits for new users
- No monthly subscription required
- Pay-per-use after credits (very low cost)
- Access to multiple AI models

**Cost Optimization:**
- Session limits prevent runaway costs
- User approval gates control usage
- Efficient context management
- Multiple model options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is dual-licensed:
- **Free for non-commercial use** (personal, educational, research)
- **Commercial license required** for business use (contact authors)

**Authors:**
- Mattae Cooper <human@mattaecooper.org>
- '{ae}'aegntic.ai <contact@aegntic.ai>

See the [LICENSE](LICENSE) file for complete terms.

## 🔗 Links

- **Repository:** https://github.com/aegntic/MCP
- **OpenRouter:** https://openrouter.ai
- **Model Context Protocol:** https://modelcontextprotocol.io
- **Issue Tracker:** https://github.com/aegntic/MCP/issues

## ⭐ Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📖 Improving documentation
- 🤝 Contributing code

---

**Created by Mattae Cooper & '{ae}'aegntic.ai** • **Built for the AI development community** • **Powered by OpenRouter & MCP** • **Made with ❤️**