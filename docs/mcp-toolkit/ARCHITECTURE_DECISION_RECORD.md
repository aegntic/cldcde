# Architecture Decision Record (ADR) - MCP Server Builder Toolkit

**Status**: Accepted
**Date**: 2025-12-28
**Context**: Design of a modular toolkit for Model Context Protocol server development.

---

## ADR-001: Agent-Centric Orchestration

### Context

Developing MCP servers requires distinct types of expertise: Protocol knowledge (JSON-RPC), Security (Transport/Env), and Implementation (Python/Node). Expecting a single "Coder" agent to handle all reliably leads to context blending and hallucinations.

### Decision

We implement a **Federated Agent Architecture**:

* `mcp-orchestrator`: Workflow state manager.
* `protocol-architect`: Read-only spec expert (Design phase).
* `security-auditor`: Read-only security expert (Verification phase).

### Consequences

* **Positives**: Separation of concerns. Specialized context windows (Architecture doesn't need to know Python syntax; Security doesn't need to know JSON-RPC details).
* **Negatives**: Higher token overhead for inter-agent delegation.
* **Mitigation**: Optimized prompt definitions and strict delegation protocols.

---

## ADR-002: Transport Layer Standardization (STDIO)

### Context

MCP supports STDIO, SSE, and HTTP. Claude Code runs locally and spawns subprocesses.

### Decision

The toolkit defaults to **STDIO Transport** for all internal development workflows (`/test-transport`, `/deploy-server`).

### Consequences

* **Positives**: Zero network configuration required. Secure by default (process isolation). Native to Claude Code.
* **Negatives**: Harder to debug than HTTP (requires stderr redirection).
* **Mitigation**: The `stdio-transport` skill and `/test-transport` command explicitly handle stderr redirection and debugging.

---

## ADR-003: Atomic Deployment with Rollback

### Context

Modifying the host configuration (`~/.claude/config.json`) carries high risk. Corrupting this file breaks the user's environment.

### Decision

All deployment operations must be **idempotent and atomic**.

1. Read existing config.
2. Merge new server config in memory.
3. Write to temp file.
4. Atomic swap (`mv`).
5. Backup maintained for immediate rollback.

### Consequences

* **Positives**: Zero-downtime deployment. "Undo" capability.
* **Negatives**: Slightly slower than append-only strategies.

---

## ADR-004: Progressive Knowledge Loading (Skills)

### Context

Including all implementation patterns (Python, Node, Testing) in the system prompt consumes massive context.

### Decision

Use a **Skill-Based Knowledge Architecture**:

* `skills/fastmcp-patterns`: Loaded only when `lang=python`.
* `skills/stdio-transport`: Loaded only during debugging/deployment.

### Consequences

* **Positives**: Token efficiency. Context purity.
* **Negatives**: Latency when switching contexts (loading new files).
