# MCP Server Builder Toolkit: Strategic Deployment Orchestration

**Framework**: Modular deployment patterns for zero-friction MCP server lifecycle management

---

## I. Architectural Deployment Model

### Layer 0: Pre-Deployment Validation Matrix

```
┌─────────────────────────────────────────────────────────────┐
│ VALIDATION ORCHESTRATION LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Environment Validation ──┐                                 │
│  ├─ Python >=3.10         │                                 │
│  ├─ Node >=18.0           ├──→ Dependency Resolution        │
│  └─ MCP SDK Availability  │    ├─ fastmcp (latest)          │
│                           │    └─ @modelcontextprotocol/sdk │
│  Component Integrity ─────┤                                 │
│  ├─ Agent definitions     │                                 │
│  ├─ Skill schemas         ├──→ Structural Validation        │
│  └─ Command interfaces    │    ├─ JSON-RPC 2.0 Compliance   │
│                           │    └─ JSON Schema Draft 7       │
└───────────────────────────┴─────────────────────────────────┘
```

### Layer 1: Transport Verification (Connectivity)

Before any code touches the host configuration, the **Transport Layer** must be verified in isolation.

**Verification Protocol (`/test-transport`)**:

1. **Process Lifecycle**: Can the orchestrator spawn and kill the subprocess cleanly?
    * *Metric*: Startup time < 500ms
    * *Check*: Graceful simple shutdown (SIGTERM)
2. **Protocol Handshake**: Does the server respond to `initialize` with correct capabilities?
    * *Requirement*: `protocolVersion` must match host (1.0)
    * *Requirement*: Capabilities (`tools`, `resources`) must be explicitly declared
3. **STDIO Hygiene**: Is `stdout` reserved strictly for JSON-RPC messages?
    * *Failure Mode*: Any non-JSON text on stdout fails the deployment
    * *Remediation*: Auto-redirect `print()` to `stderr`

### Layer 2: Integration Orchestration (Configuration)

The **Integration Layer** constructs the bridge between the server and the Claude Code host.

**Configuration Synthesis (`/deploy-server`)**:

* **Variable Injection**: Environment variables are never hardcoded. They are injected via `${VAR_NAME}` references.
* **Path Resolution**: Relative paths are converted to absolute paths to ensure host-independence.
* **Config Merging**: New server configs are idempotently merged into `~/.claude/config.json` without overwriting existing entries.

### Layer 3: Production Hardening (Security)

The final **Security Layer** audit prevents sensitive data leakage.

**Audit Checklist (`@security-auditor`)**:

* [ ] **Credential Isolation**: No `sk-` or `ghp_` prefixes in config files.
* [ ] **Permission Locking**: Config files set to `600` (User Read/Write only).
* [ ] **Error Sanitization**: Deployment fails if test tracebacks contain environment values.
* [ ] **Execution Policy**: Command arguments validated against injection patterns.

---

## II. Deployment Scenarios Matrix

| Scenario | Transport | Validation Strategy | Orchestration Pattern |
| :--- | :--- | :--- | :--- |
| **Local Dev** | STDIO | Fast-fail on startup | Direct process spawning |
| **Container** | STDIO | Health-check probe | Docker bridge / Volume mount |
| **Remote (SSE)** | SSE/HTTP | Endpoint liveliness | Proxy tunnel / Reverse proxy |
| **Multi-Server** | Hybrid | Dependency graph | Composite config generation |

---

## III. Rollback & Recovery Protocols

In the event of a deployment failure (e.g., specific server crashes Claude Code), the toolkit enforces atomic rollback.

### 1. Snapshot Protocol

Before any write to `~/.claude/config.json`:

1. Create timestamped backup: `config.json.bak-YYYYMMDD-HHMMSS`
2. Verify backup integrity (size/checksum match)

### 2. Atomic Write

1. Write new config to temporary file `config.json.tmp`
2. Validate JSON syntax of `.tmp` file
3. Perform atomic move: `mv config.json.tmp config.json`

### 3. Emergency Recovery

If the host fails to start after deployment:

1. Run `./uninstall.sh --restore-last`
2. Script identifies latest backup
3. Restores valid configuration
4. Logs failure analysis to `deploy.error.log`

---

## IV. Interface Contracts

### Deployment Command Input

```json
{
  "server_path": "/abs/path/to/server",
  "env_vars": {
    "API_KEY": "REQUIRED",
    "DEBUG": "OPTIONAL"
  },
  "strategy": "atomic_merge"
}
```

### Deployment Result Output

```json
{
  "status": "success",
  "deployment_id": "dep-12345",
  "config_path": "~/.claude/config.json",
  "security_audit": {
    "passed": true,
    "warnings": []
  }
}
```
