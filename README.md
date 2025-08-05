# CLDCDE Context Tracker

A tiny, persistent context window monitor that lives just below the text input in Claude Code CLI. Shows real-time token usage with color-coded visual indicators.

## Features

- 🔢 **Real-time token counting** - Estimates tokens as you type
- 📊 **Visual progress bar** - Color-coded usage indicator (green → yellow → red)
- ⚡ **Lightweight** - Minimal performance impact
- 🔄 **Persistent** - One-time install, always available
- 🎨 **Elegant** - Clean, unobtrusive display below input

## Preview

```
Your input appears here...
1,247 tokens [████████░░░░░░░░░░░░] 6.2%
```

## Installation

### Install via npm

```bash
npm install -g @aegntic/cldcde-context-tracker
cldcde-context-tracker
```

### Install from GitHub

```bash
git clone -b context-win https://github.com/aegntic/cldcde.git
cd cldcde
npm install
npm run install-addon
```

### Manual Installation

1. Clone this repository
2. Run the installation script:
   ```bash
   node bin/install.js
   ```
3. Add the alias to your shell (will be prompted):
   ```bash
   echo "alias claude-monitor='node ~/.claude/addons/claude-with-monitor.js'" >> ~/.bashrc
   source ~/.bashrc
   ```

## Usage

### With Context Tracker
```bash
claude-monitor  # Start Claude with context tracker enabled
```

### Without Context Tracker
```bash
claude  # Regular Claude Code CLI (tracker disabled)
```

## Features

### Token Estimation
- Accurate estimation based on character count, word patterns, and content type
- Accounts for code blocks and markdown formatting
- Updates in real-time as you type

### Visual Indicators
- **Green (0-25%)**: `1,247 tokens [████░░░░░░░░░░░░░░░░] 6.2%`
- **Yellow (25-50%)**: `52,441 tokens [██████████░░░░░░░░░░] 26.2%`
- **Orange (50-75%)**: `101,892 tokens [███████████████░░░░░] 50.9%`
- **Red (75-90%)**: `157,223 tokens [██████████████████░░] 78.6%`
- **Critical (90%+)**: `183,455 tokens [███████████████████░] 91.7% ⚠️`

### Smart Monitoring
- Only displays when typing or editing
- Clears when not in use
- Toggleable (Ctrl+M to hide/show)
- No interference with Claude's normal operation

## Configuration

The monitor is configured through `~/.claude/hooks.json`:

```json
{
  "preCommand": [
    {
      "name": "context-monitor",
      "script": "~/.claude/addons/context-monitor.js",
      "enabled": true,
      "description": "Display context window usage monitor"
    }
  ]
}
```

## Token Limits

- **Claude 3.5 Sonnet**: 200,000 tokens (~150,000 words)
- **Claude 3 Opus**: 200,000 tokens
- **Claude 3 Haiku**: 200,000 tokens

## Troubleshooting

### Monitor not appearing
```bash
# Check if Claude hooks are enabled
ls ~/.claude/hooks.json

# Verify addon files exist
ls ~/.claude/addons/

# Reinstall if needed
npm run install-addon
```

### Token count seems off
The monitor uses estimation based on:
- ~3.5 characters per token average
- Code blocks (+10 tokens each)
- Markdown formatting (+0.5 tokens per symbol)

For exact counts, the final submission to Claude will show precise usage.

### Shell alias not working
```bash
# Add to your shell config
echo 'alias claude-monitor="node ~/.claude/addons/claude-with-monitor.js"' >> ~/.bashrc
source ~/.bashrc

# Or for Zsh
echo 'alias claude-monitor="node ~/.claude/addons/claude-with-monitor.js"' >> ~/.zshrc
source ~/.zshrc
```

## Uninstallation

```bash
npm run uninstall-addon
# or
node bin/uninstall.js
```

Then remove the alias from your shell configuration:
```bash
# Edit ~/.bashrc or ~/.zshrc and remove the claude-monitor alias line
```

## How It Works

1. **Installation**: Copies monitor script to `~/.claude/addons/`
2. **Hooks**: Registers with Claude's hook system
3. **Wrapper**: Creates a wrapper script that intercepts input
4. **Monitoring**: Attaches to stdin stream to count tokens in real-time
5. **Display**: Shows compact monitor below input area

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Real-time token counting
- Color-coded progress bar
- One-time installation
- Shell alias integration

---

**Made with ❤️ for the Claude Code community**