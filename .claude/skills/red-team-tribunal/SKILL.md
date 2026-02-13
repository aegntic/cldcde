---
name: "red-team-tribunal"
description: "Multi-agent adversarial verification system. Use when you need thorough code review, security auditing, or quality validation. Spawns three specialized agents (Skeptic, User Proxy, Optimizer) that must reach consensus before code can be approved."
version: "1.0.0"
author: "Essential 2026 Suite"
tags: ["review", "security", "quality", "multi-agent", "consensus"]
trigger_patterns:
  - "review this code"
  - "security audit"
  - "tribunal review"
  - "multi-agent review"
  - "adversarial review"
  - "approve this PR"
  - "check for issues"
  - "quality review"
  - "before merging"
  - "tribunal"
allowed_tools: ["Bash", "Read", "Write", "Edit"]
---

# Red Team Tribunal: Adversarial Verification

## Overview

The Red Team Tribunal uses Opus 4.6 Agent Teams to create an adversarial review loop that prevents "confident mistakes." Three specialized sub-agents work in parallel to find issues from different perspectives.

## The Tribunal Structure

### 🤔 The Skeptic (Security/Logic)
- **Role**: Security auditor and logic validator
- **Goal**: Find at least one valid issue (must find something)
- **Focus**: Security flaws, logic errors, edge cases, race conditions
- **Confidence Target**: >80%

### 👤 The User Proxy (UX/Edge Cases)
- **Role**: End-user simulator
- **Goal**: Break the feature from a user's perspective
- **Focus**: Usability, invalid inputs, confusing flows, accessibility
- **Tools**: Browser automation, form fuzzing

### ⚡ The Optimizer (Performance)
- **Role**: Performance engineer
- **Goal**: Identify efficiency bottlenecks
- **Focus**: Algorithmic complexity, memory usage, database queries, caching
- **Metrics**: O(n) complexity, response times, resource usage

## When to Use

Activate the Tribunal for:
- Critical code changes (auth, payments, security)
- Before merging pull requests
- When adding new features
- Security-sensitive implementations
- Performance-critical code
- Code that affects multiple users

## Usage

### Trigger Tribunal Review
```bash
# Review a file
python3 /a0/usr/plugins/red-team-tribunal/red-team-tribunal.py --target <file>

# Review a PR
python3 /a0/usr/plugins/red-team-tribunal/red-team-tribunal.py --pr <number>

# Review a commit
python3 /a0/usr/plugins/red-team-tribunal/red-team-tribunal.py --diff <hash>
```

### Understanding Verdicts

**CONSENSUS OPTIONS:**

1. **APPROVED** (All agents pass)
   - Code meets all quality standards
   - Ready to merge

2. **CONDITIONAL** (Concerns raised)
   - Minor issues found
   - Address concerns before merge
   - Can proceed with fixes

3. **REJECTED** (Critical issues)
   - Security vulnerabilities or major flaws
   - Must fix before reconsideration
   - Returns detailed recommendations

## Review Process

### Step 1: Agent Assembly
Three agents spawn in parallel:
```python
agents = ["skeptic", "user_proxy", "optimizer"]
tasks = [spawn_agent(agent, target) for agent in agents]
results = await asyncio.gather(*tasks)
```

### Step 2: Individual Analysis
Each agent analyzes from their specialty:
- **Skeptic**: Scans for vulnerabilities, logic gaps
- **User Proxy**: Attempts to break UX, finds edge cases
- **Optimizer**: Reviews complexity, resource usage

### Step 3: Consensus Building
Agents debate and produce unified verdict:
- Unanimous approval required for pass
- Any rejection blocks merge
- Concerns must be addressed

### Step 4: Report Generation
JSON output includes:
```json
{
  "consensus": "APPROVED|CONDITIONAL|REJECTED",
  "verdicts": [
    {"agent": "skeptic", "verdict": "pass", "confidence": 0.85},
    {"agent": "user_proxy", "verdict": "pass", "confidence": 0.90},
    {"agent": "optimizer", "verdict": "concerns", "confidence": 0.75}
  ],
  "recommendations": [
    "Add input validation",
    "Optimize database query",
    "Add caching layer"
  ]
}
```

## Sample Output

```
🏛️  RED TEAM TRIBUNAL
Target: src/auth/login.ts

📋 AGENT VERDICTS:
  🤔 Skeptic:     ⚠️  CONCERNS (85%)
  👤 User Proxy:  ✅ PASS (90%)
  ⚡ Optimizer:   ⚠️  CONCERNS (75%)

📊 CONSENSUS: CONDITIONAL - Address Concerns

💡 RECOMMENDATIONS:
  1. Add null check at line 45
  2. Implement memoization for expensive calc
  3. Add rate limiting to prevent brute force
```

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Red Team Tribunal Review
  run: |
    python3 red-team-tribunal.py --pr ${{ github.event.pull_request.number }}
```

## Success Metrics

- **Detection Rate**: % of real issues found
- **False Positive Rate**: % of invalid concerns
- **Time to Review**: Average review duration
- **Consensus Time**: Time to reach agreement

## Troubleshooting

### Agents Not Spawning
Check Agent Teams feature is enabled:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Timeout Issues
Increase timeout for complex reviews:
```python
subprocess.run(..., timeout=120)  # 2 minutes
```

---

**Part of the Essential 2026 Plugin Suite**