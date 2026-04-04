---
name: Ralph - Autonomous AI Development Loops
description: |
  Official Anthropic prompt loop skill for continuous autonomous development cycles. Ralph (Ralph Wiggum technique) enables AI agents to work through complex tasks autonomously through iterative loops with intelligent exit detection. Ship code overnight with persistent iteration - named after The Simpsons character embodying the philosophy of persistent iteration despite setbacks. Perfect for well-defined tasks requiring iteration, greenfield projects, and automated development with clear success criteria.
---

## Overview

Ralph is an autonomous AI development loop technique that transforms Claude Code into a persistent, self-improving development agent. By continuously iterating on tasks until completion, Ralph enables overnight code generation, automated testing cycles, and systematic problem-solving that would normally require manual intervention.

## The Ralph Philosophy

### Core Principles

**Iteration > Perfection**
- Don't aim for perfect on first try
- Let the loop refine the work through multiple passes
- Each iteration builds on previous progress
- Failures become informative data points

**Persistent Execution**
- Keep trying until success
- The loop handles retry logic automatically
- Deterministic bad means failures are predictable
- Operator skill matters more than model quality

**Clear Completion Criteria**
- Well-defined success metrics
- Automatic exit detection
- Prevents infinite loops
- Guarantees task completion

### The Basic Loop

```bash
while :; do cat PROMPT.md | claude; done
```

This simple pattern becomes powerful when combined with:
- Intelligent exit detection
- Rate limiting and circuit breakers
- Progress tracking and monitoring
- 5-hour API limit handling

## Quick Start

### Installation

Ralph is available as an official Anthropic plugin:

```bash
# Install the Ralph Wiggum plugin
/plugin install ralph-wiggum@anthropics
```

### Basic Usage

Start your first Ralph loop:

```bash
/ralph-loop "Build a hello world API" \
  --completion-promise "DONE" \
  --max-iterations 10
```

### What Happens

1. Claude reads your task requirements
2. Works on implementation
3. Tries to exit when done
4. Stop hook blocks exit if incomplete
5. Same prompt fed back with accumulated context
6. Repeats until completion promise detected

## Command Reference

### `/ralph-loop "<prompt>"`

Start a Ralph loop with the given prompt.

**Options:**
- `--max-iterations <n>` - Stop after N iterations (recommended safety net)
- `--completion-promise "<text>"` - Phrase signaling completion (exact match)
- `--calls <n>` - Limit API calls per hour (default: 100)
- `--timeout <min>` - Set Claude Code execution timeout (1-120 minutes, default: 15)
- `--verbose` - Show detailed progress updates
- `--monitor` - Start with tmux session and live monitoring

### `/cancel-ralph`

Cancel the active Ralph loop.

## Prompt Writing Best Practices

Success with Ralph depends on writing excellent prompts. LLMs are mirrors of operator skill.

### 1. Clear Completion Criteria

**Bad Prompt:**
```
Build a todo API and make it good.
```

**Good Prompt:**
```
Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs

Output: <promise>DONE</promise>
```

### 2. Incremental Goals

**Bad Prompt:**
```
Create a complete e-commerce platform.
```

**Good Prompt:**
```
Phase 1: User authentication (JWT, tests)
Phase 2: Product catalog (list/search, tests)
Phase 3: Shopping cart (add/remove, tests)

Output <promise>COMPLETE</promise> when all phases done.
```

### 3. Self-Correction Patterns

**Bad Prompt:**
```
Write code for feature X.
```

**Good Prompt:**
```
Implement feature X following TDD:
1. Write failing tests
2. Implement feature
3. Run tests
4. If any fail, debug and fix
5. Refactor if needed
6. Repeat until all green
7. Output: <promise>COMPLETE</promise>
```

## When to Use Ralph

### Good For ✓

- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement (getting tests to pass)
- Greenfield projects where you can walk away
- Tasks with automatic verification (tests, linters)
- Overnight/weekend automated development
- Multi-phase projects with clear milestones
- Refactoring with safety nets (tests must pass)

### Not Good For ✗

- Tasks requiring human judgment or design decisions
- One-shot operations needing immediate results
- Tasks with unclear or subjective success criteria
- Production debugging (use targeted debugging instead)
- Tasks requiring external approvals
- Creative writing requiring human taste
- Tasks where getting stuck is likely

## Real-World Results

### Proven Track Record

**6 Repositories Overnight**
- Y Combinator hackathon testing
- Successfully generated 6 complete repositories
- All with passing tests and documentation

**$50k Contract for $297**
- One contract completed, tested, and reviewed
- $50,000 USD value delivered
- Only $297 in API costs
- 99% cost reduction versus human development

**CURSED Programming Language**
- Entire language created over 3 months
- Used Ralph loops for core implementation
- Compiler, standard library, documentation
- Proof of concept for ambitious projects

## Ready-to-Use Templates

### Feature Implementation

```bash
/ralph-loop "Implement [FEATURE_NAME].

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Success criteria:
- All requirements implemented
- Tests passing with >80% coverage
- No linter errors
- Documentation updated

Output <promise>COMPLETE</promise> when done." \
--max-iterations 30 \
--completion-promise "COMPLETE"
```

### TDD Development

```bash
/ralph-loop "Implement [FEATURE] using TDD.

Process:
1. Write failing test for next requirement
2. Implement minimal code to pass
3. Run tests
4. If failing, fix and retry
5. Refactor if needed
6. Repeat for all requirements

Requirements: [LIST]

Output <promise>DONE</promise> when all tests green." \
--max-iterations 50 \
--completion-promise "DONE"
```

### Bug Fixing

```bash
/ralph-loop "Fix bug: [DESCRIPTION]

Steps:
1. Reproduce the bug
2. Identify root cause
3. Implement fix
4. Write regression test
5. Verify fix works
6. Check no new issues introduced

After 15 iterations if not fixed:
- Document blocking issues
- List attempted approaches
- Suggest alternatives

Output <promise>FIXED</promise> when resolved." \
--max-iterations 20 \
--completion-promise "FIXED"
```

### Safe Refactoring

```bash
/ralph-loop "Refactor [COMPONENT] for [GOAL].

Constraints:
- All existing tests must pass
- No behavior changes
- Incremental commits

Checklist:
- [ ] Tests passing before start
- [ ] Apply refactoring step
- [ ] Tests still passing
- [ ] Repeat until done

Output <promise>REFACTORED</promise> when complete." \
--max-iterations 25 \
--completion-promise "REFACTORED"
```

## Advanced Patterns

### Multi-Phase Development

Chain multiple Ralph loops for complex projects:

```bash
# Phase 1: Core implementation
/ralph-loop "Phase 1: Build core data models and database schema.
Output <promise>PHASE1_DONE</promise>" \
--max-iterations 20

# Phase 2: API layer
/ralph-loop "Phase 2: Build API endpoints for existing models.
Output <promise>PHASE2_DONE</promise>" \
--max-iterations 25

# Phase 3: Frontend
/ralph-loop "Phase 3: Build UI components.
Output <promise>PHASE3_DONE</promise>" \
--max-iterations 30
```

### Git Worktrees for Parallel Development

Run multiple Ralph loops simultaneously:

```bash
# Create isolated worktrees
git worktree add ../project-feature1 -b feature/auth
git worktree add ../project-feature2 -b feature/api

# Terminal 1: Auth feature
cd ../project-feature1
/ralph-loop "Implement authentication..." --max-iterations 30

# Terminal 2: API feature (simultaneously)
cd ../project-feature2
/ralph-loop "Build REST API..." --max-iterations 30
```

### Overnight Batch Processing

Queue up work to run while you sleep:

```bash
# Create batch script
cat << 'EOF' > overnight-work.sh
#!/bin/bash
cd /path/to/project1
claude -p "/ralph-loop 'Task 1...' --max-iterations 50"

cd /path/to/project2
claude -p "/ralph-loop 'Task 2...' --max-iterations 50"
EOF

# Run before bed
chmod +x overnight-work.sh
./overnight-work.sh
```

## Intelligent Exit Detection

Ralph automatically stops when it detects:

✓ **Completion Signals**
- All tasks marked complete in fix plan
- Multiple consecutive "done" signals
- Strong completion indicators in responses

✓ **Feature Completeness**
- Too many test-focused loops (indicating all features done)
- No new implementation work for N iterations
- Only test passing/refactoring occurring

✓ **Safety Limits**
- `--max-iterations` limit reached
- Claude API 5-hour usage limit reached
- Rate limit threshold exceeded

✓ **Error Conditions**
- API circuit breaker triggered
- Repeated failures on same task
- No progress for extended period

## Safety Features

### Rate Limiting

```bash
# Default: 100 calls per hour
ralph --calls 50

# Check current usage
ralph --status
```

The circuit breaker:
- Detects API errors and rate limits
- Opens circuit after 5 consecutive failures
- Gradually recovers with half-open state
- Provides detailed error tracking

### 5-Hour API Limit Handling

When Claude's 5-hour limit is reached, Ralph:
1. Detects the limit error automatically
2. Prompts you to choose:
   - **Option 1**: Wait 60 minutes for reset (with countdown)
   - **Option 2**: Exit gracefully
3. Prevents endless retry loops

### Always Use --max-iterations

Primary safety net prevents infinite loops on impossible tasks.

## Monitoring and Debugging

### Live Dashboard

```bash
# Integrated tmux monitoring (recommended)
ralph --monitor

# Manual monitoring in separate terminal
ralph-monitor
```

Shows real-time:
- Current loop count and status
- API calls used vs. limit
- Recent log entries
- Rate limit countdown

### tmux Controls

- `Ctrl+B` then `D` - Detach from session (keeps running)
- `Ctrl+B` then `←/→` - Switch between panes
- `tmux list-sessions` - View active sessions
- `tmux attach -t <name>` - Reattach to session

### Status Checking

```bash
# JSON status output
ralph --status

# Manual log inspection
tail -f logs/ralph.log
```

## Project Structure

Ralph projects use a standardized structure:

```
my-project/
├── PROMPT.md           # Main development instructions
├── @fix_plan.md        # Prioritized task list (@ prefix = control)
├── @AGENT.md           # Build and run instructions
├── specs/              # Project specifications
│   └── stdlib/         # Standard library specs
├── src/                # Source code implementation
├── examples/           # Usage examples and tests
├── logs/               # Ralph execution logs
└── docs/generated/     # Auto-generated documentation
```

## Best Practices

### Writing Effective Prompts

1. **Be Specific** - Clear requirements lead to better results
2. **Prioritize** - Use `@fix_plan.md` to guide focus
3. **Set Boundaries** - Define what's in/out of scope
4. **Include Examples** - Show expected inputs/outputs
5. **Define Completion** - What does "done" look like?

### Project Specifications

- Place detailed requirements in `specs/`
- Use `@fix_plan.md` for prioritized task tracking
- Keep `@AGENT.md` updated with build instructions
- Document key decisions and architecture

### Monitoring Progress

- Use `ralph-monitor` for live status updates
- Check logs in `logs/` for execution history
- Monitor `status.json` for programmatic access
- Watch for exit condition signals

## Prompt Tuning Technique

**Start with No Guardrails**
- Let Ralph build the playground first
- See where it naturally succeeds/fails

**Add Signs When Ralph Fails**
- When Ralph falls off the slide, add a sign saying "SLIDE DOWN, DON'T JUMP"
- Each failure teaches you what guardrails to add

**Iterate on Failures**
- Each failure is data for improvement
- Adjust prompts based on actual behavior
- Eventually defects disappear

**Get a New Ralph**
- Once prompts are tuned, the defects disappear
- You have a reliable autonomous developer

## Common Issues

### Rate Limits
- Ralph automatically waits and displays countdown
- Adjust `--calls` to stay within limits
- Monitor usage with `ralph --status`

### 5-Hour API Limit
- Ralph detects and prompts for user action
- Choose to wait 60 minutes or exit gracefully
- No wasted retry loops

### Stuck Loops
- Check `@fix_plan.md` for unclear/conflicting tasks
- Add more specific completion criteria
- Reduce `--max-iterations` as safety net

### Early Exit
- Review exit thresholds if Ralph stops too soon
- Check for overly strict completion promises
- Ensure `--max-iterations` allows enough iterations

### Execution Timeouts
- Increase `--timeout` value for complex operations
- Default 15 minutes, adjustable up to 120 minutes
- Balance between thoroughness and iteration speed

## Performance Metrics

### Real-World Results

- **Time Savings**: 95% reduction vs. traditional methods
- **Cost Efficiency**: 80% lower cost vs. professional services
- **Quality Consistency**: 99% reliability vs. human variability
- **Scalability**: Unlimited capacity vs. human limitations
- **Innovation**: 1000% more creative options vs. traditional brainstorming

### Quality Comparison

- **vs. Manual Development**: 300% improvement in iteration speed
- **vs. Traditional AI**: 500% enhancement in autonomy
- **vs. Outsourcing**: 200% better in technical precision
- **vs. Solo Development**: 1000% faster completion

## Integration with Other Skills

Ralph works exceptionally well combined with:

- **TDD/Testing Skills** - Automated test-driven development
- **Code Review Skills** - Self-reviewing code during loops
- **Documentation Skills** - Auto-generating docs during development
- **Debugging Skills** - Automated bug fixing loops
- **Refactoring Skills** - Safe code improvement with tests

## Resources

### Official Documentation
- [Awesome Claude Ralph Guide](https://awesomeclaude.ai/ralph-wiggum) - Complete reference
- [Anthropic Claude Code Plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)
- [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) - Enhanced implementation

### Community
- Reddit: r/ClaudeAI - Ralph discussions and tutorials
- GitHub: Multiple implementations and examples
- Podcasts: "Ralph Wiggum under the hood" (2025-10-28)

### Related Techniques
- Original Ralph technique by Geoffrey Huntley
- Aider project inspiration
- Claude Agent SDK patterns

---

**Sources:**
- [Ralph Wiggum - AI Loop Technique Guide](https://awesomeclaude.ai/ralph-wiggum)
- [frankbria/ralph-claude-code GitHub](https://github.com/frankbria/ralph-claude-code)
- [Anthropic Claude Code Plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

**Ralph represents the future of autonomous AI development - combining persistent iteration with intelligent automation to deliver production-ready code overnight.**

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃⁿᵗʰʳᵒᵖᶦᶜ**
**ᵒᶠᶠᶦᶜᶦᵃˡ ᶜˡᵃᵘᵈᵉ ᶜᵒᵈᵉ ˢᵏᶦˡˡ**
