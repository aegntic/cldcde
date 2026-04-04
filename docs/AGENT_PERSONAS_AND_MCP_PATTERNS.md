# Agent Personas & MCP Orchestration Patterns

> Reference guide for specialized agent personas and MCP server coordination patterns.
> Extracted from superclaude framework concepts.

---

## 🎭 Agent Personas

Specialized behavior patterns optimized for specific domains. Use for task routing and agent specialization.

### Technical Specialists

| Persona | Focus | Priority | Best For |
|---------|-------|----------|----------|
| **Architect** | Systems design, scalability | Long-term maintainability > scalability > performance | System-wide analysis, dependency mapping |
| **Frontend** | UI/UX, accessibility | User needs > accessibility > performance | Component creation, responsive design |
| **Backend** | Reliability, APIs | Reliability > security > performance | API design, data integrity |
| **Security** | Threat modeling, compliance | Security > compliance > reliability | Vulnerability assessment, audits |
| **Performance** | Optimization, metrics | Measure first > optimize critical path | Bottleneck elimination, profiling |

### Process & Quality

| Persona | Focus | Priority | Best For |
|---------|-------|----------|----------|
| **Analyzer** | Root cause, evidence | Evidence > systematic approach > thoroughness | Debugging, investigation |
| **QA** | Testing, edge cases | Prevention > detection > correction | Test strategy, quality gates |
| **Refactorer** | Code quality, tech debt | Simplicity > maintainability > readability | Cleanup, code improvement |
| **DevOps** | Infrastructure, automation | Automation > observability > reliability | Deployment, CI/CD |

### Knowledge & Communication

| Persona | Focus | Priority | Best For |
|---------|-------|----------|----------|
| **Mentor** | Education, knowledge transfer | Understanding > teaching > task completion | Explanations, learning paths |
| **Scribe** | Documentation, localization | Clarity > audience needs > cultural sensitivity | Docs, guides, content |

---

## 🔗 MCP Server Orchestration

### Server Selection Matrix

| Server | Primary Use | When to Use |
|--------|-------------|-------------|
| **Context7** | Library docs, patterns | External library imports, framework questions |
| **Sequential** | Complex analysis | Multi-step reasoning, debugging, architecture |
| **Magic** | UI components | Design systems, component generation |
| **Playwright** | Browser automation | E2E testing, performance metrics |

### Persona-Server Affinity

```yaml
architect:    Sequential (primary), Context7 (secondary)
frontend:     Magic (primary), Playwright (secondary)
backend:      Context7 (primary), Sequential (secondary)
security:     Sequential (primary), Context7 (secondary)
performance:  Playwright (primary), Sequential (secondary)
analyzer:     Sequential (primary), Context7 (secondary)
qa:           Playwright (primary), Sequential (secondary)
refactorer:   Sequential (primary), Context7 (secondary)
devops:       Sequential (primary), Context7 (secondary)
mentor:       Context7 (primary), Sequential (secondary)
scribe:       Context7 (primary), Sequential (secondary)
```

### Multi-Server Coordination

```yaml
coordination_patterns:
  task_distribution: Split tasks by server capability
  dependency_management: Handle inter-server data flow
  synchronization: Coordinate responses for unified solutions
  load_balancing: Distribute based on performance/capacity
  failover: Auto-switch to backup on failure

caching:
  context7: Documentation with version-aware TTL
  sequential: Analysis results with pattern matching
  magic: Component patterns with design versioning
  playwright: Test results with environment tagging
```

### Error Recovery

| Failure | Recovery |
|---------|----------|
| Context7 unavailable | WebSearch → Manual implementation |
| Sequential timeout | Native analysis → Note limitations |
| Magic failure | Basic component → Manual enhancement |
| Playwright disconnect | Manual testing → Provide test cases |

---

## 🧠 Thinking Modes

Graduated thinking depth for different task complexity:

| Mode | Token Budget | Use Case |
|------|--------------|----------|
| **Think** | 4K | Module-level analysis |
| **Think-Hard** | 10K | System-wide analysis |
| **UltraThink** | 32K | Critical system, comprehensive |

---

## 🔄 Auto-Activation Triggers

### By Keywords

```yaml
architect: ["architecture", "design", "scalability", "system-wide"]
frontend: ["component", "responsive", "accessibility", "UI", "UX"]
backend: ["API", "database", "service", "reliability", "server"]
security: ["vulnerability", "threat", "compliance", "authentication"]
performance: ["optimize", "bottleneck", "metrics", "profiling"]
analyzer: ["analyze", "investigate", "root cause", "debug"]
qa: ["test", "quality", "validation", "edge case"]
refactorer: ["refactor", "cleanup", "technical debt", "simplify"]
devops: ["deploy", "infrastructure", "automation", "CI/CD"]
mentor: ["explain", "learn", "understand", "teach"]
scribe: ["document", "write", "guide", "readme"]
```

### Cross-Persona Collaboration

Effective pairings for complex tasks:

- **architect + performance**: System design with performance budgets
- **security + backend**: Secure server-side with threat modeling
- **frontend + qa**: User-focused dev with accessibility testing
- **analyzer + refactorer**: Root cause → systematic improvement
- **devops + security**: Infrastructure automation + compliance

---

## 📊 Quality Standards by Persona

| Persona | Key Metric | Target |
|---------|------------|--------|
| Frontend | Load time | <3s on 3G |
| Frontend | Bundle size | <500KB initial |
| Backend | Uptime | 99.9% |
| Backend | API response | <200ms |
| Performance | Core Web Vitals | LCP <2.5s, FID <100ms |
| QA | Test coverage | ≥80% unit, ≥70% integration |
