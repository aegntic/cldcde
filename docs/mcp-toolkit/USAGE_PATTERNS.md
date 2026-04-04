# MCP Server Builder Toolkit: Usage Patterns & Interaction Framework

**Framework**: Modular interaction protocols for agent-driven MCP development

---

## I. Agent Interaction Patterns

### Pattern A: The Architect-Auditor Handoff

*For creating high-integrity server interfaces.*

**Trigger**: "Create a new MCP server for [Domain]"

1. **Orchestrator (Router)**:
    * Identifies intent: `CREATE_NEW`
    * Selects Strategy: `DESIGN_FIRST`
    * *Prompt*: "Delegating to @protocol-architect for interface design."

2. **Protocol Architect (Designer)**:
    * Input: Domain description
    * Action: Generates JSON-RPC compliant tool definitions
    * Output: `schema.json` (Capabilities, Tools, Resources)
    * *Constraint*: Pure design, no implementation code.

3. **Orchestrator (Builder)**:
    * Input: `schema.json`
    * Action: Executed `/scaffold-mcp` with schema
    * Output: Generated codebase

4. **Security Auditor (Verifier)**:
    * Input: Generated codebase configuration
    * Action: Scans for credential leaks in transport config
    * Output: `pass` or `block` with remediation

### Pattern B: The Transport Diagnostics Loop

*For resolving connectivity issues.*

**Trigger**: "My server isn't connecting to Claude"

1. **Orchestrator**:
    * Identifies intent: `DEBUG_CONNECTION`
    * Loads Skill: `stdio-transport`
    * Action: Executes `/test-transport`

2. **Diagnostics Execution**:
    * Step 1: Process Spawn Check
    * Step 2: JSON-RPC Handshake
    * Step 3: Error Log Analysis

3. **Orchestrator**:
    * Synthesizes test results.
    * If `exit_code != 0`: Delegates to human user for fix (e.g., "Install missing dependencies").
    * If `timeout`: Delegates to @security-auditor to check for blocking I/O or network calls.

---

## II. Workflow Automation Patterns

| Workflow | Command Chain | Context |
| :--- | :--- | :--- |
| **Rapid Prototype** | `/scaffold-mcp` → `/test-transport` | Create minimal viable tool |
| **Production Build** | `/scaffold-mcp` → (Impl) → `/test-transport` → `/deploy-server` | Full lifecycle with integration |
| **Component Add** | `@protocol-architect` (Design) → (Manual Impl) → `/test-transport` | Adding tools to existing server |

---

## III. Skill Synthesis Patterns

The ecosystem dynamically loads knowledge based on active context.

### Context: Python Development

* **Active Skill**: `fastmcp-patterns`
* **Focus**: Decorators (`@mcp.tool()`), Pydantic models, AsyncIO
* **Suppress**: Node.js/TypeScript patterns

### Context: Integration Debugging

* **Active Skill**: `stdio-transport`
* **Focus**: `stdin`/`stdout` handling, Environment injection, Process lifecycle
* **Suppress**: Tool implementation details

### Context: Validation

* **Active Skill**: `mcp-testing`
* **Focus**: `pytest` fixtures, `subprocess` mocking, Schema validation
* **Suppress**: Deployment configs

---

## IV. User Interaction Patterns

### 1. The Direct Command (Power User)

User bypasses agent negotiation for atomic actions.

```bash
/scaffold-mcp crypto-tracker --lang python
/test-transport ./crypto-tracker
```

### 2. The Natural Language Request (Guided)

User provides high-level intent; agents handle complexity.
> "Build a crypto tracker that shows Bitcoin price"

**System Response**:

1. **@mcp-orchestrator**: "I'll help with that. First, @protocol-architect will design the tools."
2. **@protocol-architect**: "Designing `get_btc_price` tool..."
3. **@mcp-orchestrator**: "Scaffolding server code..."
4. **@mcp-orchestrator**: "Please add your CoinGecko API key to `.env`."
5. **User**: "Done."
6. **@mcp-orchestrator**: "Running `/test-transport`... verification passed. Deploying."

### 3. The Review Request (Collaborative)

User asks for validation of manual work.
> "@security-auditor check my config"

**System Response**:
> "Analyzing `config.json`...
> ⚠️ Warning: `API_TOKEN` is hardcoded. Please switch to `${API_TOKEN}` environment variable pattern."

---

## V. Command-Agent Symbiosis

Commands are tools for agents, but also standalone utilities for users.

* **Agents use Commands** to execute work reliably (reducing hallucination risk).
* **Users use Commands** to speed up repetitive tasks.
* **Commands use Agents** (conceptually) by enforcing the patterns verifying by agents (e.g., `/deploy-server` runs a mini-audit similar to `@security-auditor`).
