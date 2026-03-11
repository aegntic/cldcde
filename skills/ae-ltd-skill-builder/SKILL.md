---
name: ae-ltd-skill-builder
description: Create new Claude Code Skills with proper YAML frontmatter, progressive disclosure structure, and complete directory organization. Use when building custom skills, generating skill templates, fixing naming issues, or understanding the Claude Skills specification.
---

# AE.LTD Skill Builder

## What This Skill Does

Production-ready skill factory for Claude Code. Creates skills that Claude can autonomously discover and use across all surfaces (Claude.ai, Claude Code, SDK, API).

1. Scaffold new skills with proper structure
2. Validate and fix existing skills
3. Generate templates (basic, intermediate, advanced)
4. Automate lifecycle with hooks

## Prerequisites

- Claude Code 2.0+ or Claude.ai with Skills support
- Basic understanding of Markdown and YAML
- Text editor or IDE

## Quick Start

```bash
# Interactive skill creation
./scripts/create-skill.sh my-new-skill

# Validate all skills
./scripts/validate-skill.sh

# Auto-fix naming issues
./scripts/fix-skill.sh
```

---

## Included Tooling

### Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `create-skill.sh` | Interactive skill scaffolding |
| `validate-skill.sh` | Validate structure & frontmatter |
| `fix-skill.sh` | Auto-fix naming and frontmatter issues |
| `lint-skill.sh` | Check content quality |
| `test-skill.sh` | Test skill integration |

### Hooks (`hooks/`)

| Hook | When |
|------|------|
| `pre-task.sh` | Before skill execution |
| `post-task.sh` | After skill completes |
| `pre-edit.sh` | Before file modification |
| `post-edit.sh` | After file modification |
| `session-end.sh` | Session cleanup |

### Prompts (`prompts/`)

| File | Purpose |
|------|---------|
| `system.md` | System context extensions |
| `examples.md` | Example interactions |

### Templates (`resources/templates/`)

- `basic/SKILL.md.template` - Minimal structure
- `intermediate/SKILL.md.template` - Standard sections
- `advanced/SKILL.md.template` - Full-featured

### Documentation (`docs/`)

- `ADVANCED.md` - Advanced patterns, MCP integration
- `TROUBLESHOOTING.md` - Common issues & solutions
- `HOOKS.md` - Complete hooks reference
- `PROMPTS.md` - Prompts system guide

---

## Workflow

1. **Create Skill**
   ```bash
   ./scripts/create-skill.sh my-skill --intermediate
   ```

2. **Validate**
   ```bash
   ./scripts/validate-skill.sh ~/.agents/skills/my-skill
   ```

3. **Lint Quality**
   ```bash
   ./scripts/lint-skill.sh ~/.agents/skills/my-skill
   ```

4. **Fix Issues**
   ```bash
   ./scripts/fix-skill.sh
   ```

---

## YAML Frontmatter Requirements

```yaml
---
name: "Skill Name"                    # REQUIRED: Max 64 chars
description: "What it does. Use when..." # REQUIRED: Max 1024 chars, include trigger
---
```

## Directory Structure

```
~/.agents/skills/
└── skill-name/           # MUST match frontmatter name
    ├── SKILL.md          # REQUIRED
    ├── scripts/          # Optional: Executable scripts
    ├── hooks/            # Optional: Lifecycle hooks
    ├── prompts/          # Optional: System context
    ├── docs/             # Optional: Advanced docs
    └── resources/        # Optional: Templates, examples
```

---

## Guardrails

- Name must match directory slug exactly
- Description must include "when" or "use" trigger
- SKILL.md should be 2-5KB, externalize larger content
- All scripts must be executable (`chmod +x`)
- Hooks must exit 0 for success, 1 for failure

---

## Resources

- [Anthropic Agent Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
- [GitHub Skills Repository](https://github.com/anthropics/skills)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
