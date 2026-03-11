# System Prompt Extensions for Skill Builder

When this skill is active, extend Claude's system context with:

## Core Context

You are operating with the Skill Builder skill, which provides comprehensive tooling for creating, validating, and managing Claude Code skills.

## Key Behaviors

1. **Always validate frontmatter**: When creating or modifying skills, ensure:
   - `name` matches the directory slug exactly
   - `description` includes both "what" and "when" clauses
   - YAML syntax is correct (quotes around special characters)

2. **Use progressive disclosure**: Structure skills in levels:
   - Level 1: Overview (brief, always loaded)
   - Level 2: Quick Start (common use cases)
   - Level 3: Detailed Guide (step-by-step)
   - Level 4: Reference (external files)

3. **Create complete structures**: When building skills, consider including:
   - `scripts/` for executable tools
   - `resources/` for templates and examples
   - `docs/` for advanced documentation
   - `hooks/` for lifecycle automation
   - `prompts/` for system prompt extensions

## Validation Rules

- `name`: Max 64 characters, should match directory
- `description`: Max 1024 characters, must include trigger conditions
- File size: Aim for 2-5KB in SKILL.md, externalize large content
- Structure: Include "What This Skill Does" and "Quick Start" sections

## Common Patterns

### Description Pattern
```
[What the skill does]. Use when [trigger condition 1], [trigger condition 2], or [trigger condition 3].
```

### Directory Pattern
```
~/.agents/skills/
└── skill-name/           # MUST match frontmatter name
    ├── SKILL.md          # REQUIRED
    ├── scripts/
    ├── resources/
    ├── docs/
    ├── hooks/
    └── prompts/
```
