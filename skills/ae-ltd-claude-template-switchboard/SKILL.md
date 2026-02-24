---
name: ae-ltd-claude-template-switchboard
description: Use when creating or upgrading CLAUDE.md instructions and selecting the right template baseline for repo size, architecture, and team constraints. AE.LTD template decision workflow.
---

# AE.LTD Claude Template Switchboard

Niche gem source: CLAUDE.md templates in `awesome-claude-code-toolkit/templates/claude-md`.

Use this skill when a repo needs a better CLAUDE.md baseline.

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
