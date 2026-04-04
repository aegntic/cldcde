---
description: Run Ultra Swarm for multi-agent coordination and complex problem solving
---
# Ultra Swarm - Multi-Agent Coordination Workflow

When this workflow is invoked, activate multiple specialized agent perspectives to analyze a problem and build consensus.

## Step 1: Define the Problem

Clearly state the problem or decision to be analyzed:

```markdown
## Problem Statement
[What needs to be decided or solved]

## Context
[Background information]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Success Criteria
[How we'll know we have a good solution]
```

## Step 2: Activate Agent Perspectives

For the given problem, analyze from each of these perspectives:

### 🏗️ Architect Perspective
Ask: "How should this be structured?"
- System design implications
- Component relationships
- Scalability considerations
- Technical patterns to apply

### 🔍 Research Perspective
Ask: "What do we need to know?"
- Existing solutions to similar problems
- Best practices and patterns
- Prior art and alternatives
- External constraints

### 💻 Coder Perspective
Ask: "How do we build this?"
- Implementation approach
- Code structure and organization
- Effort estimation
- Technical debt implications

### 🧪 Tester Perspective
Ask: "What could go wrong?"
- Edge cases and failure modes
- Testing strategy needed
- Risk scenarios
- Regression concerns

### 🤝 Reviewer Perspective
Ask: "Is this correct and complete?"
- Quality concerns
- Security implications
- Performance issues
- Documentation needs

### 📝 Documenter Perspective
Ask: "How do we explain this?"
- User-facing documentation
- Technical documentation
- Decision rationale
- Knowledge transfer

## Step 3: Gather Perspectives

For each relevant agent, document their analysis:

```markdown
## Agent Analysis

### Architect
**Observations**: [What they notice]
**Recommendations**: [What they suggest]
**Concerns**: [Risks they identify]

### Research
**Observations**: [What they found]
**Recommendations**: [What they suggest]
**Concerns**: [Gaps or unknowns]

### Coder
**Observations**: [Implementation notes]
**Recommendations**: [Approach suggestion]
**Concerns**: [Technical challenges]

### Tester
**Observations**: [Risk analysis]
**Recommendations**: [Testing approach]
**Concerns**: [Failure scenarios]

### Reviewer
**Observations**: [Quality assessment]
**Recommendations**: [Improvements]
**Concerns**: [Issues found]

### Documenter
**Observations**: [Communication needs]
**Recommendations**: [Documentation plan]
**Concerns**: [Knowledge gaps]
```

## Step 4: Build Consensus

Synthesize the perspectives:

### 4.1 Identify Agreements
- Where do multiple agents align?
- What are the strongest recommendations?

### 4.2 Surface Conflicts
- Where do agents disagree?
- What trade-offs exist?

### 4.3 Resolve Conflicts
For each conflict:
1. Evaluate the evidence for each position
2. Consider the trade-offs
3. Make a decision with clear rationale
4. Document dissenting views

## Step 5: Produce Consensus Output

Create a final recommendation:

```markdown
## Consensus Decision

### Recommended Approach
[The agreed-upon solution]

### Rationale
[Why this approach was chosen]

### Trade-offs Accepted
[What we're giving up]

### Dissenting Views
[Any unresolved disagreements]

### Action Items
- [ ] [Task 1] - Owner: [who]
- [ ] [Task 2] - Owner: [who]

### Risks & Mitigations
| Risk | Mitigation Strategy |
|------|---------------------|
| [Risk 1] | [How to handle] |
| [Risk 2] | [How to handle] |
```

## Step 6: Present to User

Present the consensus to the user:
1. Summarize the problem analyzed
2. Present the recommended approach
3. Explain key trade-offs
4. List action items
5. Ask for approval or feedback

---

## Usage Examples

For architecture decisions:
```
/ultra-swarm "Design the data model for a multi-tenant SaaS application"
```

For complex implementations:
```
/ultra-swarm "Implement real-time notifications across web and mobile"
```

For technical decisions:
```
/ultra-swarm "Choose between REST and GraphQL for our API"
```

For risk assessment:
```
/ultra-swarm "Evaluate the security implications of adding OAuth login"
```

---

## Agent Selection Guide

Not all problems need all agents. Select based on the problem type:

| Problem Type | Recommended Agents |
|--------------|-------------------|
| Architecture design | Architect, Research, Reviewer |
| Implementation | Coder, Tester, Reviewer |
| Bug investigation | Coder, Tester, Research (use /fpef) |
| Documentation | Documenter, Research, Reviewer |
| Security review | Tester, Reviewer, Research |
| Full project | All agents |

---

## Integration with Other Workflows

- Use `/ultraplan-pro` first if this is part of a larger project
- Use `/fpef` for debugging issues discovered during analysis
- Document decisions in `walkthrough.md` after completion