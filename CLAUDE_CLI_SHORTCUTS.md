# Claude CLI Shortcuts

A comprehensive collection of shortcuts and aliases for the Claude CLI to enhance your development workflow.

## Installation

Run the install script to add these shortcuts to your shell configuration:

```bash
curl -fsSL https://raw.githubusercontent.com/aegntic/cldcde/main/install-claude-shortcuts.sh | bash
```

Or manually:

```bash
git clone https://github.com/aegntic/cldcde.git
cd cldcde
chmod +x install-claude-shortcuts.sh
./install-claude-shortcuts.sh
```

## Basic Commands

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `cld` | `claude` | Start Claude (main shortcut) |
| `cldp` | `claude --print` | Print mode (non-interactive) |
| `cldc` | `claude --continue` | Continue conversation |
| `cldr` | `claude --resume` | Resume a session |
| `cldv` | `claude --verbose` | Verbose mode |
| `cldd` | `claude --debug` | Debug mode |

## Quick Combinations

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `cldpc` | `claude --print --continue` | Print + continue |
| `cldpr` | `claude --print --resume` | Print + resume |
| `cldvc` | `claude --verbose --continue` | Verbose + continue |

## Model Shortcuts

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `clds` | `claude --model sonnet` | Quick sonnet model |
| `cldo` | `claude --model opus` | Quick opus model |
| `clds1` | `claude --model claude-3-5-sonnet-20241022` | Specific sonnet model |
| `cldo1` | `claude --model claude-3-opus-20240229` | Specific opus model |

## Configuration

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `cldconf` | `claude config` | Configuration management |
| `cldmcp` | `claude mcp` | MCP server management |
| `cldup` | `claude update` | Update Claude |
| `clddoc` | `claude doctor` | Health check |
| `restcldd` | `pkill -f 'Claude.app' && sleep 2 && open -a Claude` | Restart Claude Desktop |

## Advanced Features

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `cldide` | `claude --ide` | Auto-connect to IDE |
| `cldsafe` | `claude --dangerously-skip-permissions` | Skip permissions (use carefully!) |
| `cldae` | `claude --dangerously-skip-permissions` | Auto-execute for safe operations |
| `cldaep` | `claude --dangerously-skip-permissions --print` | Auto-execute + print mode |
| `cldaec` | `claude --dangerously-skip-permissions --continue` | Auto-execute + continue |
| `cldjson` | `claude --print --output-format json` | JSON output |
| `cldstream` | `claude --print --output-format stream-json` | Streaming JSON |

## Utility Functions

| Function | Description |
|----------|-------------|
| `cld-session` | Interactive session picker |
| `cld-quick` | Quick one-liner with print mode |
| `cld-continue-print` | Continue conversation in print mode |
| `cld-auto` | Smart auto-execute with safety warnings |
| `cld-help` | Show comprehensive help |

## Experimental Development (now 'claude-ism')

| Shortcut | Full Command | Description |
|----------|--------------|-------------|
| `cldism` | `cldism()` | Start multi-approach experiment |
| `cldism-list` | `cldism-list()` | List all experiments |
| `cldism-show` | `cldism-show()` | Show experiment report |
| `cldexhelp` | - | Experiment system help |

### Deprecated Aliases (for backward compatibility)

| Shortcut | New Command | Status |
|----------|-------------|--------|
| `cldex` | `cldism` | ⚠️ Deprecated - shows warning |
| `cldlist` | `cldism-list` | ⚠️ Deprecated - shows warning |
| `cldshow` | `cldism-show` | ⚠️ Deprecated - shows warning |

## Usage Examples

### Basic Usage
```bash
# Start Claude
cld

# Quick one-liner in print mode
cldp "What is machine learning?"

# Continue a conversation
cldc "Can you elaborate on that?"

# Use specific model
clds "Use Sonnet to analyze this data"
```

### Auto-Execute (Safe Operations)
```bash
# Analyze code with auto-execute
cldae "Analyze this code and suggest improvements" *.py

# Review configuration with auto-execute + print
cldaep "Review this configuration file" config.yaml

# Smart auto-execute with safety warnings
cld-auto "Explain the architecture of this project"
```

### Experimental Development
```bash
# Start a new experiment (new syntax)
cldism "add user authentication system" auth-experiment

# List all experiments (new syntax)
cldism-list

# Show experiment report (new syntax)
cldism-show auth-experiment

# Deprecated syntax (still works with warnings)
cldex "add user authentication system" auth-experiment
cldlist
cldshow auth-experiment
```

## Safety Guidelines

### ✅ Safe for Auto-Execute
- Code analysis and review
- File reading and explanation
- Architecture explanations
- Documentation generation

### ❌ Risky Operations (Manual Review Required)
- File modifications
- System commands
- Network operations
- Deletions

## Help

Run `cld-help` anytime to see a comprehensive help guide with color formatting and examples directly in your terminal.

## Requirements

- Claude CLI installed
- Bash or Zsh shell
- Git (for cloning the repository)

## Contributing

Feel free to contribute additional shortcuts or improvements to the install script!
