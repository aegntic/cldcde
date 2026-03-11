---
name: ae-ltd-claude-template-switchboard
description: Use when creating or upgrading CLAUDE.md instructions and selecting the right template baseline for repo size, architecture, and team constraints. AE.LTD template decision workflow.
---

# AE.LTD Claude Template Switchboard

## What This Skill Does

Routes and customizes CLAUDE.md templates based on repo profile, architecture, and team constraints. Niche gem source: CLAUDE.md templates in `awesome-claude-code-toolkit/templates/claude-md`.

1. Classify repo profile (team size, architecture, compliance)
2. Select appropriate template baseline
3. Inject repo-specific truths
4. Remove template noise and validate executability

## Quick Start

```
User: "Help me set up CLAUDE.md for this monorepo"
→ Classify profile → Pick template → Inject truths → Validate
```

## Template Routing

- `minimal`: scripts or tiny repos.
- `standard`: most single-app repos.
- `monorepo`: multi-package workspace (Turborepo/Nx/pnpm workspaces).
- `enterprise`: compliance-heavy org environments.
- `python-project`: Python-first app stack.
- `fullstack-app`: frontend + API product stack.

## Workflow

1. Classify repo profile.
Team size, architecture, compliance needs, and tooling maturity.

2. Pick closest template baseline.
Start from one template only, then layer project specifics.

3. Inject repo truths.
Commands, folder map, test strategy, release flow, and non-negotiable rules.

4. Remove template noise.
Delete irrelevant sections rather than keeping generic placeholders.

5. Validate executability.
Every command and path in CLAUDE.md must exist or be updated.

## Guardrails

- Avoid overlong CLAUDE.md files with duplicate guidance.
- Keep conventions enforceable, not aspirational.
- Prefer concrete examples over policy prose.
