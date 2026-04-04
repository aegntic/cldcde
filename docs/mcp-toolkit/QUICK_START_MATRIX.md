# Quick Start Activation Matrix

**Identify your path and execute the corresponding trigger.**

| User Persona | Goal | Primary Trigger |
| :--- | :--- | :--- |
| **Python Developer** | Build from scratch | `/scaffold-mcp [name] --lang python` |
| **Node.js Developer** | Build from scratch | `/scaffold-mcp [name] --lang typescript` |
| **System Architect** | Design interface only | `@protocol-architect design [domain] interface` |
| **Integrator** | Connect existing script | `/deploy-server [path] --env-vars KEY=VAL` |
| **Debugger** | Fix broken connection | `/test-transport [path]` |
| **Security Ops** | Audit configuration | `@security-auditor validate [config_path]` |

---

## "What Should I Do Next?" Heuristic

1. **If you have nothing:**
    * Run `/scaffold-mcp`

2. **If you have code but no MCP:**
    * Ask `@mcp-orchestrator`: "Convert this script to an MCP server"

3. **If you have a server but it fails:**
    * Run `/test-transport`

4. **If it works locally but not in Claude:**
    * Run `/deploy-server`

---

## Cheatsheet: Common Patterns

**Async Tool (Python)**

```python
@mcp.tool()
async def fetch_data(url: str) -> str:
    async with httpx.AsyncClient() as client:
        return (await client.get(url)).text
```

**Resource (Python)**

```python
@mcp.resource("file://{path}")
def read_file(path: str) -> str:
    return Path(path).read_text()
```

**Error Handling**

```python
if invalid:
    raise MCPError("Invalid input", code=-32602)
```
