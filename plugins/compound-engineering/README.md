# Compound Engineering Plugin
## Orchestration Layer for the Essential 2026 Suite

### Overview

The Compound Engineering Plugin coordinates Debt-Sentinel, Red Team Tribunal, and Spec-Lock into unified, multi-stage workflows. It provides orchestration, metrics tracking, and quality gates for comprehensive code quality management.

### Workflows

#### 1. Safe Edit Workflow
**Three-stage quality gate for individual file edits:**

```
Stage 1: Pre-Edit Validation
  └─ Debt-Sentinel checks for anti-patterns
  └─ BLOCKS edit if critical debt detected

Stage 2: Post-Edit Sync
  └─ Spec-Lock checks documentation alignment
  └─ AUTO-RESOLVES drift if possible

Stage 3: Adversarial Review
  └─ Red Team Tribunal multi-agent review
  └─ REJECTS if consensus not reached
```

#### 2. CI Pipeline Workflow
**Full codebase validation before deployment:**

```
Stage 1: Technical Debt Analysis
  └─ Scan entire codebase for accumulated debt

Stage 2: Critical Path Review
  └─ Tribunal reviews security-critical files

Stage 3: Documentation Health
  └─ Verify all specs are synchronized

Result: DEPLOY_READY or BLOCKED
```

#### 3. Enhancement Pipeline
**Progressive enhancement through 4 quality levels:**

```
Level 1: Basic Implementation
  └─ Anti-pattern checks

Level 2: Performance Optimization
  └─ Optimizer agent review

Level 3: Security Hardening
  └─ Security audit

Level 4: Documentation Sync
  └─ Spec updates
```

### Commands

```bash
# Run safe edit workflow
python3 compound-engineering.py --workflow safe-edit --file src/auth/login.ts

# Run CI pipeline
python3 compound-engineering.py --workflow ci-pipeline --branch main

# Run enhancement pipeline
python3 compound-engineering.py --workflow enhancement --feature "OAuth Integration"

# Show dashboard
python3 compound-engineering.py --dashboard

# Generate metrics report
python3 compound-engineering.py --metrics --days 30
```

### Dashboard

The dashboard displays:
- Recent workflow runs
- 7-day statistics
- Plugin health status
- Overall quality score
- Daily breakdown metrics

### Metrics Tracked

- **Total Workflow Runs**: Number of quality gates executed
- **Block Rate**: Percentage blocked/rejected
- **Average Debt Score**: Mean technical debt score
- **Average Duration**: Workflow execution time
- **Documentation Sync Rate**: Spec-code alignment

### Integration

Add to Agent Zero settings for automatic enforcement:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit(*)|Write(*)",
        "command": "python3 /a0/usr/plugins/compound-engineering/compound-engineering.py --workflow safe-edit --file"
      }
    ]
  }
}
```

### Database Schema

**workflow_runs** table:
- workflow_type: Type of workflow executed
- target: File/branch/feature being processed
- status: APPROVED, BLOCKED, REJECTED, CONDITIONAL
- duration_ms: Execution time
- debt_score: Accumulated debt
- tribunal_verdict: Tribunal consensus
- spec_drifts: Documentation drift count

### Quality Score Calculation

```
Quality Score = (1 - Block Rate) × 100

90-100%: 🌟 EXCELLENT
75-89%:  ✅ GOOD
50-74%:  ⚠️  NEEDS ATTENTION
0-49%:   🔴 CRITICAL
```

### Success Metrics

- **Pre-Edit Blocking**: Catches 100% of critical anti-patterns
- **Tribunal Coverage**: All security-critical files reviewed
- **Doc Sync**: <5% drift rate
- **Pipeline Duration**: <2 minutes for full CI

---

**Part of the Essential 2026 Plugin Suite**