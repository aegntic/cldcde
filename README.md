# MEMre.quest - Advanced LLM Memory & Context Window Management

![MEMre.quest Banner](https://img.shields.io/badge/MEMre.quest-Advanced%20LLM%20Memory-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**MEMre.quest** is an advanced LLM memory and context window management system with intelligent 80% auto-save/clear functionality. It provides seamless conversation persistence and memory updates across multiple AI services.

## 🎯 Key Features

- **🧠 80% Context Window Monitoring** - Automatically monitors token usage in real-time
- **💾 Auto-Save Conversations** - Saves conversations when reaching 80% context capacity  
- **🔄 Intelligent Context Clearing** - Clears memory while preserving critical conversation data
- **📝 Memory Updates** - Persistent conversation memory across sessions
- **🤖 Multi-AI Support** - Works with ChatGPT, Claude, Grok, Gemini, and more
- **🔍 Advanced Search** - Search and retrieve conversations across all AI services
- **⚡ Background Operation** - Runs as a daemon for continuous monitoring
- **🛡️ Data Safety** - Creates snapshots before clearing context

## 🚀 Quick Start

### Installation

```bash
# Download and install
git clone https://github.com/aegntic/cldcde.git
cd cldcde/memre/download
npm install
chmod +x bin/memre-quest

# Add to PATH (optional)
export PATH="$PWD/bin:$PATH"
```

### Basic Usage

```bash
# Start automatic 80% monitoring
memre-quest start

# Check current memory usage
memre-quest status

# Force context rotation with save
memre-quest rotate

# View activity logs
memre-quest logs

# Stop monitoring
memre-quest stop
```

## 📊 How It Works

MEMre.quest continuously monitors your LLM conversations and automatically:

1. **Tracks Token Usage** - Estimates context window usage in real-time
2. **80% Threshold Alert** - Triggers auto-save when reaching 80% capacity
3. **Smart Conversation Save** - Preserves critical conversation context
4. **Intelligent Pruning** - Removes old/temporary data while keeping important memories
5. **Seamless Rotation** - Clears context window and restores essential data
6. **Continuous Operation** - Runs in background for uninterrupted protection

## 🎨 Visual Interface

```
  ███╗   ███╗███████╗███╗   ███╗██████╗ ███████╗   ██████╗ ██╗   ██╗███████╗███████╗████████╗
  ████╗ ████║██╔════╝████╗ ████║██╔══██╗██╔════╝   ██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝  
  ██╔████╔██║█████╗  ██╔████╔██║██████╔╝█████╗     ██║   ██║██║   ██║█████╗  ███████╗   ██║
  ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝     ██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║
  ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║██║  ██║███████╗██╗╚██████╔╝╚██████╔╝███████╗███████║   ██║
  ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝

🧠 Advanced LLM Memory & Context Window Management
📊 80% Context Auto-Save/Clear • 🔄 Conversation Persistence • 💾 Memory Updates
```

## 🔧 Commands Reference

| Command | Description |
|---------|-------------|
| `memre-quest start` | 🚀 Start automatic 80% context monitoring |
| `memre-quest stop` | 🛑 Stop the memory management daemon |
| `memre-quest status` | 📊 Show context usage and memory statistics |
| `memre-quest rotate` | 🔄 Force context window rotation with save |
| `memre-quest prune` | 🧹 Clean old memory while preserving critical data |
| `memre-quest logs` | 📋 View memory management activity logs |
| `memre-quest --help` | ❓ Show detailed help and usage information |
| `memre-quest --version` | 📋 Display version and feature information |

## 📈 Status Display

```bash
$ memre-quest status

═══════════════════════════════════════════════
   Claude Context Manager Status
═══════════════════════════════════════════════
Daemon: ● Running (PID: 12345)

Context Usage:
[████████████████████████░░░░░░] 78% (156,000 tokens)

Statistics:
  • Rotations performed: 3
  • Threshold: 80%
  • Critical: 90%

Recent Snapshots:
  • snapshot-20250814-102930
  • snapshot-20250814-101245
  • snapshot-20250814-095612
═══════════════════════════════════════════════
```

## 🔒 Data Safety & Privacy

- **Local Storage Only** - All data stored locally, never sent to external servers
- **Encrypted Snapshots** - Context snapshots are securely stored
- **Backup Protection** - Automatic backups before any data clearing
- **Recovery Options** - Full conversation recovery from snapshots
- **Permission Control** - Runs with user permissions only

## 🛠️ Configuration

MEMre.quest can be configured by editing the source or using environment variables:

```bash
# Custom threshold (default: 80%)
export MEMRE_THRESHOLD=75

# Custom check interval (default: 30 seconds)  
export MEMRE_CHECK_INTERVAL=60

# Custom max tokens (default: 180,000)
export MEMRE_MAX_TOKENS=200000
```

## 🔗 Integration

MEMre.quest integrates seamlessly with:

- **Claude Code CLI** - Enhanced context management for Claude sessions
- **AI Dev Suite** - Part of the comprehensive AI development toolkit
- **Multiple AI Services** - ChatGPT, Claude, Grok, Gemini support
- **CLDCDE Ecosystem** - Full integration with cldcde.cc platform

## 📦 What's Included

```
memre-quest/
├── bin/
│   └── memre-quest          # Main executable
├── package.json             # Package configuration
├── README.md               # This documentation
└── LICENSE                 # MIT License
```

## 🌐 Links

- **Homepage**: [cldcde.cc](https://cldcde.cc)
- **Repository**: [github.com/aegntic/cldcde](https://github.com/aegntic/cldcde)
- **Download**: [github.com/aegntic/cldcde/memre/download](https://github.com/aegntic/cldcde/tree/main/memre/download)
- **Issues**: [Report bugs and feature requests](https://github.com/aegntic/cldcde/issues)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests, report bugs, or suggest new features.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the AEGNTIC team**

*Experience the future of LLM memory management with MEMre.quest*