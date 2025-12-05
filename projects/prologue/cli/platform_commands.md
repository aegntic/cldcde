# Prologue Platform Command Guide

## Universal Compatibility

Prologue CLI is designed to work seamlessly across multiple AI platforms:

### Primary Platforms

#### Claude Code
```
/prologue                # Launch interactive menu
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### Auggie AI
```
!prologue               # Launch interactive menu
!prologue install       # Quick install top servers
!prologue smart         # Smart auto-discovery
!prologue monitor       # Start health monitoring
!prologue status        # Check installation status
```

#### Gemini AI
```
/prologue                # Launch interactive menu
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### OpenAI Codex
```
/prologue                # Launch interactive menu
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### TunaCode
```
@prologue               # Launch interactive menu
@prologue install       # Quick install top servers
@prologue smart         # Smart auto-discovery
@prologue monitor       # Start health monitoring
@prologue status        # Check installation status
```

### Additional Platforms

#### OpenCode
```
/prologue                # Full Rich terminal interface
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### Cursor
```
/prologue                # Standard terminal interface
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### Continue
```
/prologue                # Plain text interface
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

#### GitHub Copilot
```
/prologue                # Integrated interface
/prologue install        # Quick install top servers
/prologue smart          # Smart auto-discovery
/prologue monitor        # Start health monitoring
/prologue status         # Check installation status
```

## Platform-Specific Features

### Rich Terminal Support
- ✅ Claude Code: Full Rich formatting
- ✅ OpenCode: Full Rich formatting
- ❌ Gemini: Plain text only
- ❌ Auggie: Plain text only
- ❌ TunaCode: Plain text only
- ✅ Cursor: Limited Rich support
- ❌ Continue: Plain text only
- ⚠️ Copilot: Basic formatting

### Interactive Mode
- ✅ Claude Code: Full interactive menus
- ✅ OpenCode: Full interactive menus
- ❌ Gemini: Command-line only
- ✅ Auggie: Limited interaction
- ✅ TunaCode: Limited interaction
- ✅ Cursor: Full interaction
- ⚠️ Continue: Basic interaction
- ⚠️ Copilot: Basic interaction

### Background Tasks
- ✅ Claude Code: Full background support
- ✅ OpenCode: Full background support
- ❌ Gemini: No background tasks
- ❌ Auggie: No background tasks
- ❌ TunaCode: No background tasks
- ✅ Cursor: Background support
- ⚠️ Continue: Limited background
- ⚠️ Copilot: Limited background

## Installation Commands

### Universal Installation
```bash
# Clone and install
git clone https://logue.pro/prologue.git
cd prologue/cli
python prologue_universal.py --install-deps

# Create global command
ln -sf $(pwd)/prologue_universal.py ~/.local/bin/prologue
```

### Platform-Specific Setup

#### Claude Code
```bash
# Install slash command
cp prologue.md ~/.claude/commands/
```

#### Auggie AI
```bash
# Install Auggie plugin
cp auggie-plugin.py ~/.auggie/plugins/
```

#### Gemini AI
```bash
# Install Gemini extension
cp gemini-extension.py ~/.gemini/extensions/
```

#### Cursor
```bash
# Install Cursor extension
cp cursor-extension.py ~/.cursor/extensions/
```

## Compatibility Matrix

| Platform | Prefix | Rich UI | Interactive | Background | Status |
|----------|--------|---------|-------------|-------------|---------|
| Claude Code | / | ✅ | ✅ | ✅ | ✅ Primary |
| OpenCode | / | ✅ | ✅ | ✅ | ✅ Full |
| Auggie | ! | ❌ | ⚠️ | ❌ | ✅ Compatible |
| Gemini | / | ❌ | ❌ | ❌ | ✅ Compatible |
| Codex | / | ❌ | ✅ | ⚠️ | ✅ Compatible |
| TunaCode | @ | ❌ | ⚠️ | ❌ | ✅ Compatible |
| Cursor | / | ⚠️ | ✅ | ⚠️ | ✅ Compatible |
| Continue | / | ❌ | ⚠️ | ⚠️ | ✅ Compatible |
| Copilot | / | ⚠️ | ⚠️ | ⚠️ | ✅ Compatible |

## Universal Wrapper

The `prologue_universal.py` wrapper automatically:
- ✅ Detects the current AI platform
- ✅ Adapts output formatting
- ✅ Adjusts command syntax
- ✅ Installs required dependencies
- ✅ Falls back gracefully for unsupported features
- ✅ Provides platform-specific help

### Usage
```bash
python prologue_universal.py --platform     # Show platform info
python prologue_universal.py --compatibility # Show compatibility matrix
python prologue_universal.py --install-deps # Install platform dependencies
python prologue_universal.py                  # Run with auto-detection
```

## Troubleshooting

### Platform Not Detected
```bash
export FORCE_PLATFORM=claude_code
python prologue_universal.py
```

### Rich UI Not Working
```bash
export DISABLE_RICH=1
python prologue_universal.py
```

### Interactive Mode Issues
```bash
export NON_INTERACTIVE=1
python prologue_universal.py install
```

## Support

For platform-specific issues:
- 📧 Email: mcp@logue.pro
- 🌐 Website: logue.pro
- 📖 Docs: docs.logue.pro

Built with ae.ltd • Not built with demo