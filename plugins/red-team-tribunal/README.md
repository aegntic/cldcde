# Red Team Tribunal Skill
# Multi-Agent Adversarial Verification System

## Overview

The Red Team Tribunal utilizes Opus 4.6 Agent Teams to create an adversarial review loop that prevents "confident mistakes" through multi-agent consensus.

## The Tribunal Structure

Three specialized sub-agents work in parallel:

### 1. The Skeptic (Security/Logic)
- **Role**: Security auditor and logic validator
- **Goal**: Find at least one issue (vulnerability or logic gap)
- **Focus**: Security flaws, edge cases, incorrect assumptions
- **Success Criteria**: Must identify at least one valid concern

### 2. The User Proxy (UX/Edge Cases)
- **Role**: End-user simulator
- **Goal**: Break the feature from a user's perspective
- **Focus**: Usability issues, edge cases, unexpected inputs
- **Tools**: Browser automation, form fuzzing, state exploration

### 3. The Optimizer (Performance)
- **Role**: Performance engineer
- **Goal**: Identify efficiency bottlenecks
- **Focus**: Algorithmic complexity, resource usage, scalability
- **Metrics**: O(n) complexity, memory allocation, response times

## Usage

### Trigger Tribunal Review:
```bash
/tribunal --target <file_or_feature>
/tribunal --pr <github_pr_number>
/tribunal --diff <commit_hash>
```

### Consensus Requirements:
- Unanimous vote required to pass
- Any rejection blocks completion
- Auto-generates fix suggestions

## Integration

- **GitHub Actions**: Auto-trigger on PR open
- **Pre-commit hooks**: Block commits without tribunal approval
- **Agent Zero**: Native skill integration

## Configuration

Edit `tribunal-config.yaml` to customize:
- Agent timeout limits
- Consensus thresholds
- Required review types per file extension
- Auto-fix suggestions