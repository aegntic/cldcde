---
name: ae-ltd-mcp-foundry
description: Use when scaffolding or extending MCP servers, adding tools/resources/prompts, or hardening MCP tool schemas and handlers. AE.LTD workflow tuned for production-ready MCP delivery.
---

# AE.LTD MCP Foundry

Niche gem source: `model-context-protocol` plugin from `awesome-claude-code-toolkit`.

Use this skill when the user needs a new MCP server or a safe extension to an existing one.

## Workflow

1. Confirm server context.
Path, language, transport (`stdio` or `sse`), and whether this is new or existing.

2. Lock contract first.
Define tool names, descriptions, and input/output schema before writing handlers.

3. Scaffold or extend.
Create server structure (if new), then add tool/resource registration and handler wiring.

4. Validate hard.
Use Zod (TS) or Pydantic (Python). Reject invalid input early with useful error text.

5. Test one happy-path and one failure-path per tool.
Prefer runnable tests or lightweight CLI/integration checks.

6. Document usage for agent callers.
Keep descriptions explicit so models can invoke tools correctly.

## Guardrails

- Keep tool names unique and verb-oriented.
- Do not ship tools with ambiguous parameter names.
- Every required input must be validated.
- Error responses must be actionable, not generic.
- If multiple transports are possible, start with `stdio` unless user asks otherwise.
