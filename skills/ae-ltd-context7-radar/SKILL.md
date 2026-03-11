---
name: ae-ltd-context7-radar
description: Use when coding decisions depend on current library/framework APIs and you need version-accurate docs before implementation. AE.LTD workflow tuned for fast, verifiable doc grounding.
---

# AE.LTD Context7 Radar

## What This Skill Does

Grounds coding decisions in version-accurate documentation before implementation. Eliminates stale API memory errors. Niche gem source: `context7-docs` plugin from `awesome-claude-code-toolkit`.

1. Resolve exact dependency version from lockfile
2. Pull targeted docs via Context7
3. Extract implementation-critical constraints
4. Apply verified API patterns in code

## Quick Start

```
User: "I need to use React 18's useTransition"
→ Resolve version → Pull docs → Extract constraints → Implement
```

## Workflow

1. Identify exact dependency and version.
Resolve from lockfile or package manager before searching docs.

2. Pull targeted docs via Context7.
Request only the APIs needed for the task.

3. Extract implementation-critical constraints.
Capture signatures, defaults, deprecations, and edge-case behavior.

4. Apply directly in code.
Implement using verified API patterns instead of memory.

5. Cite source and version.
Record where docs came from so future updates are auditable.

## Guardrails

- Never assume API shape without version confirmation.
- Flag experimental/deprecated APIs before adoption.
- Prefer minimal examples that map to the current task.
- Re-check docs for breaking changes when dependency versions shift.
