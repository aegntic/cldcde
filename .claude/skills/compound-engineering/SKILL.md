---
name: "compound-engineering"
description: "Orchestration layer that coordinates Debt-Sentinel, Red Team Tribunal, and Spec-Lock into unified workflows. Use when you need comprehensive quality assurance with multiple validation stages. Provides safe-edit workflows, CI pipelines, enhancement pipelines, and engineering metrics dashboard."
version: "1.0.0"
author: "Essential 2026 Suite"
tags: ["orchestration", "workflows", "quality", "ci-cd", "engineering"]
trigger_patterns:
  - "run workflow"
  - "quality gate"
  - "compound engineering"
  - "safe edit"
  - "ci pipeline"
  - "enhancement pipeline"
  - "engineering dashboard"
  - "metrics"
  - "quality check"
  - "validate changes"
allowed_tools: ["Bash", "Read", "Write", "Edit"]
---

# Compound Engineering: Workflow Orchestration

## Overview

Compound Engineering orchestrates the Essential 2026 Plugin Suite (Debt-Sentinel, Red Team Tribunal, Spec-Lock) into unified, multi-stage workflows. It provides comprehensive quality gates and metrics tracking.

## Workflows

### 1. Safe Edit Workflow ⭐ Most Popular
**Three-stage quality gate for individual file edits**

```
Stage 1: Pre-Edit Validation (Debt-Sentinel)
  └─ BLOCKS critical anti-patterns
  └─ Scores technical debt

Stage 2: Post-Edit Sync (Spec-Lock)
  └─ Detects documentation drift
  └─ Auto-resolves if possible

Stage 3: Adversarial Review (Red Team Tribunal)
  └─ Multi-agent consensus required
  └─ REJECTS if concerns not addressed
```

**Usage:**
```bash
python3 /a0/usr/plugins/compound-engineering/compound-engineering.py \
  --workflow safe-edit --file src/auth/login.ts
```

**Outcomes:**
- **APPROVED**: All stages passed → Ready to merge
- **BLOCKED**: Critical debt detected → Must fix
- **CONDITIONAL**: Minor concerns → Address then merge
- **REJECTED**: Tribunal rejected → Significant rework needed

### 2. CI Pipeline Workflow
**Pre-deployment validation for entire codebase**

```
Stage 1: Technical Debt Analysis
  └─ Scan all files for accumulated debt
  └─ Calculate aggregate scores

Stage 2: Critical Path Review
  └─ Tribunal reviews security files
  └─ Auth, payment, API validation

Stage 3: Documentation Health
  └─ Verify all specs synchronized
  └─ Check for drift across codebase

Result: DEPLOY_READY or BLOCKED
```

**Usage:**
```bash
python3 /a0/usr/plugins/compound-engineering/compound-engineering.py \
  --workflow ci-pipeline --branch main
```

### 3. Enhancement Pipeline 🚀 Progressive Quality
**Four-level enhancement for new features**

```
Level 1: Basic Implementation
  └─ Anti-pattern checks (Debt-Sentinel)
  └─ Clean architecture validation

Level 2: Performance Optimization
  └─ Algorithm review
  └─ Resource usage analysis
  └─ Caching opportunities

Level 3: Security Hardening
  └─ Vulnerability scan
  └─ Input validation
  └─ Rate limiting

Level 4: Documentation Sync
  └─ Update all affected specs
  └─ Generate migration guides
  └─ Verify sync status
```

**Usage:**
```bash
python3 /a0/usr/plugins/compound-engineering/compound-engineering.py \
  --workflow enhancement --feature "OAuth Integration"
```

## Dashboard & Metrics

### Real-Time Dashboard
```bash
python3 /a0/usr/plugins/compound-engineering/compound-engineering.py --dashboard
```

**Shows:**
- Recent workflow runs
- 7-day statistics
- Plugin health status
- Overall quality score

### Quality Score
```
Quality Score = (1 - Block Rate) × 100

90-100%: 🌟 EXCELLENT
75-89%:  ✅ GOOD
50-74%:  ⚠️ NEEDS ATTENTION
0-49%:   🔴 CRITICAL
```

### Tracked Metrics
- **Total Workflow Runs**: Quality gates executed
- **Block/Rejection Rate**: % stopped by issues
- **Average Debt Score**: Mean technical debt
- **Average Duration**: Execution time
- **Documentation Sync Rate**: Spec alignment

## When to Use

### Use Safe Edit When:
- Editing individual files
- Making quick changes
- Need immediate feedback
- Want automatic blocking

### Use CI Pipeline When:
- Preparing deployment
- Merging feature branches
- Validating releases
- Checking codebase health

### Use Enhancement Pipeline When:
- Building new features
- Want progressive quality
- Need comprehensive validation
- Multiple quality levels desired

## Integration

### Agent Zero Hooks
Add to `settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit(*)|Write(*)",
        "command": "python3 /a0/usr/plugins/compound-engineering/compound-engineering.py --workflow safe-edit --file"
      }
    ],
    "PostToolUse": [
      {
        "command": "python3 /a0/usr/plugins/compound-engineering/compound-engineering.py --dashboard"
      }
    ]
  }
}
```

### GitHub Actions
```yaml
name: Quality Gates
on: [pull_request]
jobs:
  tribunal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Compound Engineering
        run: |
          python3 compound-engineering.py \
            --workflow ci-pipeline --branch ${{ github.head_ref }}
```

## Sample Output

### Safe Edit - Approved
```
🔧 COMPOUND ENGINEERING: Safe Edit Workflow
Target: src/auth/login.ts

📋 Stage 1: Pre-Edit Validation
✅ Passed: No architectural violations

📋 Stage 2: Documentation Sync
✅ In sync

📋 Stage 3: Adversarial Review
  🤔 Skeptic:     ✅ PASS (92%)
  👤 User Proxy:  ✅ PASS (88%)
  ⚡ Optimizer:   ✅ PASS (85%)

📊 CONSENSUS: APPROVED
Status: Code ready for merge
```

### Enhancement - Complete
```
🔧 COMPOUND ENGINEERING: Enhancement Pipeline
Feature: API Rate Limiting

📋 Level 1: Basic Implementation ✅
📋 Level 2: Performance Optimization ✅
📋 Level 3: Security Hardening ✅
📋 Level 4: Documentation Sync ✅

🎉 Feature enhanced through all 4 quality levels!
```

### Dashboard
```
╔════════════════════════════════════════════════╗
║      COMPOUND ENGINEERING DASHBOARD            ║
╚════════════════════════════════════════════════╝

📊 RECENT WORKFLOW RUNS:
✅ safe-edit   APPROVED     2026-02-12 1.2s
❌ safe-edit   BLOCKED      2026-02-12 0.3s
✅ enhancement COMPLETE     2026-02-12 4.5s

🎯 OVERALL QUALITY SCORE: 93.3%
Status: 🌟 EXCELLENT
```

## Database Schema

SQLite database tracks workflows:
```sql
CREATE TABLE workflow_runs (
    workflow_type TEXT,
    target TEXT,
    status TEXT,        -- APPROVED, BLOCKED, REJECTED
    duration_ms INTEGER,
    debt_score INTEGER,
    tribunal_verdict TEXT,
    timestamp TIMESTAMP
);
```

## Success Metrics

- **Gate Effectiveness**: % of real issues caught
- **False Positive Rate**: % of unnecessary blocks
- **Developer Velocity**: Time from edit to approval
- **Quality Trend**: Score improvement over time

## Commands Reference

```bash
# Workflows
--workflow safe-edit --file <path>
--workflow ci-pipeline --branch <branch>
--workflow enhancement --feature <name>

# Reporting
--dashboard                    # Show live dashboard
--metrics --days 30           # Generate metrics report

# Help
--help                        # Show all options
```

## Troubleshooting

### Workflow Stuck
Check individual plugins:
```bash
python3 /a0/usr/plugins/debt-sentinel/debt-sentinel.py --check <file>
```

### Metrics Not Updating
Verify database:
```bash
docker exec agent-zero sqlite3 /a0/usr/plugins/compound-engineering/engineering_metrics.db
```

### Slow Execution
Agents may timeout on large files. Adjust in script:
```python
subprocess.run(..., timeout=120)  # Increase from 60
```

---

**Part of the Essential 2026 Plugin Suite**