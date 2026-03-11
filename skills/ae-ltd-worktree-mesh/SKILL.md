---
name: ae-ltd-worktree-mesh
description: Use when parallel branches are needed for feature work, hotfixes, or review fixes using git worktrees with minimal context switching. AE.LTD workflow for safe creation, usage, and cleanup.
---

# AE.LTD Worktree Mesh

## What This Skill Does

Manages parallel Git worktrees for isolated feature work, hotfixes, and review fixes without context switching. Niche gem source: `create-worktrees` plugin from `awesome-claude-code-toolkit`.

1. Create isolated worktrees for parallel tasks
2. Map branch ownership across worktrees
3. Clean up merged/obsolete worktrees safely

## Quick Start

```
User: "I need to work on two features in parallel"
→ git worktree list → git worktree add ../repo-feature -b feature main
```

## Workflow

1. Inspect current worktrees.
Run `git worktree list` and map branch ownership.

2. Create targeted worktree.
`git worktree add ../<repo>-<task> -b <branch> <base>`

3. Isolate runtime config.
Do not duplicate secrets. Keep per-worktree local env overrides where needed.

4. Keep each worktree single-purpose.
One task or ticket per worktree. Avoid mixed commits.

5. Clean only when safe.
Remove merged/obsolete worktrees, then run `git worktree prune`.

## Guardrails

- Never remove worktrees with uncommitted changes.
- Use `git branch -d`, not force delete, unless user explicitly approves.
- Keep worktrees outside the main repo directory.
- Use descriptive branch names tied to the task.
