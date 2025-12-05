# AI Collaboration Hub - Prompts & Use Cases

## Effective Prompts for AI Collaboration

### Code Analysis & Review

**Prompt Templates:**
```
"Analyze this [language] codebase for [specific concerns]. Focus on [areas of interest]."

"Review this code for security vulnerabilities, performance issues, and maintainability concerns."

"Suggest architectural improvements for this [type] application. Consider scalability and best practices."
```

**Example:**
```python
collaborate_with_gemini({
  "session_id": "session_123",
  "content": "Analyze this React application for performance bottlenecks. Focus on component re-renders, bundle size, and API optimization.",
  "context": "[Full React app source code with package.json, components, hooks, etc.]"
})
```

### Documentation Generation

**Prompt Templates:**
```
"Generate comprehensive documentation for this API/library/codebase including examples."

"Create user guides and developer documentation based on this code structure."

"Write technical specifications and architecture diagrams for this system."
```

### Refactoring & Optimization

**Prompt Templates:**
```
"Refactor this code to follow [pattern/principle]. Maintain existing functionality."

"Optimize this code for [performance/readability/maintainability]. Suggest specific improvements."

"Modernize this legacy code to use current best practices and standards."
```

### Testing & Quality Assurance

**Prompt Templates:**
```
"Generate comprehensive test suites for this codebase. Include unit, integration, and e2e tests."

"Identify edge cases and create test scenarios for this functionality."

"Review test coverage and suggest additional test cases."
```

### Architecture & Design

**Prompt Templates:**
```
"Design a scalable architecture for [system requirements]. Consider [constraints]."

"Evaluate this system design and suggest improvements for [goals]."

"Create a migration plan from [current] to [target] architecture."
```

## Context Optimization

### Leveraging 1M Token Context

**Best Practices:**
- Include entire project structure
- Add relevant documentation
- Provide git history for context
- Include configuration files
- Add dependency information

**Context Structure:**
```
"Project Structure:
[file tree]

Key Files:
[important source files]

Configuration:
[package.json, requirements.txt, etc.]

Documentation:
[README, API docs, etc.]

Recent Changes:
[git log or change summary]"
```

### Session Management

**Single-Purpose Sessions:**
- One session per major task/feature
- Clear session goals and scope
- Regular conversation reviews

**Multi-Exchange Workflows:**
- Initial analysis → feedback → refinement
- Question → answer → follow-up
- Proposal → review → iteration

## Domain-Specific Prompts

### Frontend Development
```
"Optimize this React/Vue/Angular component for performance and accessibility."
"Review this CSS for cross-browser compatibility and responsiveness."
"Suggest state management improvements for this frontend application."
```

### Backend Development
```
"Review this API design for RESTful principles and scalability."
"Analyze this database schema for normalization and performance."
"Suggest security improvements for this server implementation."
```

### DevOps & Infrastructure
```
"Review this Docker/Kubernetes configuration for production readiness."
"Optimize this CI/CD pipeline for speed and reliability."
"Suggest infrastructure improvements for this deployment strategy."
```

### Data Science & ML
```
"Review this machine learning pipeline for best practices and optimization."
"Analyze this data processing workflow for efficiency and accuracy."
"Suggest improvements to this model training and evaluation process."
```

## Collaboration Patterns

### Iterative Development
1. **Initial Assessment:** Broad analysis of codebase
2. **Deep Dive:** Focus on specific areas of concern  
3. **Solution Design:** Collaborative problem-solving
4. **Implementation Review:** Code review and refinement

### Peer Programming
1. **Problem Definition:** Clear specification of requirements
2. **Approach Discussion:** Multiple solution strategies
3. **Implementation:** Step-by-step development
4. **Testing & Validation:** Comprehensive verification

### Knowledge Transfer
1. **Code Explanation:** Understanding existing systems
2. **Best Practices:** Learning domain-specific patterns
3. **Troubleshooting:** Debugging and problem resolution
4. **Documentation:** Creating maintainable records

## Advanced Techniques

### Multi-Model Collaboration
- Use Claude for implementation details
- Use Gemini for architectural overview
- Combine perspectives for comprehensive solutions

### Context Chunking
- Break large codebases into logical sections
- Maintain conversation continuity across chunks
- Use session logs to track progress

### Approval Workflows
- Review AI suggestions before implementation
- Maintain human oversight on critical decisions
- Use approval gates for production code changes