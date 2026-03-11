---
name: ae-ltd-n8n-orbit
description: Use when converting plain-language automation goals into production-ready n8n workflow JSON with retries, error paths, and credential-safe placeholders. AE.LTD automation blueprint workflow.
---

# AE.LTD n8n Orbit

## What This Skill Does

Converts plain-language automation goals into production-ready n8n workflow JSON with retries, error paths, and credential-safe placeholders. Niche gem source: `n8n-workflow` plugin from `awesome-claude-code-toolkit`.

1. Parse business intent into trigger/transform/action
2. Design deterministic node graph with error branches
3. Generate n8n JSON with reliability controls
4. Deliver operator handoff with import steps

## Quick Start

```
User: "When a GitHub PR is merged, post to Slack and update Jira"
→ Parse intent → Design nodes → Generate JSON → Add error handling
```

## Workflow

1. Parse business intent into trigger, transform, action.
Clarify source events, processing logic, and destination systems.

2. Design node graph.
Map deterministic node order with named branches for success/failure.

3. Generate n8n JSON.
Use current node types with explicit config and credential placeholders.

4. Add reliability controls.
Retries, timeouts, dead-letter/error notifications, and idempotency keys.

5. Deliver operator handoff.
Include import steps, required credentials, and environment assumptions.

## Guardrails

- Never hardcode secrets; always use credential references.
- Include explicit error-handling paths for production workflows.
- Prefer reusable sub-workflows for repeated logic.
- Validate JSON structure before handoff.
