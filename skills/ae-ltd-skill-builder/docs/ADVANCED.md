# Advanced Skill Patterns

This document covers advanced patterns for building sophisticated Claude Code skills.

## Skill Composition

Skills can reference and invoke other skills, creating powerful workflows.

### Pattern: Skill Chaining

```markdown
## Related Workflows

After using this skill, you may want to:
1. Use [API Tester](../api-tester/) to validate the generated endpoints
2. Use [Documentation Generator](../doc-generator/) to create API docs
3. Use [Deploy Manager](../deploy-manager/) to push to production
```

### Pattern: Skill Prerequisites

```markdown
## Prerequisites

Before using this skill, ensure:
- [Database Schema](../db-schema/) has been run to create tables
- [Auth Setup](../auth-setup/) has configured authentication
- Environment variables are set (see [Env Manager](../env-manager/))
```

---

## MCP Integration

Skills can leverage MCP (Model Context Protocol) tools for extended capabilities.

### Pattern: MCP Tool Reference

```markdown
## Available MCP Tools

This skill can use the following MCP tools:
- `mcp__filesystem__read_file` - Read file contents
- `mcp__github__create_pull_request` - Create GitHub PRs
- `mcp__slack__post_message` - Send Slack messages

## Example Usage

\`\`\`bash
# The skill will automatically use MCP tools when available
# No additional configuration needed
\`\`\`
```

### Pattern: MCP-Enhanced Hooks

```bash
#!/usr/bin/env bash
# hooks/post-task.sh - MCP-enhanced hook

# Use MCP to notify on completion
if command -v mcp-notify &>/dev/null; then
    mcp-notify "Skill $SKILL_NAME completed successfully"
fi

# Store results in MCP-managed storage
if [[ -n "$MCP_STORAGE_PATH" ]]; then
    cp output.json "$MCP_STORAGE_PATH/results/$SKILL_NAME/"
fi
```

---

## Dynamic Skill Generation

Create skills that generate other skills at runtime.

### Pattern: Template Engine

```bash
#!/usr/bin/env bash
# scripts/generate-from-template.sh

TEMPLATE="$1"
OUTPUT_SKILL="$2"

# Read template
CONTENT=$(cat "$TEMPLATE")

# Replace variables
CONTENT="${CONTENT//\{\{DATE\}\}/$(date -I)}"
CONTENT="${CONTENT//\{\{USER\}\}/$USER}"
CONTENT="${CONTENT//\{\{SKILL_NAME\}\}/$OUTPUT_SKILL}"

# Write new skill
mkdir -p "$HOME/.agents/skills/$OUTPUT_SKILL"
echo "$CONTENT" > "$HOME/.agents/skills/$OUTPUT_SKILL/SKILL.md"
```

---

## State Management

Skills can maintain state across invocations.

### Pattern: Skill State File

```bash
#!/usr/bin/env bash
# scripts/save-state.sh

STATE_FILE="$HOME/.agents/state/$SKILL_NAME.json"

# Load previous state
if [[ -f "$STATE_FILE" ]]; then
    LAST_RUN=$(jq -r '.last_run' "$STATE_FILE")
    COUNTER=$(jq -r '.counter' "$STATE_FILE")
else
    LAST_RUN="never"
    COUNTER=0
fi

# Update state
COUNTER=$((COUNTER + 1))
jq -n \
    --arg last_run "$(date -Iseconds)" \
    --argjson counter "$COUNTER" \
    '{last_run: $last_run, counter: $counter}' \
    > "$STATE_FILE"
```

### Pattern: Cross-Skill State

```bash
#!/usr/bin/env bash
# Share state between skills

SHARED_STATE="$HOME/.agents/state/shared.json"

# Read shared state
if [[ -f "$SHARED_STATE" ]]; then
    PROJECT_ROOT=$(jq -r '.project_root // empty' "$SHARED_STATE")
fi

# Update shared state
if [[ -n "$PROJECT_ROOT" ]]; then
    jq --arg root "$PROJECT_ROOT" '.project_root = $root' "$SHARED_STATE" > "$SHARED_STATE.tmp"
    mv "$SHARED_STATE.tmp" "$SHARED_STATE"
fi
```

---

## Conditional Content

Skills can adapt based on environment or context.

### Pattern: Environment Detection

```markdown
## Setup

### Linux/macOS
\`\`\`bash
./scripts/setup-unix.sh
\`\`\`

### Windows
\`\`\`powershell
.\scripts\setup-windows.ps1
\`\`\`
```

### Pattern: Feature Detection

```bash
#!/usr/bin/env bash
# Detect available features

HAS_DOCKER=false
HAS_NPM=false
HAS_PYTHON=false

command -v docker &>/dev/null && HAS_DOCKER=true
command -v npm &>/dev/null && HAS_NPM=true
command -v python3 &>/dev/null && HAS_PYTHON=true

# Adapt behavior
if $HAS_DOCKER; then
    echo "Using Docker for isolation"
    ./scripts/run-docker.sh
elif $HAS_NPM; then
    echo "Using npm scripts"
    npm run start
else
    echo "Using direct execution"
    ./scripts/run-direct.sh
fi
```

---

## Skill Testing Framework

Create testable skills with built-in validation.

### Pattern: Self-Testing Skill

```markdown
## Testing

This skill includes self-tests:

\`\`\`bash
# Run skill tests
./scripts/test.sh

# Expected output:
# ✓ Frontmatter valid
# ✓ Scripts executable
# ✓ Templates parse correctly
# ✓ Hooks run without errors
\`\`\`
```

### Pattern: Test Hook

```bash
#!/usr/bin/env bash
# hooks/test.sh - Run skill self-tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

echo "Running self-tests for $(basename "$SKILL_DIR")..."

# Test 1: Validate SKILL.md
python3 -c "
import re
text = open('$SKILL_DIR/SKILL.md').read()
assert re.match(r'^---\n.*?name:', text, re.S), 'Missing frontmatter'
print('✓ Frontmatter valid')
"

# Test 2: Check scripts are executable
for script in "$SKILL_DIR/scripts"/*.sh; do
    [[ -x "$script" ]] && echo "✓ $(basename "$script") executable"
done

# Test 3: Validate templates
for template in "$SKILL_DIR/resources/templates"/*.template; do
    [[ -f "$template" ]] && echo "✓ Template $(basename "$template") exists"
done

echo "All tests passed!"
```

---

## Performance Optimization

Optimize skills for fast loading and execution.

### Pattern: Lazy Loading

```markdown
## Advanced Configuration

For large configurations, see:
- [Full Configuration Reference](docs/CONFIG_FULL.md) - Loaded only when needed
- [API Reference](docs/API_REFERENCE.md) - Loaded only for API usage
- [Examples Gallery](resources/examples/) - Loaded on-demand

This keeps the core SKILL.md lightweight (~3KB) while providing comprehensive documentation.
```

### Pattern: Caching

```bash
#!/usr/bin/env bash
# scripts/with-cache.sh

CACHE_DIR="$HOME/.agents/cache/$SKILL_NAME"
CACHE_TTL=3600  # 1 hour

mkdir -p "$CACHE_DIR"

check_cache() {
    local key="$1"
    local cache_file="$CACHE_DIR/$key.cache"

    if [[ -f "$cache_file" ]]; then
        local age=$(( $(date +%s) - $(stat -c %Y "$cache_file") ))
        if [[ $age -lt $CACHE_TTL ]]; then
            cat "$cache_file"
            return 0
        fi
    fi
    return 1
}

save_cache() {
    local key="$1"
    cat > "$CACHE_DIR/$key.cache"
}

# Use cache
if ! check_cache "data" 2>/dev/null; then
    expensive_operation | save_cache "data"
fi
```

---

## Multi-Repository Skills

Skills that work across multiple repositories.

### Pattern: Workspace Detection

```bash
#!/usr/bin/env bash
# Detect current workspace context

# Git repository
if git rev-parse --git-dir &>/dev/null; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    REPO_NAME=$(basename "$REPO_ROOT")
    echo "Working in: $REPO_NAME"
fi

# Monorepo detection
if [[ -f "$REPO_ROOT/pnpm-workspace.yaml" ]] || [[ -d "$REPO_ROOT/packages" ]]; then
    IS_MONOREPO=true
    PACKAGES=$(ls -d "$REPO_ROOT/packages"/*/ 2>/dev/null | xargs -n1 basename)
    echo "Monorepo with packages: $PACKAGES"
fi

# Project type detection
if [[ -f "$REPO_ROOT/package.json" ]]; then
    PROJECT_TYPE="node"
elif [[ -f "$REPO_ROOT/requirements.txt" ]]; then
    PROJECT_TYPE="python"
elif [[ -f "$REPO_ROOT/go.mod" ]]; then
    PROJECT_TYPE="go"
fi
```
