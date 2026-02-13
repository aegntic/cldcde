---
name: "debt-sentinel"
description: "Architectural pattern enforcer that prevents technical debt. Use when editing code to check for anti-patterns, hardcoded secrets, SQL injection, inline styles, and other code quality issues. Automatically blocks critical violations and logs debt scores."
version: "1.0.0"
author: "Essential 2026 Suite"
tags: ["quality", "security", "debt", "patterns", "enforcement"]
trigger_patterns:
  - "check code quality"
  - "review for anti-patterns"
  - "check debt"
  - "validate architecture"
  - "scan for vulnerabilities"
  - "debt sentinel"
  - "code review"
  - "check for secrets"
  - "validate code"
allowed_tools: ["Bash", "Read", "Edit"]
---

# Debt-Sentinel: Technical Debt Prevention

## Overview

Debt-Sentinel is an architectural enforcer that prevents "vibe coding" slop by blocking anti-patterns before they enter the codebase. It uses PreToolUse hooks to intercept problematic code and maintains a debt ledger for accountability.

## When to Use

Activate this skill when:
- Writing or editing code files
- Reviewing code for quality issues
- Checking for security vulnerabilities
- Validating architectural compliance
- Before committing changes

## Anti-Patterns Detected

### Critical (Blocks Edit)
- **Hardcoded Secrets**: API keys, passwords, tokens in source code
- **Inline SQL**: SQL injection vulnerabilities via string concatenation
- **Direct DOM Manipulation**: Bypassing React's virtual DOM

### Warning (Logs Debt)
- **Inline Styles**: Using style={} instead of CSS classes
- **Console Logging**: Using console.log instead of structured logging
- **Magic Numbers**: Unnamed numeric literals
- **Service Layer Bypass**: Direct HTTP calls bypassing abstractions

### Info (Tracked)
- **TODO Without Tickets**: Unreferenced TODO comments
- **Poor Naming**: Non-descriptive variable names

## Usage

### Automatic Mode
When integrated with Agent Zero hooks, Debt-Sentinel automatically scans every file edit:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit(*)|Write(*)",
        "command": "python3 /a0/usr/plugins/debt-sentinel/debt-sentinel.py --check"
      }
    ]
  }
}
```

### Manual Mode
```bash
# Check a file
python3 /a0/usr/plugins/debt-sentinel/debt-sentinel.py --check <file>

# View session debt report
python3 /a0/usr/plugins/debt-sentinel/debt-sentinel.py --session-end
```

### Understanding Debt Scores

Each violation has an "Interest Rate" (1-10):
- Critical: 8-10 points
- Warning: 4-7 points
- Info: 1-3 points

**Session Debt Score** accumulates across all edits. High scores trigger cleanup prompts.

## Configuration

Edit `/a0/usr/plugins/debt-sentinel/ANTI_PATTERNS.md` to customize:

```yaml
### CUSTOM-001: Your Pattern Name
**Severity:** critical
**Interest Rate:** 9
**Regex:** your-regex-pattern
**Description:** What this pattern detects
**Fix Suggestion:** How to resolve
```

## Debt Ledger

All violations are logged to `/a0/usr/plugins/debt-sentinel/DEBT.md`:

```markdown
## Debt Entry - 2026-02-12 12:00:00
**Pattern:** CRITICAL-001
**Severity:** critical
**File:** src/api/auth.js
**Debt Score:** 10
**Description:** Hardcoded API key detected
```

## Integration

Works seamlessly with:
- **Red Team Tribunal**: Security-focused adversarial review
- **Spec-Lock**: Documentation synchronization
- **Compound Engineering**: Multi-stage workflow orchestration

## Success Metrics

- **Block Rate**: % of edits blocked due to critical violations
- **Debt Trend**: Session debt scores over time
- **Resolution Time**: Average time to fix violations
- **Override Rate**: % of blocks that users override (should be <5%)

## Troubleshooting

### Permission Denied
```bash
chmod +x /a0/usr/plugins/debt-sentinel/debt-sentinel.py
```

### Pattern Not Detecting
Check regex syntax in ANTI_PATTERNS.md:
```python
import re
pattern = re.compile(r'your-regex', re.IGNORECASE)
```

---

**Part of the Essential 2026 Plugin Suite**