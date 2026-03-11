---
name: "example-skill"
description: "Demonstrates proper skill structure with all components. Use when learning how to build skills or as a template reference."
---

# Example Skill

This is a complete example skill demonstrating all available components.

## Prerequisites
- Claude Code 2.0+
- Basic command line knowledge

## What This Skill Does
1. Demonstrates proper skill structure
2. Shows hook integration
3. Provides prompt examples
4. Includes working scripts

## Quick Start
```bash
# Run the example script
./scripts/example.sh
```

---

## Components

### Scripts
- `scripts/example.sh` - Example executable script

### Hooks
- `hooks/pre-task.sh` - Runs before skill execution
- `hooks/post-task.sh` - Runs after skill execution

### Prompts
- `prompts/system.md` - System context extensions
- `prompts/examples.md` - Usage examples

---

## Directory Structure

```
example-skill/
├── SKILL.md              # This file
├── scripts/
│   └── example.sh        # Example script
├── hooks/
│   ├── pre-task.sh
│   └── post-task.sh
├── prompts/
│   ├── system.md
│   └── examples.md
└── docs/
    └── README.md
```

---

## Troubleshooting

### Issue: Script not executable
**Solution**: Run `chmod +x scripts/*.sh`

### Issue: Hook doesn't run
**Solution**: Ensure hook is executable and has proper shebang
