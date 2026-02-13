---
name: "spec-lock"
description: "Bi-directional code and documentation synchronizer. Use when editing code that affects specifications, API contracts, or documentation. Prevents documentation rot by maintaining sync between implementation and docs. Automatically detects drift and suggests updates."
version: "1.0.0"
author: "Essential 2026 Suite"
tags: ["documentation", "sync", "specs", "maintenance", "drift"]
trigger_patterns:
  - "update documentation"
  - "check spec sync"
  - "documentation drift"
  - "sync specs"
  - "spec lock"
  - "update spec"
  - "check docs"
  - "documentation out of date"
  - "maintain documentation"
allowed_tools: ["Bash", "Read", "Write", "Edit"]
---

# Spec-Lock: Documentation Synchronization

## Overview

Spec-Lock prevents documentation rot by maintaining bi-directional sync between code and specifications. It treats documentation as executable code that must stay synchronized with implementation.

## The Problem It Solves

**Documentation Rot**: In agentic workflows, code evolves faster than docs. Users hate writing documentation, and agents frequently ignore old instructions.

**Spec-Lock Solution**: Automatic synchronization that detects drift and keeps context perfectly synced with reality.

## How It Works

### 1. Post-Edit Analysis (PostToolUse Hook)
Every time a file is edited:
- Analyzes semantic intent of the change
- Compares against CLAUDE.md and SPEC.md
- Detects drift between code and docs

### 2. Conflict Detection
Two scenarios trigger sync:

**Scenario A: Code Drift**
- Code violates the spec (e.g., wrong auth method)
- Plugin asks: "Revert code or update spec?"

**Scenario B: Spec Evolution**
- Code introduces new logic not in spec
- Plugin asks: "Update SPEC.md to match code?"

### 3. Auto-Update
Uses headless Claude to:
- Generate documentation patches
- Update dependent docs automatically
- Maintain knowledge graph of dependencies

## When to Use

Activate Spec-Lock when:
- Changing API endpoints or parameters
- Modifying authentication flows
- Updating database schemas
- Changing configuration values
- Implementing new features
- Refactoring existing code

## Usage

### Automatic Mode
With PostToolUse hooks:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit(*)|Write(*)",
        "command": "python3 /a0/usr/plugins/spec-lock/spec-lock.py --check"
      }
    ]
  }
}
```

### Manual Commands
```bash
# Check a file for drift
python3 /a0/usr/plugins/spec-lock/spec-lock.py --check <file>

# Register a new dependency
python3 /a0/usr/plugins/spec-lock/spec-lock.py --register <code> <spec> [priority]

# Show sync status
python3 /a0/usr/plugins/spec-lock/spec-lock.py --status

# Force full sync
python3 /a0/usr/plugins/spec-lock/spec-lock.py --sync
```

## Configuration

### Priority Rules
Create `/a0/usr/plugins/spec-lock/spec-priorities.yaml`:

```yaml
files:
  "src/auth/**":
    spec_source: "AUTH_SPEC.md"
    priority: code  # Code wins (security)
  
  "docs/api/**":
    spec_source: "API_SPEC.md"
    priority: spec  # Spec wins (contracts)
  
  "src/models/**":
    spec_source: "DATA_MODEL.md"
    priority: ask   # Always ask user
```

**Priority Options:**
- `code`: Implementation is source of truth
- `spec`: Documentation is source of truth
- `ask`: Prompt user for decision

## Drift Detection

Spec-Lock detects these drift types:

### Function Signature Mismatch
```javascript
// Code has:
function createUser(name, email, role)

// Spec says:
function createUser(name, email)
// DRIFT: 'role' parameter not documented
```

### API Endpoint Changes
```javascript
// Code changed from:
POST /api/v1/users

// To:
POST /api/v2/users
// DRIFT: Version change not in API_SPEC.md
```

### Configuration Changes
```javascript
// Code changed:
const timeout = 5000;  // Was: 30000

// Spec still says:
"Request timeout: 30 seconds"
// DRIFT: Config value changed
```

## Knowledge Graph

SQLite database tracks dependencies:

```sql
CREATE TABLE spec_dependencies (
    code_file TEXT,
    spec_file TEXT,
    last_sync TIMESTAMP,
    drift_detected BOOLEAN,
    priority TEXT
);
```

**Example Dependencies:**
- `src/auth/login.ts` → `AUTH_SPEC.md`
- `src/api/users.js` → `API_SPEC.md`
- `src/models/user.js` → `DATA_MODEL.md`

## Sample Workflow

### Developer Edits Authentication
```bash
# Developer changes JWT expiry
vim src/auth/login.ts
# const expiry = '1h';  # Changed from '24h'
```

### Spec-Lock Detects Drift
```
⚠️  DRIFT DETECTED in src/auth/login.ts

AUTH_SPEC.md says:
  "Session tokens expire after 24 hours"

Code implements:
  "Session tokens expire after 1 hour"

Priority: CODE WINS (security)
Auto-updating AUTH_SPEC.md...
✅ Documentation synchronized
```

### Sync Status Updated
```
📊 SYNC STATUS:
  Total Dependencies: 47
  In Sync: 47
  Drifted: 0
  Last Sync: 2026-02-12 13:00:00
```

## Integration

### With Debt-Sentinel
Spec-Lock runs after Debt-Sentinel clears edits:
```
1. Debt-Sentinel: Check for anti-patterns
2. Edit allowed to proceed
3. Spec-Lock: Check for doc drift
4. Auto-sync if possible
```

### With Compound Engineering
Part of enhancement pipeline Level 4:
```
Level 4: Documentation Sync
  └─ Update all affected specs
  └─ Generate migration guides
  └─ Verify sync status
```

## Success Metrics

- **Sync Rate**: % of dependencies in sync
- **Drift Detection Time**: Time to detect changes
- **Auto-Resolution Rate**: % resolved automatically
- **Documentation Freshness**: Average age of specs

## Troubleshooting

### Database Locked
```bash
rm /a0/usr/plugins/spec-lock/spec_dependencies.db
```

### Missing Dependencies
```bash
# Register manually
python3 /a0/usr/plugins/spec-lock/spec-lock.py --register src/api/users.js API_SPEC.md spec
```

### False Positives
Adjust priority rules in `spec-priorities.yaml`:
```yaml
files:
  "src/internal/**":
    priority: code  # Internal tools don't need strict spec sync
```

---

**Part of the Essential 2026 Plugin Suite**