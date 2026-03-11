# Troubleshooting Guide

Common issues and solutions when building and using Claude Code skills.

## Skill Discovery Issues

### Issue: Skill not appearing in Claude's skill list

**Symptoms:**
- Created a new skill but Claude doesn't see it
- `/skills` command doesn't show the skill

**Possible Causes:**

1. **Wrong directory location**
   ```
   ❌ ~/.claude/skills/my-skill/SKILL.md
   ✅ ~/.agents/skills/my-skill/SKILL.md
   ```

2. **Nested subdirectories**
   ```
   ❌ ~/.agents/skills/category/my-skill/SKILL.md
   ✅ ~/.agents/skills/my-skill/SKILL.md
   ```

3. **File named incorrectly**
   ```
   ❌ skill.md, Skill.md, SKILL.txt
   ✅ SKILL.md
   ```

**Solution:**
```bash
# Check skill location
ls -la ~/.agents/skills/my-skill/SKILL.md

# Verify it's at the top level
dirname ~/.agents/skills/my-skill/SKILL.md | xargs basename
# Should output: my-skill (not a subdirectory)
```

---

### Issue: Skill appears but doesn't trigger

**Symptoms:**
- Skill shows in list but Claude doesn't use it
- Queries that should match the skill don't activate it

**Possible Causes:**

1. **Description lacks trigger words**
   ```yaml
   ❌ description: "A tool for working with APIs"
   ✅ description: "Test REST APIs with automatic validation. Use when testing endpoints, debugging API responses, or validating schemas."
   ```

2. **Description too vague**
   ```yaml
   ❌ description: "Helps with code"
   ✅ description: "Generate TypeScript interfaces from JSON schemas. Use when creating types, converting schemas, or building API clients."
   ```

**Solution:**
Run the linter to check description quality:
```bash
./scripts/lint-skill.sh ~/.agents/skills/my-skill
```

---

## Frontmatter Issues

### Issue: YAML parse error

**Symptoms:**
- Skill fails to load
- Error messages about YAML syntax

**Common Mistakes:**

1. **Unquoted special characters**
   ```yaml
   ❌ name: API:Builder
   ✅ name: "API:Builder"
   ```

2. **Missing closing dashes**
   ```yaml
   ❌ ---
      name: "My Skill"
      description: "..."
   ✅ ---
      name: "My Skill"
      description: "..."
   ---
   ```

3. **Incorrect indentation**
   ```yaml
   ❌ ---
   name: "My Skill"
    description: "Wrong indent"
   ---
   ✅ ---
   name: "My Skill"
   description: "Correct"
   ---
   ```

**Solution:**
```bash
# Validate YAML syntax
python3 -c "
import re
text = open('SKILL.md').read()
m = re.match(r'^---\n(.*?)\n---', text, re.S)
if m:
    print('YAML OK')
    print(m.group(1))
else:
    print('Invalid YAML frontmatter')
"
```

---

### Issue: Name/description too long

**Symptoms:**
- Warnings about field length
- Skill may be truncated in UI

**Limits:**
- `name`: 64 characters max
- `description`: 1024 characters max

**Solution:**
```bash
# Check field lengths
./scripts/validate-skill.sh ~/.agents/skills/my-skill
```

---

## Hook Issues

### Issue: Hook doesn't execute

**Symptoms:**
- Hook file exists but doesn't run
- No output from hooks

**Possible Causes:**

1. **Not executable**
   ```bash
   chmod +x hooks/pre-task.sh
   ```

2. **Wrong shebang**
   ```bash
   ❌ #!/bin/sh
   ✅ #!/usr/bin/env bash
   ```

3. **Exit with error**
   - Hooks that exit non-zero may block skill execution

**Solution:**
```bash
# Test hook directly
./hooks/pre-task.sh

# Check exit code
echo $?
```

---

### Issue: Hook causes skill to fail

**Symptoms:**
- Skill worked before adding hook
- Error messages from hook

**Debugging:**
```bash
# Add debug output to hook
set -x  # Enable debug
# ... hook code ...
set +x  # Disable debug
```

**Solution:**
Hooks should handle errors gracefully:
```bash
# Non-critical operations shouldn't fail the skill
if ! some_optional_check; then
    echo "Warning: Optional check failed, continuing..."
    # Don't exit 1
fi
```

---

## Script Issues

### Issue: Script permission denied

**Symptoms:**
- `./scripts/setup.sh: Permission denied`

**Solution:**
```bash
chmod +x scripts/*.sh
```

---

### Issue: Script fails silently

**Symptoms:**
- Script runs but produces no output
- Unclear if script succeeded

**Solution:**
Add proper error handling and logging:
```bash
#!/usr/bin/env bash
set -e  # Exit on error
set -o pipefail  # Catch pipe errors

echo "Starting setup..."

if ! some_command; then
    echo "Error: some_command failed"
    exit 1
fi

echo "✓ Setup complete"
```

---

## Content Issues

### Issue: SKILL.md too large

**Symptoms:**
- Skill loads slowly
- Context usage high

**Guidelines:**
- Aim for 2-5KB in SKILL.md
- Externalize large content to `docs/` and `resources/`

**Solution:**
```markdown
<!-- Before: All content in SKILL.md -->
## API Reference
[500 lines of API documentation]

<!-- After: External reference -->
## API Reference
See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete documentation.
```

---

### Issue: Missing critical sections

**Symptoms:**
- Users confused about how to use skill
- Common questions about basic usage

**Required Sections:**
1. `## What This Skill Does` - Overview
2. `## Quick Start` - Fast onboarding
3. `## Troubleshooting` - Common issues

**Solution:**
Run the linter to check for missing sections:
```bash
./scripts/lint-skill.sh ~/.agents/skills/my-skill
```

---

## Validation Issues

### Issue: Name mismatch with directory

**Symptoms:**
- Validation error: "Name should match directory"
- Confusion when referencing skill

**Example:**
```
Directory: my-api-skill
SKILL.md name: "My API Skill"
```

**Solution:**
```bash
# Auto-fix naming
./scripts/fix-skill.sh ~/.agents/skills/my-api-skill
```

---

### Issue: Multiple skills with same name

**Symptoms:**
- Claude loads wrong skill
- Confusing behavior

**Solution:**
Ensure each skill has a unique directory name:
```bash
# List all skill names
find ~/.agents/skills -name "SKILL.md" -exec grep -H "^name:" {} \;
```

---

## Quick Diagnostic Commands

```bash
# Full skill check
./scripts/validate-skill.sh ~/.agents/skills/my-skill

# Quality analysis
./scripts/lint-skill.sh ~/.agents/skills/my-skill

# Auto-fix common issues
./scripts/fix-skill.sh ~/.agents/skills/my-skill

# Test skill structure
./scripts/test-skill.sh ~/.agents/skills/my-skill
```
