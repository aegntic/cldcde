# Spec-Lock Plugin
# Bi-Directional Code/Documentation Synchronization

## Overview

The Living Spec Synchronizer prevents documentation rot by maintaining bi-directional sync between code and specifications. It treats documentation as executable code that must stay in sync with implementation.

## How It Works

### 1. Post-Edit Analysis (PostToolUse Hook)
Every time a file is edited, Spec-Lock:
- Analyzes the semantic intent of changes
- Compares against CLAUDE.md and SPEC.md
- Detects drift between code and docs

### 2. Conflict Detection
Two scenarios trigger synchronization:

**Scenario A: Code Drift**
- Code violates the spec (e.g., wrong auth method)
- Plugin asks: "Revert code to match spec, or update spec?"

**Scenario B: Spec Evolution**
- Code introduces new logic not in spec
- Plugin asks: "Update SPEC.md to match code?"

### 3. Auto-Update
Uses headless Claude (`claude -p`) to:
- Generate documentation patches
- Update dependent docs automatically
- Maintain knowledge graph of dependencies

## Configuration

### Priority Rules (spec-priorities.yaml):
```yaml
files:
  "src/auth/**":
    spec_source: "AUTH_SPEC.md"
    priority: code  # Code wins for auth (security)
  
  "docs/api/**":
    spec_source: "API_SPEC.md"
    priority: spec  # Spec wins for API contracts
  
  "src/models/**":
    spec_source: "DATA_MODEL.md"
    priority: ask   # Always ask user
```

## Usage

### Automatic Mode:
Spec-Lock runs automatically on every file edit via PostToolUse hook.

### Manual Commands:
```bash
/spec-lock sync                    # Force full sync
/spec-lock check <file>            # Check specific file
/spec-lock resolve <conflict_id>   # Resolve conflict
/spec-lock status                  # Show sync status
```

## Integration

- **Knowledge Graph**: SQLite database tracks dependencies
- **Agent Zero**: Native plugin integration
- **Hooks**: PreToolUse + PostToolUse coordination
- **Headless Mode**: Background updates via `claude -p`

## Database Schema

```sql
CREATE TABLE spec_dependencies (
    id INTEGER PRIMARY KEY,
    code_file TEXT NOT NULL,
    spec_file TEXT NOT NULL,
    last_sync TIMESTAMP,
    drift_detected BOOLEAN,
    sync_direction TEXT  -- 'code_to_spec' or 'spec_to_code'
);
```